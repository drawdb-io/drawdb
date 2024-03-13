import { createContext, useState } from "react";

export const TasksContext = createContext(null);

export default function TasksContextProvider({ children }) {
  const [tasks, setTasks] = useState([]);

  const updateTask = (id, values) =>
    setTasks((prev) =>
      prev.map((task, i) => (id === i ? { ...task, ...values } : task))
    );

  return (
    <TasksContext.Provider value={{ tasks, setTasks, updateTask }}>
      {children}
    </TasksContext.Provider>
  );
}
