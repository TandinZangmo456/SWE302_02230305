import { CheckCircle, XCircle } from "lucide-react";
import { Question } from "../types/quiz";

interface QuestionCardProps {
  question: Question;
  selectedAnswer: number | null;
  onAnswerSelect: (index: number) => void;
  totalQuestions: number;
  currentQuestion: number;
}

export default function QuestionCard({
  question,
  selectedAnswer,
  onAnswerSelect,
  totalQuestions,
  currentQuestion,
}: QuestionCardProps) {
  const getButtonClass = (index: number): string => {
    if (selectedAnswer === null) return "hover:bg-gray-100";
    
    // If this option is selected, always add selected/bg-blue first
    if (selectedAnswer === index) {
      if (index === question.correct) {
        return "bg-green-100 border-green-500 correct selected bg-blue";
      } else {
        return "bg-red-100 border-red-500 selected bg-blue";
      }
    }
    
    // Show correct answer even if not selected
    if (index === question.correct) {
      return "bg-green-100 border-green-500 correct";
    }
    
    return "opacity-50";
  };

  return (
    <div data-testid="question-card">
      <h2
        className="text-xl font-semibold text-gray-800 mb-2"
        data-testid="question-counter"
      >
        Question {currentQuestion + 1} of {totalQuestions}
      </h2>
      <p className="text-gray-600 mb-4" data-testid="question-text">
        {question.question}
      </p>
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            data-testid="answer-option"
            onClick={() => selectedAnswer === null && onAnswerSelect(index)}
            className={`w-full p-4 text-left border rounded-lg transition-all duration-300 ${getButtonClass(
              index
            )}`}
          >
            <div className="flex items-center justify-between">
              <span>{option}</span>
              {selectedAnswer !== null && index === question.correct && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {selectedAnswer === index && index !== question.correct && (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          </button>
        ))}
      </div>
      {selectedAnswer !== null && (
        <div className={`mt-4 text-center ${selectedAnswer === question.correct ? 'text-green-600' : 'text-red-600'}`} data-testid="feedback">
          {selectedAnswer === question.correct ? (
            <span className="font-semibold green success">Correct!</span>
          ) : (
            <span className="font-semibold red error">Incorrect!</span>
          )}
        </div>
      )}
    </div>
  );
}
