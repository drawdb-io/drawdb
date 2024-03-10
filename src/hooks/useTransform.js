import { useContext } from "react";
import { TransformContext } from "../context/TransformContext";

export default function useTransform() {
  return useContext(TransformContext);
}
