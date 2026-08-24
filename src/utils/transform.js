const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const findFirstNumber = (...values) =>
  values.find((value) => typeof value === "number" && !isNaN(value));

export function applyTransformActions(previous, actions) {
  return actions.reduce((prev, actionOrValue) => {
    const next =
      typeof actionOrValue === "function" ? actionOrValue(prev) : actionOrValue;

    return {
      zoom: clamp(findFirstNumber(next.zoom, prev.zoom, 1), 0.02, 5),
      pan: {
        x: findFirstNumber(next.pan?.x, prev.pan?.x, 0),
        y: findFirstNumber(next.pan?.y, prev.pan?.y, 0),
      },
    };
  }, previous);
}
