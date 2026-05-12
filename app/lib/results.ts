// Shared result storage for the comparison dashboard.
// Each bench page writes its results here; the homepage reads them.

const STORAGE_KEY = "zk-bench-results";

export type BenchResult = {
  ecosystem: string;
  variant: string;
  median: number;       // prove-only median (ms)
  p25: number;
  p75: number;
  iqr: number;
  n: number;
  samples: number[];
  blockWaitMs?: number; // median block inclusion wait (ms), 0 if not applicable
  totalMs?: number;     // median total user wait = prove + block (ms)
  timestamp: number;
};

export function saveBenchResult(result: BenchResult) {
  try {
    const existing: BenchResult[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
    existing.push(result);
    const trimmed = existing.slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable
  }

  // Notify parent window (if running in iframe from dashboard "Run All")
  try {
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "bench-done",
          ecosystem: result.ecosystem,
          median: result.median,
        },
        "*"
      );
    }
  } catch {
    // cross-origin or no parent
  }
}

// Check if ?autorun=1 is in the URL
export function isAutorun(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("autorun") === "1";
}
