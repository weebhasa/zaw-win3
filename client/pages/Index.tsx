import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuestionSets } from "@/hooks/use-question-sets";
import { storage, type StoredResult } from "@/lib/storage";
import { History, Calendar } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectTrigger,
  SelectValue,
  SelectLabel,
} from "@/components/ui/select";

export default function Index() {
  const { sets, loading: setsLoading } = useQuestionSets();

  // Group sets by base title
  const groups = useMemo(() => {
    if (!sets) return [] as { base: string; items: typeof sets }[];
    const map = new Map<string, typeof sets>();
    for (const s of sets) {
      // Improved regex to handle "Part X", "Part X Questions", etc.
      // It looks for "Part" preceded by space, hyphen or nothing.
      const m = s.title.match(/^(.*?)(?:\s*[-–—]?\s*)\bPart\b\s*\d+/i);
      const base = m ? m[1].trim() : s.title;
      if (!map.has(base)) map.set(base, [] as typeof sets);
      map.get(base)!.push(s);
    }

    return Array.from(map.entries())
      .map(([base, items]) => ({
        base,
        items: items.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }))
      }))
      .sort((a, b) => a.base.localeCompare(b.base, undefined, { numeric: true, sensitivity: 'base' }));
  }, [sets]);

  const [selectedBase, setSelectedBase] = useState<string>("\0");
  const [selectedPart, setSelectedPart] = useState<string>("");

  // Initialize selection when groups load
  useEffect(() => {
    if (!groups || groups.length === 0) return;
    const first = groups[0];
    setSelectedBase(first.base);
    setSelectedPart(first.items[0]?.filename ?? "");
  }, [groups]);

  const isLoading = setsLoading;

  const currentGroup = useMemo(
    () => groups.find((g) => g.base === selectedBase) ?? null,
    [groups, selectedBase],
  );

  const startSessionFilename =
    selectedPart || (currentGroup?.items?.[0]?.filename ?? "");

  const lastResult = useMemo(() => {
    if (!startSessionFilename) return null;
    return storage.getLatestResult(startSessionFilename);
  }, [startSessionFilename]);

  return (
    <main className="relative">
      <section className="bg-gradient-to-br from-primary/10 via-background to-fuchsia-100/40 py-16 sm:py-24">
        <div className="container max-w-4xl">
          <h1 className="text-balance bg-gradient-to-r from-primary to-fuchsia-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            Building Maintenance & Safety Quiz
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Prepare for your engineering and maintenance certification exams with
            our comprehensive collection of practice questions and mock tests.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-64">
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Choose test set
                </label>
                <Select
                  value={selectedBase}
                  onValueChange={(v) => {
                    setSelectedBase(v);
                    const g = groups.find((gg) => gg.base === v);
                    if (g && g.items && g.items.length)
                      setSelectedPart(g.items[0].filename);
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select test set" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.base} value={g.base}>
                        {g.base}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentGroup && currentGroup.items.length > 1 && (
                <div className="w-full sm:w-64">
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Part
                  </label>
                  <Select
                    value={selectedPart}
                    onValueChange={(v) => setSelectedPart(v)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose part" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentGroup.items.map((it) => {
                        const partMatch = it.title.match(/\bPart\b\s*\d+/i);
                        const label = partMatch ? partMatch[0] : it.title;
                        return (
                          <SelectItem key={it.filename} value={it.filename}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="w-full sm:w-auto">
              <Button asChild size="lg" className="w-full sm:w-48">
                <Link
                  to={`/test?session=${encodeURIComponent(startSessionFilename)}`}
                >
                  {lastResult ? "Retake Test" : "Start Test"}
                </Link>
              </Button>
            </div>
          </div>

          {lastResult && (
            <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="inline-flex items-center gap-4 rounded-xl border bg-card/50 p-4 backdrop-blur shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <History className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Last Attempt</div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">{lastResult.percentage}%</span>
                    <span className="text-sm text-muted-foreground">({lastResult.score}/{lastResult.total})</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground/80">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(lastResult.date), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-4xl">
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold">How it works</h2>
            <ul className="mt-4 grid list-disc gap-3 pl-6 text-muted-foreground">
              <li>
                One question displayed at a time with Next/Previous navigation.
              </li>
              <li>
                A progress bar indicates how many questions you have answered.
              </li>
              <li>
                Results page shows your score, correct answers, and answer
                review.
              </li>
              <li>
                Your best scores are saved locally so you can track your progress.
              </li>
              <li>Restart the test anytime to try again.</li>
              <li>Fully responsive and mobile-friendly UI.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
