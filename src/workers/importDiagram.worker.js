import { validateImportedDiagram } from "../utils/importDiagram";

self.onmessage = ({ data }) => {
  const startedAt = performance.now();
  const { buffer, format, expectedDatabase } = data;

  try {
    self.postMessage({ type: "progress", progress: 35 });
    let source = new TextDecoder().decode(buffer);
    const diagram = JSON.parse(source);
    source = null;

    self.postMessage({ type: "progress", progress: 65 });
    const validation = validateImportedDiagram(diagram, {
      format,
      expectedDatabase,
    });
    if (!validation.ok) {
      self.postMessage({
        type: "validation-error",
        message: validation.message,
      });
      return;
    }

    self.postMessage({ type: "progress", progress: 90 });
    self.postMessage(
      {
        type: "complete",
        buffer,
        database: validation.database,
        counts: validation.counts,
        duration: performance.now() - startedAt,
      },
      [buffer],
    );
  } catch (_error) {
    self.postMessage({
      type: "validation-error",
      message: "The file contains an error.",
    });
  }
};
