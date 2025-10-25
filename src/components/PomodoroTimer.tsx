import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const POMODORO_TIME = 25 * 60; // 25 minutes in seconds
const BREAK_TIME = 5 * 60; // 5 minutes in seconds

export const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Auto-switch between work and break
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

  const progress = ((isBreak ? BREAK_TIME : POMODORO_TIME) - timeLeft) / (isBreak ? BREAK_TIME : POMODORO_TIME) * 100;

  return (
    <Card className="p-8 text-center space-y-6 bg-gradient-to-br from-card to-muted/20">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-muted-foreground">
          {isBreak ? "Break Time" : "Focus Time"}
        </h3>
        <div className="text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {formatTime(timeLeft)}
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex gap-3 justify-center">
        <Button
          onClick={() => setIsRunning(!isRunning)}
          size="lg"
          className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg"
        >
          {isRunning ? (
            <>
              <Pause className="h-5 w-5 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Start
            </>
          )}
        </Button>
        <Button onClick={handleReset} size="lg" variant="outline">
          <RotateCcw className="h-5 w-5 mr-2" />
          Reset
        </Button>
      </div>
    </Card>
  );
};
