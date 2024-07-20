import { useState } from "react";
import { useEventListener } from "usehooks-ts";

export default function useFullscreen() {
  const [value, setValue] = useState(() => {
    return document.fullscreenElement === document.documentElement;
  });

  function handleFullscreenChange() {
    setValue(document.fullscreenElement === document.documentElement);
  }

  useEventListener("fullscreenchange", handleFullscreenChange, document);

  return value;
}
