import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type Question = {
  id: number;
  type: "multiple" | "boolean" | "short";
  question: string;
  options?: string[] | Record<string, string>;
  explanation?: string;
};

export type AnswerValue = string | number | undefined;

export function QuestionCard({
  q,
  index,
  total,
  answer,
  onChange,
}: {
  q: Question;
  index: number;
  total: number;
  answer: AnswerValue;
  onChange: (val: AnswerValue) => void;
}) {
  const isAnswered = answer !== undefined && answer !== "";

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
          Question {index + 1} of {total}
        </div>
        <h2 className="text-xl font-semibold leading-snug">{q.question}</h2>
      </div>

      {q.type === "multiple" && q.options && (
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <Button
              key={i}
              onClick={() => onChange(String.fromCharCode(65 + i))}
              variant={
                answer === String.fromCharCode(65 + i) ? "default" : "outline"
              }
              className="w-full justify-start text-base h-auto py-3 px-4"
            >
              <span className="font-semibold mr-3">
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
            </Button>
          ))}
        </div>
      )}

      {q.type === "boolean" && (
        <div className="space-y-2">
          <Button
            onClick={() => onChange("true")}
            variant={answer === "true" ? "default" : "outline"}
            className="w-full"
          >
            True
          </Button>
          <Button
            onClick={() => onChange("false")}
            variant={answer === "false" ? "default" : "outline"}
            className="w-full"
          >
            False
          </Button>
        </div>
      )}

      {q.type === "short" && (
        <input
          type="text"
          value={answer || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
          className="w-full px-4 py-2 border rounded-lg"
        />
      )}

      {q.explanation && isAnswered && (
        <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
          {q.explanation}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm">
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            isAnswered ? "bg-green-500" : "bg-gray-300",
          )}
        />
        {isAnswered ? "Answered" : "Unanswered"}
      </div>
    </div>
  );
}

export function formatAnswer(q: Question) {
  if (q.type === "multiple") {
    return "Multiple choice";
  } else if (q.type === "boolean") {
    return "True/False";
  } else {
    return "Short answer";
  }
}
