import LayoutContextProvider from "../context/LayoutContext";
import TransformContextProvider from "../context/TransformContext";
import TablesContextProvider from "../context/TablesContext";
import UndoRedoContextProvider from "../context/UndoRedoContext";
import SelectContextProvider from "../context/SelectContext";
import AreasContextProvider from "../context/AreasContext";
import NotesContextProvider from "../context/NotesContext";
import TypesContextProvider from "../context/TypesContext";
import TasksContextProvider from "../context/TasksContext";
import SaveStateContextProvider from "../context/SaveStateContext";
import LineContextProvider from "../context/LineContext";
import WorkSpace from "../components/Workspace";

export default function Editor() {
  return (
    <LayoutContextProvider>
      <TransformContextProvider>
        <UndoRedoContextProvider>
          <SelectContextProvider>
            <TasksContextProvider>
              <AreasContextProvider>
                <NotesContextProvider>
                  <TypesContextProvider>
                    <LineContextProvider>
                      <TablesContextProvider>
                        <SaveStateContextProvider>
                          <WorkSpace />
                        </SaveStateContextProvider>
                      </TablesContextProvider>
                    </LineContextProvider>
                  </TypesContextProvider>
                </NotesContextProvider>
              </AreasContextProvider>
            </TasksContextProvider>
          </SelectContextProvider>
        </UndoRedoContextProvider>
      </TransformContextProvider>
    </LayoutContextProvider>
  );
}
