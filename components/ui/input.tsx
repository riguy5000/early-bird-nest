import * as React from "react";
import { cn } from "./utils";

/**
 * Input — Bravo Jewellers 2026 Design System
 * Source: /design/COMPONENT_LIBRARY.md — Form Components
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base
        "w-full px-4 py-2.5 rounded-[10px] border border-black/[0.06] bg-white",
        // Typography
        "text-[15px] text-[#2B2833] placeholder:text-[#A8A3AE]",
        // Shadow
        "shadow-sm shadow-black/[0.02]",
        // Focus
        "focus:outline-none focus:border-[#6B5EF9]/40 focus:ring-4 focus:ring-[#6B5EF9]/10",
        // Transition
        "transition-all",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // File input
        "file:text-[#2B2833] file:border-0 file:bg-transparent file:text-[15px] file:font-medium",
        className
      )}
      {...props}
    />
  );
}

export { Input };
