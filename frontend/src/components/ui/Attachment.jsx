import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const attachmentVariants = cva(
  "relative group flex items-center gap-3 rounded-xl border transition-all duration-200 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#1B1D24] border-[#282B37] hover:border-[#3D4357] hover:bg-[#20232C] shadow-warm-sm",
        outline:
          "bg-transparent border-[#282B37] hover:border-[#3D4357] hover:bg-[#1B1D24]/60",
        subtle:
          "bg-[#14151A] border-[#222530] hover:border-[#282B37] hover:bg-[#181A20]",
        card:
          "bg-[#1B1D24] border-[#282B37] hover:border-[#3D4357] p-3.5 shadow-warm-sm",
      },
      size: {
        default: "p-3 text-xs",
        sm: "p-2 text-xs",
        xs: "p-1.5 text-[11px]",
        lg: "p-4 text-sm",
      },
      layout: {
        horizontal: "flex-row",
        vertical: "flex-col items-start",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      layout: "horizontal",
    },
  }
);

const Attachment = React.forwardRef(
  ({ className, variant, size, layout, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(attachmentVariants({ variant, size, layout, className }))}
        {...props}
      />
    );
  }
);
Attachment.displayName = "Attachment";

const AttachmentMedia = React.forwardRef(
  ({ className, variant = "image", src, alt = "attachment", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-lg bg-[#14151A] border border-[#282B37] flex items-center justify-center text-[#9CA3AF]",
          variant === "image" && "w-12 h-12",
          variant === "icon" && "w-10 h-10 p-2 text-[#34D399] bg-[#10B981]/10 border-[#10B981]/30",
          variant === "lg-image" && "w-20 h-20",
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          children
        )}
      </div>
    );
  }
);
AttachmentMedia.displayName = "AttachmentMedia";

const AttachmentContent = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col min-w-0 flex-1 justify-center space-y-0.5", className)}
      {...props}
    >
      {children}
    </div>
  );
});
AttachmentContent.displayName = "AttachmentContent";

const AttachmentTitle = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "font-display font-semibold text-[#F4F5F7] text-xs truncate tracking-tight block",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});
AttachmentTitle.displayName = "AttachmentTitle";

const AttachmentDescription = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "text-[11px] font-mono text-[#9CA3AF] truncate flex items-center gap-1.5",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});
AttachmentDescription.displayName = "AttachmentDescription";

const AttachmentActions = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-1 shrink-0 ml-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
});
AttachmentActions.displayName = "AttachmentActions";

const AttachmentAction = React.forwardRef(
  ({ className, variant = "ghost", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex items-center justify-center h-7 w-7 rounded-lg text-[#9CA3AF] hover:text-[#F4F5F7] hover:bg-[#2D3140] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3D4357] disabled:opacity-50 disabled:pointer-events-none",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
AttachmentAction.displayName = "AttachmentAction";

const AttachmentGroup = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2 w-full", className)}
      {...props}
    >
      {children}
    </div>
  );
});
AttachmentGroup.displayName = "AttachmentGroup";

export {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentGroup,
  attachmentVariants,
};

export default Attachment;
