import * as React from "react";
import { cn } from "../../lib/utils";

const Card = React.forwardRef(({ className, hover = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-[#282B37] bg-[#1B1D24] p-5 shadow-warm-sm transition-all duration-200",
      hover && "hover:border-[#3D4357] hover:bg-[#20232C] hover:shadow-warm-hover hover:-translate-y-0.5",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 mb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-base font-display font-bold text-[#F4F5F7] tracking-tight leading-none", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-[#9CA3AF] mt-1 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4 border-t border-[#282B37]", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
export default Card;
