import React from 'react';

export const Badge = ({ children, variant = 'primary', className = '' }) => {
  const variants = {
    primary: "bg-[#1C3B2E] text-[#5EEAD4] border-[#2D7351]",
    success: "bg-[#1C3B2E] text-[#5EEAD4] border-[#2D7351]",
    warning: "bg-[#3A2216] text-[#FDBA74] border-[#7D492A]",
    danger: "bg-[#3F1919] text-[#FCA5A5] border-[#872D2D]",
    info: "bg-[#1B2B3D] text-[#93C5FD] border-[#2B4B70]",
    outline: "bg-[#2E2A27] text-[#F4EFEA] border-[#4A433D]",
    secondary: "bg-[#36312D] text-[#B0A698] border-[#4A433D]"
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        variants[variant] || variants.primary
      } ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
