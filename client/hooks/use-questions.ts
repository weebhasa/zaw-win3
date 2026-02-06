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
    if (!res.ok) {
      if (res.status === 404 && !url.startsWith("/api/")) {
        // Try API fallback
        const rawFilename = url.split("/").pop();
        if (rawFilename) {
          const decodedFilename = decodeURIComponent(rawFilename);
          const apiRes = await fetch(
            `/api/questions?file=${encodeURIComponent(decodedFilename)}`,
          );
          if (apiRes.ok) return apiRes.json();
        }
      }
      console.error(`Failed to fetch ${url}: HTTP ${res.status}`);
      return null;
    }
    const contentType = res.headers.get("content-type");
    if (contentType && !contentType.includes("application/json")) {
      // If we got HTML but expected JSON, it's likely an SPA fallback
      if (!url.startsWith("/api/")) {
        const rawFilename = url.split("/").pop();
        if (rawFilename) {
          const decodedFilename = decodeURIComponent(rawFilename);
          const apiRes = await fetch(
            `/api/questions?file=${encodeURIComponent(decodedFilename)}`,
          );
          if (apiRes.ok) {
            const apiContentType = apiRes.headers.get("content-type");
            if (apiContentType && apiContentType.includes("application/json")) {
              return apiRes.json();
            }
          }
        }
      }
      console.error(
        `Failed to fetch ${url}: Expected JSON but got ${contentType}`,
      );
      return null;
    }
    return res.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
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
      : (item.options ?? {});
    return {
      id,
      type: (item.type as Question["type"]) ?? "multiple",
      question: String(item.question ?? ""),
      options,
      answer: item.answer ? String(item.answer) : undefined,
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
          const fetchUrl = sourceUrl.endsWith(".json")
            ? sourceUrl
            : `${sourceUrl}.json`;

          try {
            const res = await fetch(fetchUrl);
            if (res.ok) {
              const contentType = res.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                data = await res.json();
              } else {
                console.warn(
                  `Fetch for ${fetchUrl} returned non-JSON content: ${contentType}`,
                );
              }
            }
          } catch (err) {
            console.error(`Error fetching ${fetchUrl}:`, err);
          }

          if (!data) {
            // Try API fallback if static fetch failed
            const rawFilename = sourceUrl.split("/").pop() || "";
            const decodedFilename = decodeURIComponent(rawFilename);
            const apiFetchUrl = `/api/questions?file=${encodeURIComponent(decodedFilename)}`;
            try {
              const res = await fetch(apiFetchUrl);
              if (res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                  data = await res.json();
                }
              }
            } catch (err) {
              console.error(`Error fetching from API ${apiFetchUrl}:`, err);
            }
          }

          if (data) {
            const normalized = normalizeData(data);
            if (mounted) setQuestions(normalized);
          } else {
            if (mounted)
              setError(
                `Failed to load questions from ${fetchUrl}. The file might be missing or the server returned an invalid response.`,
              );
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
            if (mounted) setQuestions([]);
          } else {
            const all: Question[] = [];
            let idCounter = 1;

            for (const set of sets) {
              const data = await safeFetchJson(
                `/${encodeURIComponent(set.filename)}`,
              );
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
