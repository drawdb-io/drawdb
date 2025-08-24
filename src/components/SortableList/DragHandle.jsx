import { IconHandle } from "@douyinfe/semi-icons";
import { useSortable } from "@dnd-kit/sortable";

export function DragHandle({ id, readOnly }) {
  const { listeners } = useSortable({ id });

  return (
    <div
      className={`opacity-50 mt-0.5 ${readOnly ? "cursor-not-allowed" : "cursor-move"}`}
      {...(!readOnly && listeners)}
    >
      <IconHandle />
    </div>
  );
}
