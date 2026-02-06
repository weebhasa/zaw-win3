import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuestions } from "@/hooks/use-questions";
import {
  QuestionCard,
  type Question,
  type AnswerValue,
} from "@/components/quiz/QuestionCard";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";

function isCorrect(q: Question, ans: AnswerValue): boolean {
  if (ans === undefined || ans === null) return false;
  const answer = q as any;
  if (!answer.answer) return false;
  return String(ans).toUpperCase() === String(answer.answer).toUpperCase();
}

export default function TestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionFilename = searchParams.get("session");

  const { questions, loading, error } = useQuestions(
    sessionFilename ? `/${encodeURIComponent(sessionFilename)}` : undefined,
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [sessionIndex, setSessionIndex] = useState(0);

  const totalSessions = useMemo(
    () => (questions ? Math.ceil(questions.length / 20) : 1),
    [questions],
  );

  const start = useMemo(() => {
    if (!questions) return 0;
    if (sessionFilename) return 0;
    return sessionIndex * 20;
  }, [questions, sessionIndex, sessionFilename]);

  const currentQuestions = useMemo(
    () =>
      questions
        ? questions.slice(
            start,
            start + (sessionFilename ? questions.length : 20),
          )
        : [],
    [questions, start, sessionFilename],
  );

  const handleNextQuestion = () => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = () => {
    const resultsData = {
      sessionFilename,
      sessionIndex,
      totalSessions,
      currentQuestions: currentQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        type: q.type,
        answer: q.answer,
        userAnswer: answers[q.id],
      })),
      answers,
    };
    navigate("/results", { state: resultsData });
  };

  const allAnswered = currentQuestions.every(
    (q) => answers[q.id] !== undefined,
  );

  if (error) {
    return (
      <div className="container py-24 text-center text-red-500">{error}</div>
    );
  }

  if (loading) {
    return (
      <div className="container py-24 text-center">Loading questions…</div>
    );
  }

  if (currentQuestions.length === 0) {
    return (
      <div className="container py-24 text-center">No questions available.</div>
    );
  }

  const q = currentQuestions[currentIndex];
  const progress =
    (Object.keys(answers).length / currentQuestions.length) * 100;

  return (
    <div className="container max-w-2xl py-12">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-muted-foreground">
            {Object.keys(answers).length} of {currentQuestions.length}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <QuestionCard
        q={q}
        index={currentIndex}
        total={currentQuestions.length}
        answer={answers[q.id]}
        onChange={(val) => setAnswers({ ...answers, [q.id]: val })}
      />

      <div className="flex gap-4 mt-8">
        <Button
          variant="outline"
          onClick={handlePrevQuestion}
          disabled={currentIndex === 0}
          className="flex-1"
        >
          Previous
        </Button>

        {currentIndex < currentQuestions.length - 1 ? (
          <Button onClick={handleNextQuestion} className="flex-1">
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="flex-1"
          >
            Submit Test
          </Button>
        )}
      </div>

      {totalSessions > 1 && !sessionFilename && (
        <div className="mt-8 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
          Session {sessionIndex + 1} of {totalSessions}
          {sessionIndex < totalSessions - 1 && (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setSessionIndex(sessionIndex + 1);
                setCurrentIndex(0);
                setAnswers({});
              }}
              className="ml-2"
            >
              Next Session
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
