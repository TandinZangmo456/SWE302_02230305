import { TimerIcon } from "lucide-react";

interface TimerProps {
  timeLeft: number;
}

export default function Timer({ timeLeft }: TimerProps) {
  const isLow = timeLeft <= 10;
  const timerClass = isLow 
    ? "flex items-center justify-center space-x-2 text-2xl font-bold mb-8 text-red-600 red warning danger"
    : "flex items-center justify-center space-x-2 text-2xl font-bold text-gray-700 mb-8";

  return (
    <div
      className={timerClass}
      data-testid="timer"
    >
      <TimerIcon className="w-6 h-6" />
      <span>{timeLeft}s</span>
    </div>
  );
}
