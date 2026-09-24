import { databases } from "../../../../data/databases";

const KILOBYTE = 1024;
const MEGABYTE = 1024 * KILOBYTE;

export const SOURCE = { cloud: "cloud", local: "local" };
export const ALL = "all";

export function formatSize(bytes) {
  if (bytes == null) return "";
  if (bytes >= MEGABYTE) return `${(bytes / MEGABYTE).toFixed(1)}MB`;
  if (bytes >= KILOBYTE) return `${(bytes / KILOBYTE).toFixed(1)}KB`;
  return `${bytes}B`;
}

export function databaseName(database, t) {
  return databases[database]?.name ?? t("generic");
}

export function isOwnEntry(entry, currentUserId) {
  return Boolean(
    entry.owner &&
      currentUserId &&
      String(entry.owner.id) === String(currentUserId),
  );
}

export function ownerLabel(entry, currentUserId, t) {
  const { owner } = entry;
  if (!owner) return null;
  if (isOwnEntry(entry, currentUserId)) return t("you");
  return owner.username || owner.email || t("user_with_id", { id: owner.id });
}

function toDate(value) {
  if (value instanceof Date) return value;
  return value ? new Date(value) : null;
}

function toEntry(raw, source, size) {
  return {
    raw,
    source,
    diagramId: raw.diagramId,
    name: raw.name ?? "",
    database: raw.database || "generic",
    owner: source === SOURCE.cloud ? (raw.owner ?? null) : null,
    size,
    lastModified: toDate(raw.lastModified),
  };
}

export function mergeDiagrams(cloud, local) {
  return [
    ...cloud.map((d) => toEntry(d, SOURCE.cloud, d.sizeBytes ?? 0)),
    ...local.map((d) =>
      toEntry(d, SOURCE.local, JSON.stringify(d).length),
    ),
  ];
}

export function databaseOptions(entries, t) {
  const present = [...new Set(entries.map((entry) => entry.database))];
  return [
    { value: ALL, label: t("all_databases") },
    ...present.map((database) => ({
      value: database,
      label: databaseName(database, t),
    })),
  ];
}

export function filterDiagrams(entries, { query, database, source }) {
  const needle = query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (needle && !entry.name.toLowerCase().includes(needle)) return false;
    if (database !== ALL && entry.database !== database) return false;
    if (source !== ALL && entry.source !== source) return false;
    return true;
  });
}

const comparators = {
  name: (a, b) => a.name.localeCompare(b.name),
  size: (a, b) => a.size - b.size,
  lastModified: (a, b) => timeOf(a) - timeOf(b),
};

function timeOf(entry) {
  return entry.lastModified ? entry.lastModified.getTime() : 0;
}

export function sortDiagrams(entries, { key, dir }) {
  const compare = comparators[key] ?? comparators.lastModified;
  const factor = dir === "asc" ? 1 : -1;
  return [...entries].sort((a, b) => factor * compare(a, b));
}

export function nextSort(current, key) {
  if (current.key === key) {
    return { key, dir: current.dir === "asc" ? "desc" : "asc" };
  }
  return { key, dir: key === "name" ? "asc" : "desc" };
}
