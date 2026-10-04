/**
 * Resolve the canvas pan movement produced by a wheel event.
 *
 * Browsers disagree on how Shift + wheel is reported: Chromium on macOS
 * translates the vertical wheel input into a horizontal event (deltaX with
 * deltaY === 0) while other platforms keep the movement in deltaY. Native
 * horizontal wheels and trackpads also report deltaX without Shift.
 *
 * @param {WheelEvent} wheelEvent
 * @returns {{x: number, y: number}} Pan delta in diagram units before zoom scaling.
 */
export function getWheelPanDelta(wheelEvent) {
  if (wheelEvent.shiftKey) {
    return { x: wheelEvent.deltaX || wheelEvent.deltaY, y: 0 };
  }
  return { x: wheelEvent.deltaX, y: wheelEvent.deltaY };
}
