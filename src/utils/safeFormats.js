/**
 * Custom JSON Schema format validator for URIs.
 *
 * @param {string} input The string to validate.
 * @returns {boolean} True if the input is a valid URI or an empty string, false otherwise.
 */
export function safeUriValidator(input) {
  if (input === "") {
    return true;
  }

  // Trim whitespace from the input.
  const trimmedInput = input.trim();

  try {
    // eslint-disable-next-line no-new
    new URL(trimmedInput);
    return true;
  } catch (e) {
    return false;
  }
}
