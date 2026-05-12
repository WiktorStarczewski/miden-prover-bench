// Shared result storage for the comparison dashboard.
// Each bench page writes its results here; the homepage reads them.

const STORAGE_KEY = "zk-bench-results";

export type BenchResult = {
  ecosystem: string;
  variant: string;
  median: number;
  p25: number;
  p75: number;
  iqr: number;
  n: number;
  samples: number[];
  timestamp: number;
};

export function saveBenchResult(result: BenchResult) {
  try {
    const existing: BenchResult[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
    existing.push(result);
    // Keep only last 50 results
    const trimmed = existing.slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable
  }
}
