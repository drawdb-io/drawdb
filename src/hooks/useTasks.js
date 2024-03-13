import { useContext } from "react";
import { TasksContext } from "../context/TasksContext";

export default function useTasks() {
  return useContext(TasksContext);
}
