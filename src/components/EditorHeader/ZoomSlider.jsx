import { Slider } from "@douyinfe/semi-ui";

const sliderMinimumZoom = 0.05;
const sliderMaximumZoom = 4;
const sliderStepCount = 1000;

// We map the slider to zoom on a log scale, so the same distance of travel
// always multiplies the zoom by the same factor. In fact, 25% to 50% takes as
// much travel as 100% to 200%.
function zoomToSliderValue(zoom) {
  const clampedZoom = Math.min(
    sliderMaximumZoom,
    Math.max(sliderMinimumZoom, zoom),
  );
  return Math.round(
    (Math.log(clampedZoom / sliderMinimumZoom) /
      Math.log(sliderMaximumZoom / sliderMinimumZoom)) *
      sliderStepCount,
  );
}

function sliderValueToZoom(sliderValue) {
  return (
    sliderMinimumZoom *
    Math.pow(
      sliderMaximumZoom / sliderMinimumZoom,
      sliderValue / sliderStepCount,
    )
  );
}

export default function ZoomSlider({ zoom, onChange }) {
  return (
    <div className="w-40 px-1 shrink-0">
      <Slider
        min={0}
        max={sliderStepCount}
        step={1}
        value={zoomToSliderValue(zoom)}
        onChange={(sliderValue) => onChange(sliderValueToZoom(sliderValue))}
        tipFormatter={(sliderValue) =>
          `${Math.round(sliderValueToZoom(sliderValue) * 100)}%`
        }
      />
    </div>
  );
}
