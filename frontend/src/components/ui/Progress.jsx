import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../../lib/utils";

const Progress = React.forwardRef(({ className, value, indicatorClassName, indicatorColor, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-[#222530] border border-[#282B37]",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 transition-all duration-500 rounded-full", indicatorClassName)}
      style={{
        transform: `translateX(-${100 - (value || 0)}%)`,
        backgroundColor: indicatorColor || '#34D399'
      }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
export default Progress;
