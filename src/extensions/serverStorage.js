export async function serverList() {
  const r = await fetch("/api/diagrams");
  if (!r.ok) return [];
  return r.json();
}

export async function serverLoad(id) {
  const r = await fetch(`/api/diagrams/${id}`);
  if (!r.ok) return null;
  return r.json();
}

export async function serverSave(payload) {
  await fetch(`/api/diagrams/${payload.diagramId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
