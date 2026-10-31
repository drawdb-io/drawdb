// The editor labels each relationship line with an abbreviation of the child
// table and of its foreign key column, so time_entry_change_requests with
// requested_by_auth_user_id gets the label "tecr.rbau". A table keeps the same
// abbreviation in every label. The editor never stores a label. Instead, it
// computes the labels from the current tables each time it draws them.

const abbreviationMaxRounds = 24;

function splitIntoWords(name = "") {
  return String(name)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// The editor drops a trailing "id" from a column name, so client_id
// abbreviates to "c".
function splitColumnIntoWords(columnName) {
  const words = splitIntoWords(columnName);
  return words.length > 1 && words[words.length - 1] === "id"
    ? words.slice(0, -1)
    : words;
}

// abbreviateNames starts every distinct name at its initials. When two
// abbreviations clash, it adds one letter per round to the first word where
// the two names differ, so taxable_entities and time_entries become "tae" and
// "tie". It leaves a clash in place when more letters cannot separate the
// names. getRelationshipShortLabels then numbers those labels.
export function abbreviateNames(names, splitName = splitIntoWords) {
  const candidates = [...new Set(names)].map((name) => {
    const words = splitName(name);
    return { name, words, letterCounts: words.map(() => 1) };
  });
  const renderAbbreviation = (candidate) =>
    candidate.words
      .map((word, wordIndex) =>
        word.slice(0, candidate.letterCounts[wordIndex]),
      )
      .join("");

  for (let round = 0; round < abbreviationMaxRounds; round++) {
    const candidatesByAbbreviation = new Map();
    for (const candidate of candidates) {
      const abbreviation = renderAbbreviation(candidate);
      if (!candidatesByAbbreviation.has(abbreviation)) {
        candidatesByAbbreviation.set(abbreviation, []);
      }
      candidatesByAbbreviation.get(abbreviation).push(candidate);
    }

    let lengthenedAny = false;
    for (const clashing of candidatesByAbbreviation.values()) {
      if (clashing.length < 2) continue;
      const mostWords = Math.max(...clashing.map((c) => c.words.length));
      for (let wordIndex = 0; wordIndex < mostWords; wordIndex++) {
        const wordsAtIndex = new Set(clashing.map((c) => c.words[wordIndex]));
        if (wordsAtIndex.size < 2) continue;
        for (const candidate of clashing) {
          const word = candidate.words[wordIndex];
          if (word && candidate.letterCounts[wordIndex] < word.length) {
            candidate.letterCounts[wordIndex] += 1;
            lengthenedAny = true;
          }
        }
        break;
      }
    }
    if (!lengthenedAny) break;
  }

  return new Map(
    candidates.map((candidate) => [
      candidate.name,
      renderAbbreviation(candidate),
    ]),
  );
}

export function getRelationshipShortLabels(relationships, tablesById) {
  const relationshipColumns = relationships.map((relationship) => {
    const childTable = tablesById.get(relationship.startTableId);
    const foreignKeyFieldId =
      relationship.fields?.[0]?.startFieldId ?? relationship.startFieldId;
    const foreignKeyField = childTable?.fields?.find(
      (f) => f.id === foreignKeyFieldId,
    );
    return {
      relationshipId: relationship.id,
      tableName: childTable?.name ?? "",
      columnName: foreignKeyField?.name ?? relationship.name ?? "",
    };
  });

  const tableAbbreviations = abbreviateNames(
    relationshipColumns.map((column) => column.tableName),
  );

  const columnNamesByTableName = new Map();
  for (const { tableName, columnName } of relationshipColumns) {
    if (!columnNamesByTableName.has(tableName)) {
      columnNamesByTableName.set(tableName, new Set());
    }
    columnNamesByTableName.get(tableName).add(columnName);
  }
  const columnAbbreviationsByTableName = new Map();
  for (const [tableName, columnNames] of columnNamesByTableName) {
    columnAbbreviationsByTableName.set(
      tableName,
      abbreviateNames([...columnNames], splitColumnIntoWords),
    );
  }

  const shortLabels = new Map();
  const timesLabelUsed = new Map();
  for (const { relationshipId, tableName, columnName } of relationshipColumns) {
    const label = `${tableAbbreviations.get(tableName)}.${columnAbbreviationsByTableName
      .get(tableName)
      .get(columnName)}`;
    const useCount = (timesLabelUsed.get(label) ?? 0) + 1;
    timesLabelUsed.set(label, useCount);
    shortLabels.set(
      relationshipId,
      useCount === 1 ? label : `${label}${useCount}`,
    );
  }
  return shortLabels;
}
