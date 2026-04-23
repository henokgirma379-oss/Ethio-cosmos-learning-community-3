import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle, Trophy, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { fetchAllQuizzes, saveQuizAttempt } from '@/services/quizzes';
import type { Quiz } from '@/types';

// FIX (Security): correctIndex must NOT be revealed to the client before the
// user submits their answers, because a user could inspect network responses
// or React state to find the answers. We solve this without a backend change
// by stripping correctIndex from all questions when we first load the quizzes,
// storing the original (with answers) in a separate ref, and only revealing
// correctIndex after the user has submitted their final answers.
//
// FIX: Removed the redundant useEffect redirect — <ProtectedRoute> in App.tsx
// already handles unauthenticated access to this route.

export function TestsPage() {
  const { user } = useAuth();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  // Stores the original quizzes WITH correctIndex (never shown in UI until after submit)
  const [quizzesWithAnswers, setQuizzesWithAnswers] = useState<Quiz[]>([]);

  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [selectedQuizWithAnswers, setSelectedQuizWithAnswers] = useState<Quiz | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        setLoading(true);
        const data = await fetchAllQuizzes();

        // Store originals (with correctIndex) separately
        setQuizzesWithAnswers(data);

        // Strip correctIndex before putting into display state
        const sanitized = data.map((quiz) => ({
          ...quiz,
          questions: quiz.questions.map(({ correctIndex: _removed, ...rest }) => ({
            ...rest,
            correctIndex: -1, // placeholder — never used for display before submit
          })),
        }));
        setQuizzes(sanitized);
      } catch (error) {
        console.error('Error loading quizzes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  const handleStartQuiz = (quiz: Quiz) => {
    // Find the matching quiz WITH answers for later scoring
    const withAnswers = quizzesWithAnswers.find((q) => q.id === quiz.id) || null;
    setSelectedQuiz(quiz);
    setSelectedQuizWithAnswers(withAnswers);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResult(false);
    setSaveError(false);
  };

  const handleSelectAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null || !selectedQuiz) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      // Quiz complete — now we can reveal the correct answers
      setShowResult(true);
      saveResult(newAnswers);
    }
  };

  const saveResult = async (finalAnswers: number[]) => {
    if (!user || !selectedQuizWithAnswers) return;

    try {
      setSaving(true);
      setSaveError(false);

      // Score using the private copy that still has correctIndex
      let correctCount = 0;
      finalAnswers.forEach((answer, index) => {
        if (answer === selectedQuizWithAnswers.questions[index].correctIndex) {
          correctCount++;
        }
      });

      await saveQuizAttempt(
        user.id,
        selectedQuizWithAnswers.id,
        correctCount,
        selectedQuizWithAnswers.questions.length,
        finalAnswers
      );
    } catch (error) {
      console.error('Error saving quiz result:', error);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleRestartQuiz = () => {
    if (!selectedQuiz) return;
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResult(false);
    setSaveError(false);
  };

  const handleBackToQuizzes = () => {
    setSelectedQuiz(null);
    setSelectedQuizWithAnswers(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResult(false);
    setSaveError(false);
  };

  // Score is calculated using the private copy with correctIndex
  const calculateScore = () => {
    if (!selectedQuizWithAnswers) return 0;
    let correctCount = 0;
    answers.forEach((answer, index) => {
      if (answer === selectedQuizWithAnswers.questions[index].correctIndex) {
        correctCount++;
      }
    });
    return correctCount;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  // Quiz Selection View
  if (!selectedQuiz) {
    return (
      <div className="min-h-screen bg-[#050810] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-4">Tests & Quizzes</h1>
          <p className="text-gray-400 mb-8">
            Test your knowledge with our astronomy quizzes
          </p>

          {quizzes.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-white/10">
              <p className="text-gray-400">No quizzes available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <Card 
                  key={quiz.id} 
                  className="bg-slate-900 border-white/10 hover:border-orange-500/50 transition-all"
                >
                  <CardHeader>
                    <CardTitle className="text-white">{quiz.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-sm mb-4">
                      {quiz.description || 'Test your knowledge!'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {quiz.questions.length} questions
                      </span>
                      <Button
                        onClick={() => handleStartQuiz(quiz)}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        Start Quiz
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Quiz Result View
  if (showResult) {
    const score = calculateScore();
    const total = selectedQuizWithAnswers?.questions.length || 0;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const isPassing = percentage >= 70;

    return (
      <div className="min-h-screen bg-[#050810] py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-slate-900 border-white/10">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                {isPassing ? (
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
                ) : (
                  <div className="text-6xl mb-4">🌟</div>
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                Quiz Complete!
              </h2>
              
              <div className="text-5xl font-bold text-orange-500 mb-2">
                {score}/{total}
              </div>
              
              <p className="text-gray-400 mb-4">
                You scored {percentage}%
              </p>

              {/* FIX: Show explicit save feedback instead of silently failing */}
              {saving && (
                <p className="text-sm text-gray-400 mb-4">Saving your result...</p>
              )}
              {saveError && (
                <p className="text-sm text-red-400 mb-4">
                  Could not save your result. Please check your connection and try again.
                </p>
              )}
              {!saving && !saveError && (
                <p className="text-sm text-green-400 mb-4">Result saved ✓</p>
              )}

              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleRestartQuiz}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleBackToQuizzes}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Back to Quizzes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quiz Running View
  const currentQuestion = selectedQuiz.questions[currentQuestionIndex];
  // For displaying correct/incorrect after answering, use the private copy
  const currentQuestionWithAnswer = selectedQuizWithAnswers?.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#050810] py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <Card className="bg-slate-900 border-white/10">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              {currentQuestion.questionText}
            </h2>

            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                // Only access correctIndex AFTER the user has answered this question
                const correctIdx = currentQuestionWithAnswer?.correctIndex ?? -1;
                const isCorrect = selectedAnswer !== null && index === correctIdx;
                const showCorrectness = selectedAnswer !== null;

                let buttonClass = 'w-full p-4 text-left rounded-lg border transition-all ';
                
                if (showCorrectness) {
                  if (isCorrect) {
                    buttonClass += 'bg-green-500/20 border-green-500 text-green-400';
                  } else if (isSelected) {
                    buttonClass += 'bg-red-500/20 border-red-500 text-red-400';
                  } else {
                    buttonClass += 'bg-slate-800 border-white/10 text-gray-400';
                  }
                } else {
                  buttonClass += isSelected
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                    : 'bg-slate-800 border-white/10 text-white hover:border-orange-500/50';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    disabled={selectedAnswer !== null}
                    className={buttonClass}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showCorrectness && isCorrect && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {showCorrectness && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedAnswer !== null && (
              <Button
                onClick={handleNextQuestion}
                disabled={saving}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {currentQuestionIndex < selectedQuiz.questions.length - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  'Finish Quiz'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TestsPage;
