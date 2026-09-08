import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#222530] hover:bg-[#2D3140] text-[#F4F5F7] border border-[#282B37] shadow-warm-sm focus-visible:ring-[#3D4357]",
        primary:
          "bg-[#222530] hover:bg-[#2D3140] text-[#F4F5F7] border border-[#282B37] shadow-warm-sm focus-visible:ring-[#3D4357]",
        secondary:
          "bg-[#1B1D24] hover:bg-[#222530] text-[#F4F5F7] border border-[#282B37] shadow-warm-sm focus-visible:ring-[#3D4357]",
        evergreen:
          "bg-[#10B981] hover:bg-[#059669] text-white shadow-warm-sm focus-visible:ring-[#10B981] border border-[#10B981]/30",
        outline:
          "bg-transparent border border-[#282B37] hover:bg-[#222530] text-[#F4F5F7] focus-visible:ring-[#3D4357]",
        destructive:
          "bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-warm-sm focus-visible:ring-[#E11D48]",
        danger:
          "bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-warm-sm focus-visible:ring-[#E11D48]",
        ghost:
          "bg-transparent hover:bg-[#222530] text-[#9CA3AF] hover:text-[#F4F5F7] focus-visible:ring-[#3D4357]",
        link:
          "text-[#34D399] underline-offset-4 hover:underline",
      },
      size: {
        default: "px-4 py-2 text-xs gap-2",
        sm: "px-3 py-1.5 text-xs gap-1.5",
        md: "px-4 py-2 text-xs gap-2",
        lg: "px-5 py-2.5 text-sm gap-2",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
export default Button;
