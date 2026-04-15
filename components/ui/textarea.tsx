import * as React from "react";
import { cn } from "./utils";

/**
 * Textarea — Bravo Jewellers 2026 Design System
 * Source: /design/COMPONENT_LIBRARY.md — Form Components
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full px-4 py-3 rounded-[10px] border border-black/[0.06] bg-white",
        "text-[14px] text-[#2B2833] placeholder:text-[#A8A3AE]",
        "shadow-sm shadow-black/[0.02]",
        "focus:outline-none focus:border-[#6B5EF9]/40 focus:ring-4 focus:ring-[#6B5EF9]/10",
        "transition-all resize-none",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "min-h-[80px]",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
