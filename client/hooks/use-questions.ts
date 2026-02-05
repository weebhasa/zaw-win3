import { useEffect, useState } from "react";

export type Question = {
  id: number;
  question: string;
  type: "multiple" | "boolean" | "short";
  options: Record<string, string> | string[];
  answer?: string;
  explanation?: string;
};

async function safeFetchJson(url: string): Promise<any> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return null;
  }
}

function normalizeArray(arr: any[]): Question[] {
  return arr.map((item, idx) => {
    const id = item.id ?? idx + 1;
    const options = Array.isArray(item.options)
      ? item.options.reduce(
          (acc, opt, i) => {
            acc[String.fromCharCode(65 + i)] = opt;
            return acc;
          },
          {} as Record<string, string>,
        )
      : item.options ?? {};
    return {
      id,
      type: (item.type as Question["type"]) ?? "multiple",
      question: String(item.question ?? ""),
      options,
      explanation: item.explanation ? String(item.explanation) : undefined,
    } satisfies Question;
  });
}

function normalizeData(data: any): Question[] {
  // Already normalized (array of Question-like objects)
  if (
    Array.isArray(data) &&
    data.length &&
    data[0]?.question &&
    data[0]?.type
  ) {
    return data as Question[];
  }

  // Object with "questions" array and optional metadata
  if (data && Array.isArray(data.questions)) {
    return normalizeArray(data.questions);
  }

  // Raw array of questions
  if (Array.isArray(data)) {
    return normalizeArray(data);
  }

  return [];
}

export function useQuestions(sourceUrl?: string) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (sourceUrl) {
          // Load from specific source
          let data = null;

          if (sourceUrl.startsWith("/")) {
            try {
              const res = await fetch(sourceUrl.endsWith(".json") ? sourceUrl : `${sourceUrl}.json`);
              if (res.ok) {
                data = await res.json();
              }
            } catch {
              try {
                const res = await fetch(`/api${sourceUrl.startsWith("/api") ? sourceUrl : sourceUrl}`);
                if (res.ok) {
                  data = await res.json();
                }
              } catch (e: any) {
                if (mounted) setError(e.message);
              }
            }

            const normalized = normalizeData(data);
            if (mounted) setQuestions(normalized);
          }
        } else {
          // No specific source: discover all sets and aggregate their questions
          let sets = null;
          try {
            sets = await safeFetchJson("/api/question-sets");
          } catch {
            sets = null;
          }

          if (!sets) {
            try {
              sets = await safeFetchJson("/question-sets.json");
            } catch {
              sets = null;
            }
          }

          if (!sets || !Array.isArray(sets) || sets.length === 0) {
            try {
              const data = await safeFetchJson("/mcqs_q1_q210.json");
              const normalized = normalizeData(data);
              if (mounted) setQuestions(normalized);
            } catch (e: any) {
              if (mounted) setQuestions([]);
            }
          } else {
            const all: Question[] = [];
            let idCounter = 1;

            for (const set of sets) {
              const data = await safeFetchJson(`/${encodeURIComponent(set.filename)}`);
              if (data) {
                const normalized = normalizeData(data);
                for (const q of normalized) {
                  q.id = idCounter++;
                }
                all.push(...normalized);
              }
            }

            if (mounted) setQuestions(all);
          }
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load questions");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [sourceUrl]);

  return { questions, loading, error };
}
