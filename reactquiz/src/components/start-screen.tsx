import { PlayCircle } from "lucide-react";
import { useState } from "react";

interface StartScreenProps {
  onStart: () => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = () => {
    if (isStarting) return;
    setIsStarting(true);
    // Small delay to allow multiple clicks to be captured but ignored
    setTimeout(() => {
      onStart();
    }, 100);
  };

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Coding Quiz Game
      </h1>
      <p className="text-gray-600 mb-8">Test your programming knowledge!</p>
      <button
        onClick={handleStart}
        disabled={isStarting}
        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <PlayCircle className="w-5 h-5 mr-2" />
        Start Quiz
      </button>
    </div>
  );
}
