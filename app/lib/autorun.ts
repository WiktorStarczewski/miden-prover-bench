// Check if ?autorun=N is in the URL. Returns N or 0.
export function getAutorunCycles(): number {
  if (typeof window === "undefined") return 0;
  const params = new URLSearchParams(window.location.search);
  const val = params.get("autorun");
  return val ? parseInt(val, 10) || 0 : 0;
}
