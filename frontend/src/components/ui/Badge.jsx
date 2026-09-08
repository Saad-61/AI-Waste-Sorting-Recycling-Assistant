import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[#0E261D] text-[#34D399] border-[#1B523B]",
        primary:
          "bg-[#0E261D] text-[#34D399] border-[#1B523B]",
        success:
          "bg-[#0E261D] text-[#34D399] border-[#1B523B]",
        warning:
          "bg-[#29210C] text-[#FBBF24] border-[#5C4916]",
        danger:
          "bg-[#2B1216] text-[#F87171] border-[#5C2028]",
        destructive:
          "bg-[#2B1216] text-[#F87171] border-[#5C2028]",
        info:
          "bg-[#132338] text-[#60A5FA] border-[#1E3A5F]",
        outline:
          "bg-[#1B1D24] text-[#F4F5F7] border-[#282B37]",
        secondary:
          "bg-[#222530] text-[#9CA3AF] border-[#282B37]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
export default Badge;
