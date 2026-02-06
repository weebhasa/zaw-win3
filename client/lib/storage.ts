export interface StoredResult {
  sessionFilename: string;
  score: number;
  total: number;
  percentage: number;
  date: string;
  answers: Record<number, any>;
}

const STORAGE_KEY = "quizcraft_results";

export const storage = {
  saveResult(result: Omit<StoredResult, "date">) {
    try {
      const results = this.getAllResults();
      const newResult: StoredResult = {
        ...result,
        date: new Date().toISOString(),
      };
      
      // Keep only the latest result for each sessionFilename to avoid bloat, 
      // or we can keep a history. Let's keep a history but also allow quick lookup for "latest".
      results.push(newResult);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch (e) {
      console.error("Failed to save result to localStorage", e);
    }
  },

  getAllResults(): StoredResult[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load results from localStorage", e);
      return [];
    }
  },

  getLatestResult(sessionFilename: string): StoredResult | null {
    const results = this.getAllResults();
    const filtered = results
      .filter((r) => r.sessionFilename === sessionFilename)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return filtered[0] || null;
  }
};
