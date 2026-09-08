import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 flex items-start gap-3 shadow-warm-sm transition-all duration-200 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#1B1D24] border-[#282B37] text-[#F4F5F7]",
        warning:
          "bg-[#1B1D24] border-[#F59E0B]/35 text-[#F4F5F7] shadow-warm-sm",
        destructive:
          "bg-[#1B1D24] border-[#EF4444]/35 text-[#F4F5F7] shadow-warm-sm",
        success:
          "bg-[#1B1D24] border-[#10B981]/35 text-[#F4F5F7] shadow-warm-sm",
        info:
          "bg-[#1B1D24] border-[#3B82F6]/35 text-[#F4F5F7] shadow-warm-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-display font-semibold text-xs tracking-tight leading-none mb-1", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs leading-relaxed font-sans opacity-95", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, alertVariants };
export default Alert;
