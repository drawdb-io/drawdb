import { Validator } from "jsonschema";
import { ddbSchema, jsonSchema } from "../data/schemas";

function jsonDiagramIsValid(obj) {
  return new Validator().validate(obj, jsonSchema).valid;
}

function ddbDiagramIsValid(obj) {
  return new Validator().validate(obj, ddbSchema).valid;
}

export { jsonDiagramIsValid, ddbDiagramIsValid };
