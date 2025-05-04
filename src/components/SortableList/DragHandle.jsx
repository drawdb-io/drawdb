import { IconHandle } from "@douyinfe/semi-icons";
import { useSortable } from "@dnd-kit/sortable";

export function DragHandle({ id }) {
  const { listeners } = useSortable({ id });
  return (
    <div
      className="flex cursor-move items-center justify-center opacity-50 mt-0.5"
      {...listeners}
    >
      <IconHandle />
    </div>
  );
}
