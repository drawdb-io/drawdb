import { useLine } from "../../hooks";

export default function Line() {
  const { linkingLine, linking } = useLine();

  return (
    <>
      {linking && (
        <path
          d={`M ${linkingLine.startX} ${linkingLine.startY} L ${linkingLine.endX} ${linkingLine.endY}`}
          stroke="red"
          strokeDasharray="8,8"
          className="pointer-events-none"
        />
      )}
    </>
  );
}
