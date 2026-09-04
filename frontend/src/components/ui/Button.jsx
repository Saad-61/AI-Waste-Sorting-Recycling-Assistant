import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#36312D] hover:bg-[#433D37] text-[#F4EFEA] border border-[#4A433D] shadow-warm-sm focus:ring-[#635A52]",
    secondary: "bg-[#2E2A27] hover:bg-[#36312D] text-[#F4EFEA] border border-[#4A433D] shadow-warm-sm focus:ring-[#635A52]",
    evergreen: "bg-[#1F5A3B] hover:bg-[#28734C] text-white shadow-warm-sm focus:ring-[#1F5A3B]",
    outline: "bg-transparent border border-[#4A433D] hover:bg-[#36312D] text-[#F4EFEA] focus:ring-[#635A52]",
    danger: "bg-[#872D2D] hover:bg-[#A13737] text-white shadow-warm-sm focus:ring-[#872D2D]",
    ghost: "bg-transparent hover:bg-[#36312D] text-[#B0A698] hover:text-[#F4EFEA] focus:ring-[#635A52]"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs gap-2",
    lg: "px-5 py-2.5 text-sm gap-2"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
