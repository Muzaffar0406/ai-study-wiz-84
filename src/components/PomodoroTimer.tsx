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
  const circumference = 2 * Math.PI * 88;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="glass rounded-2xl p-8 text-center space-y-6">
      {/* Circular progress */}
      <div className="relative w-52 h-52 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="88" fill="none" className="stroke-muted" strokeWidth="6" />
          <circle
            cx="100" cy="100" r="88" fill="none"
            className={isBreak ? "stroke-accent" : "stroke-primary"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            {isBreak ? "Break" : "Focus"}
          </span>
          <span className="text-5xl font-extrabold tracking-tight text-gradient">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <Button
          onClick={() => setIsRunning(!isRunning)}
          size="lg"
          className="rounded-xl px-8 bg-gradient-to-r from-primary to-primary-glow hover:shadow-[0_8px_30px_hsl(var(--primary)/0.3)] transition-all duration-300"
        >
          {isRunning ? (
            <><Pause className="h-5 w-5 mr-2" />Pause</>
          ) : (
            <><Play className="h-5 w-5 mr-2" />Start</>
          )}
        </Button>
        <Button onClick={handleReset} size="lg" variant="outline" className="rounded-xl">
          <RotateCcw className="h-5 w-5 mr-2" />Reset
        </Button>
      </div>
    </div>
  );
};