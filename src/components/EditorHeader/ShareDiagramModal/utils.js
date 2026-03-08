import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from "unique-names-generator";

export function generateRandomName() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: " ",
    length: 2,
    style: "capital",
  });
}
