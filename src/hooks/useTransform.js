import { useContext } from "react";
import { TransformContext } from "../context/TransformContext";

/**
 * @returns {DrawDB.TransformContext}
 */
export default function useTransform() {
  return useContext(TransformContext);
}
