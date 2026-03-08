import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

const POMODORO_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

export const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsBreak(!isBreak);
      setTimeLeft(isBreak ? POMODORO_TIME : BREAK_TIME);
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setTimeLeft(isBreak ? BREAK_TIME : POMODORO_TIME);
    setIsRunning(false);
  };

  const totalTime = isBreak ? BREAK_TIME : POMODORO_TIME;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const circumference = 2 * Math.PI * 70;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-[var(--shadow-soft)] text-center space-y-5">
      <div className="relative w-44 h-44 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="70" fill="none" className="stroke-muted" strokeWidth="6" />
          <circle
            cx="80" cy="80" r="70" fill="none"
            className="stroke-primary"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {isBreak ? "Break" : "Focus"}
          </span>
          <span className="text-4xl font-extrabold tracking-tight text-foreground">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <Button
          onClick={() => setIsRunning(!isRunning)}
          className="rounded-xl px-6 bg-primary hover:bg-primary/90"
        >
          {isRunning ? <><Pause className="h-4 w-4 mr-1.5" />Pause</> : <><Play className="h-4 w-4 mr-1.5" />Start</>}
        </Button>
        <Button onClick={handleReset} variant="outline" className="rounded-xl">
          <RotateCcw className="h-4 w-4 mr-1.5" />Reset
        </Button>
      </div>
    </div>
  );
};