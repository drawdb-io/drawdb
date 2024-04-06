import { Input } from "@douyinfe/semi-ui";

export default function Rename({ title, setTitle }) {
  return (
    <Input
      placeholder="Diagram name"
      value={title}
      onChange={(v) => setTitle(v)}
    />
  );
}
