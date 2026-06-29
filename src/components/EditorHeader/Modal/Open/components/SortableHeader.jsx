export default function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
  className,
  style,
}) {
  const active = sort.key === sortKey;
  const icon =
    active && sort.dir === "asc" ? "bi-caret-up-fill" : "bi-caret-down-fill";

  return (
    <th className={className} style={style}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 cursor-pointer select-none bg-transparent border-0 p-0 hover:opacity-80"
      >
        {label}
        <i className={`bi text-[12px] ${icon} ${active ? "" : "opacity-30"}`} />
      </button>
    </th>
  );
}
