import { useEffect, useState } from "react";

export type QuestionSet = {
  filename: string;
  title: string;
};

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useQuestionSets() {
  const [sets, setSets] = useState<QuestionSet[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        let data;

        try {
          data = await fetchJson("/api/question-sets");
        } catch {
          try {
            data = await fetchJson("/question-sets.json");
          } catch (e: any) {
            if (mounted) setError(e.message);
            data = [];
          }
        }

        if (mounted) setSets(Array.isArray(data) ? data : []);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return { sets, loading, error };
}
