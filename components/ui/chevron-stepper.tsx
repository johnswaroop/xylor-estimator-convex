import * as React from "react";
import { cn } from "@/lib/utils";

import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "./separator";

export interface ChevronStepperStep {
  id: string;
  label: string;
  status: "completed" | "current" | "upcoming";
}

export interface ChevronStepperProps {
  statusMapping: Record<string, { step: string; statuses: string[] }>;
  onStepClick?: (stepId: string) => void;
  className?: string;
  selectedStep: string;
  selectedSubStep: string;
  onSubStepClick?: (subStepId: string) => void;
}

const ChevronButton = React.forwardRef<
  HTMLButtonElement,
  {
    step: string;
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
          {step.replace("_", " ")}
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
>(
  (
    {
      statusMapping,
      onStepClick,
      className,
      selectedStep,
      selectedSubStep,
      onSubStepClick,
    },
    ref,
  ) => {
    const subSteps = statusMapping[selectedStep].statuses;

    return (
      <div className="flex flex-col gap-2">
        <div
          ref={ref}
          className={cn(
            "flex items-center overflow-x-auto scrollbar-hide",
            className,
          )}
        >
          {Object.values(statusMapping).map((status, index) => (
            <div key={status.step} className="relative flex-shrink-0">
              <ChevronButton
                step={status.step}
                onClick={() => onStepClick?.(status.step)}
                className={cn(index > 0 && "-ml-4")}
                active={status.step === selectedStep}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <Badge
            variant={selectedSubStep === "ALL" ? "default" : "outline"}
            className="text-xs cursor-pointer flex-shrink-0"
            onClick={() => onSubStepClick?.("ALL")}
          >
            ALL
          </Badge>
          {subSteps.map((subStep) => (
            <div key={subStep} className="relative flex-shrink-0">
              <Badge
                variant={selectedSubStep === subStep ? "default" : "outline"}
                className="text-xs cursor-pointer"
                onClick={() => onSubStepClick?.(subStep)}
              >
                {subStep.replaceAll("_", " ")}
              </Badge>
            </div>
          ))}
        </div>
        <Separator className="mb-2" />
      </div>
    );
  },
);

ChevronStepper.displayName = "ChevronStepper";
