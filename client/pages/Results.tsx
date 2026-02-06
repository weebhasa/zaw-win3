import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { storage } from "@/lib/storage";

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultsData = location.state as any;

  if (!resultsData) {
    return (
      <div className="container py-24 text-center">
        <p className="text-muted-foreground mb-4">No test results found.</p>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    );
  }

  const { currentQuestions, answers, sessionFilename } = resultsData;
  const savedRef = useRef(false);

  const correctCount = currentQuestions.filter(
    (d: any) =>
      String(answers[d.id]).toUpperCase() === String(d.answer).toUpperCase(),
  ).length;
  const percentage = Math.round((correctCount / currentQuestions.length) * 100);

  useEffect(() => {
    if (!savedRef.current && sessionFilename) {
      storage.saveResult({
        sessionFilename,
        score: correctCount,
        total: currentQuestions.length,
        percentage,
        answers,
      });
      savedRef.current = true;
    }
  }, [sessionFilename, correctCount, currentQuestions.length, percentage, answers]);

  const handleRestart = () => {
    if (sessionFilename) {
      navigate(`/test?session=${encodeURIComponent(sessionFilename)}`);
    } else {
      navigate("/test");
    }
  };

  return (
    <div className="container max-w-3xl py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Test Complete!</h1>
        <div className="mb-4">
          <div className="text-6xl font-bold text-primary mb-2">
            {percentage}%
          </div>
          <p className="text-xl text-muted-foreground">
            You scored {correctCount} out of {currentQuestions.length}
          </p>
        </div>

        <div className="mt-8 flex gap-4 justify-center">
          <Button onClick={() => navigate("/")}>Take Another Test</Button>
          <Button variant="outline" onClick={handleRestart}>
            Restart
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Answer Review</h2>

        {currentQuestions.map((d: any) => {
          const isCorrect =
            String(answers[d.id]).toUpperCase() ===
            String(d.answer).toUpperCase();

          return (
            <div key={d.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0" />
                    ) : (
                      <XCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
                    )}
                    <h3 className="font-medium">{d.question}</h3>
                  </div>
                  <div className="ml-7 space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Your answer:
                      </span>{" "}
                      <span
                        className={
                          isCorrect ? "text-green-600" : "text-red-600"
                        }
                      >
                        {answers[d.id]}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div>
                        <span className="text-muted-foreground">
                          Correct answer:
                        </span>{" "}
                        <span className="text-green-600">{d.answer}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
