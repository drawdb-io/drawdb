import { Validator } from "jsonschema";
import { ddbSchema, jsonSchema } from "../data/schemas";
import { safeUriValidator } from "./safeFormats";

const validator = new Validator();
validator.customFormats.uri = safeUriValidator;

export function jsonDiagramIsValid(obj) {
  return validator.validate(obj, jsonSchema).valid;
}

export function ddbDiagramIsValid(obj) {
  return validator.validate(obj, ddbSchema).valid;
}
