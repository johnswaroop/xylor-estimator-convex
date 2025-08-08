import * as React from "react";
import { cn } from "@/lib/utils";

import { ChevronRight } from "lucide-react";

export interface ChevronStepperStep {
  id: string;
  label: string;
  status: "completed" | "current" | "upcoming";
}

export interface ChevronStepperProps {
  steps: ChevronStepperStep[];
  onStepClick?: (stepId: string) => void;
  className?: string;
}

const ChevronButton = React.forwardRef<
  HTMLButtonElement,
  {
    step: ChevronStepperStep;

    onClick?: () => void;
    className?: string;
    active?: boolean;
  }
>(({ step, onClick, className, active }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        className,
        "flex items-center gap-1 border-b border-border hover:bg-muted",
        active && " text-primary border-primary",
      )}
    >
      <div className="flex flex-col gap-1 p-2 hover:bg-muted rounded-lg cursor-pointer">
        <span className="flex text-md font-medium items-center w-full justify-between">
          {step.label}
        </span>
        <span className="flex items-center w-fit gap-1 justify-between text-xs">
          <p>16</p> {"."}
          <p>5 new</p>
        </span>
      </div>
      <ChevronRight className="size-4 text-muted-foreground mx-4" />
    </div>
  );
});

ChevronButton.displayName = "ChevronButton";

export const ChevronStepper = React.forwardRef<
  HTMLDivElement,
  ChevronStepperProps
>(({ steps, onStepClick, className }, ref) => {
  return (
    <div ref={ref} className={cn("flex items-center", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="relative">
          <ChevronButton
            step={step}
            onClick={() => onStepClick?.(step.id)}
            className={cn(index > 0 && "-ml-4")}
            active={step.status === "current"}
          />
        </div>
      ))}
    </div>
  );
});

ChevronStepper.displayName = "ChevronStepper";
