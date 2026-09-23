import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveClockProps {
  className?: string;
  showSeconds?: boolean;
}

export function LiveClock({ className, showSeconds = true }: LiveClockProps) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setTime(showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [showSeconds]);

  return (
    <div className={cn("inline-flex items-center gap-1.5 font-mono text-xs text-foreground/80 tracking-wider", className)}>
      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
      <span>{time || "00:00:00"} IST</span>
    </div>
  );
}
