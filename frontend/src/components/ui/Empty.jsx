import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const emptyVariants = cva(
  "flex flex-col items-center justify-center text-center select-none",
  {
    variants: {
      variant: {
        default: "rounded-2xl border border-[#282B37] bg-[#1B1D24] p-10 shadow-warm-sm",
        subtle: "rounded-2xl border border-[#222530] bg-[#14151A]/80 p-8",
        ghost: "p-6",
      },
      size: {
        default: "min-h-[220px]",
        sm: "min-h-[160px] p-6",
        lg: "min-h-[300px] p-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Empty = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(emptyVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Empty.displayName = "Empty";

const EmptyHeader = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col items-center justify-center text-center max-w-sm", className)}
      {...props}
    />
  );
});
EmptyHeader.displayName = "EmptyHeader";

const EmptyMedia = React.forwardRef(
  ({ className, variant = "hover", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center shrink-0 mb-4 transition-all duration-300",
          (variant === "hover" || variant === "icon") &&
            "text-[#34D399] transform hover:scale-115 hover:-translate-y-1 cursor-pointer",
          variant === "badge" &&
            "w-14 h-14 rounded-2xl bg-[#222530] border border-[#282B37] text-[#34D399] shadow-sm",
          variant === "subtle" &&
            "w-12 h-12 rounded-xl bg-[#14151A] border border-[#282B37] text-[#9CA3AF]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
EmptyMedia.displayName = "EmptyMedia";

const EmptyTitle = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <h4
      ref={ref}
      className={cn(
        "font-display font-bold text-[#F4F5F7] text-base tracking-tight leading-snug",
        className
      )}
      {...props}
    />
  );
});
EmptyTitle.displayName = "EmptyTitle";

const EmptyDescription = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        "text-xs text-[#9CA3AF] mt-1.5 leading-relaxed font-sans",
        className
      )}
      {...props}
    />
  );
});
EmptyDescription.displayName = "EmptyDescription";

const EmptyContent = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("mt-5 flex items-center justify-center gap-2.5 flex-wrap", className)}
      {...props}
    />
  );
});
EmptyContent.displayName = "EmptyContent";

export {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  emptyVariants,
};

export default Empty;
