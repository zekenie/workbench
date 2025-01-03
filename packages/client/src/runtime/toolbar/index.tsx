import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pause, Play, Maximize2, Power, Loader2 } from "lucide-react";

export type VMState =
  | "created"
  | "starting"
  | "started"
  | "stopping"
  | "stopped"
  | "suspending"
  | "suspended"
  | "replacing"
  | "destroying"
  | "destroyed";

export type VMAction = "start" | "suspend" | "resume" | "stop";

interface RuntimeControlToolbarProps {
  state: VMState;
  onAction: (action: VMAction) => void;
  className?: string;
}

const getStateStyles = (state?: VMState): string => {
  switch (state) {
    case "started":
      return "bg-green-500 hover:bg-red-600 text-white";
    case "suspended":
      return "bg-yellow-500 hover:bg-red-600 text-white";
    case "destroying":
    case "destroyed":
      return "bg-red-500 hover:bg-red-600 text-white";
    default:
      return "hover:bg-gray-100";
  }
};

const ActionButton = ({
  icon,
  label,
  onClick,
  state,
  className = "",
  disabled = false,
  ...props
}: {
  icon: JSX.Element;
  label: string;
  onClick: () => void;
  state?: VMState;
  className?: string;
  disabled?: boolean;
}) => {
  return (
    <div className="relative group">
      <Tooltip data-side="right" delayDuration={100}>
        <TooltipTrigger asChild>
          <button
            className={`
              p-1 rounded transition-colors
              ${getStateStyles(state)}
              ${className}
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
            onClick={onClick}
            aria-label={label}
            disabled={disabled}
            {...props}
          >
            {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-xs" side="right">
          {label}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export function RuntimeControlToolbar({
  state,
  onAction,
  className = "",
}: RuntimeControlToolbarProps) {
  // Check if VM is in a transitional state
  const isTransitioning = state.endsWith("ing");

  // Check if VM is running or suspended
  const couldBeConsideredOnInSomeCapacity =
    state === "started" ||
    state === "suspended" ||
    state === "suspending" ||
    state === "starting";

  return (
    <div
      className={`fixed bg-slate-50 shadow left-2 top-12 border rounded-lg p-1 z-10 ${className}`}
    >
      <div className="flex  flex-col items-center gap-1">
        {/* Power Button - Always visible */}
        <ActionButton
          icon={
            isTransitioning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Power className="h-3 w-3" />
            )
          }
          label={couldBeConsideredOnInSomeCapacity ? "Stop" : "Start"}
          onClick={() =>
            onAction(couldBeConsideredOnInSomeCapacity ? "stop" : "start")
          }
          state={state}
          disabled={isTransitioning}
        />

        {/* Suspend/Resume Button - Only visible when running or suspended */}
        {couldBeConsideredOnInSomeCapacity && (
          <ActionButton
            icon={
              state === "started" ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )
            }
            label={state === "started" ? "Pause" : "Resume"}
            onClick={() => onAction(state === "started" ? "suspend" : "resume")}
            disabled={isTransitioning}
          />
        )}

        {/* Expand Button */}
        <ActionButton
          icon={<Maximize2 className="h-3 w-3" />}
          label="Expand"
          onClick={() => {}}
        />
      </div>
    </div>
  );
}
