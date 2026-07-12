const DISMISSED_BANNERS_KEY = "drawdb:dismissedBanners";

export function readDismissedBanners() {
  try {
    return new Set(
      JSON.parse(localStorage.getItem(DISMISSED_BANNERS_KEY) || "[]"),
    );
  } catch {
    return new Set();
  }
}

export function addDismissedBanner(prev, key) {
  const next = new Set(prev).add(key);
  localStorage.setItem(DISMISSED_BANNERS_KEY, JSON.stringify([...next]));
  return next;
}
