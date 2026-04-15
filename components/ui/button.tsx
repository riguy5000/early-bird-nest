import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

/**
 * Button — Bravo Jewellers 2026 Design System
 * Source: /design/COMPONENT_LIBRARY.md — Button Components
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-[#6B5EF9]/10 focus-visible:border-[#6B5EF9]/40",
  {
    variants: {
      variant: {
        /* Primary dark — main CTA */
        default:
          "bg-[#2B2833] text-white rounded-[10px] font-semibold hover:bg-[#3B3846] shadow-lg shadow-black/10",
        /* Destructive */
        destructive:
          "bg-[#F87171] text-white rounded-[10px] font-semibold hover:bg-[#EF4444] shadow-lg shadow-black/10",
        /* Secondary light */
        outline:
          "bg-white/60 border border-black/[0.06] text-[#2B2833] rounded-[10px] font-medium hover:bg-white/80 shadow-sm shadow-black/[0.02]",
        /* Ghost — hover only */
        secondary:
          "bg-white/60 border border-black/[0.06] text-[#2B2833] rounded-[10px] font-medium hover:bg-white/80 shadow-sm shadow-black/[0.02]",
        ghost:
          "text-[#76707F] hover:text-[#2B2833] hover:bg-white/40 rounded-[10px]",
        link:
          "text-[#6B5EF9] underline-offset-4 hover:underline rounded-none shadow-none",
        /* Accent teal — highlighted action */
        accent:
          "bg-[#2ECCC4] text-white rounded-[12px] font-semibold hover:bg-[#28B8B0] shadow-lg shadow-[#2ECCC4]/20",
      },
      size: {
        default: "h-10 px-5 py-2.5 text-[15px]",
        sm: "h-8 px-4 py-1.5 text-[13px] rounded-[8px]",
        lg: "h-12 px-5 py-3.5 text-[15px]",
        icon: "w-9 h-9 rounded-[8px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
