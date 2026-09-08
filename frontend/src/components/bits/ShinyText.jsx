import React from 'react';

export const ShinyText = ({
  text,
  disabled = false,
  speed = 5.5, // Slower, relaxed studio glide
  baseColor = '#D1D5DB', // Refined slate silver
  shineColor = 'rgba(255, 255, 255, 0.85)', // Soft pearl highlight (a bit less shiny, gentle glow)
  className = '',
  children
}) => {
  const content = text || children;

  if (disabled) return <span className={className}>{content}</span>;

  return (
    <span
      className={`inline-block bg-clip-text text-transparent animate-shiny-sweep ${className}`}
      style={{
        backgroundImage: `linear-gradient(115deg, ${baseColor} 0%, ${baseColor} 40%, ${shineColor} 50%, ${baseColor} 60%, ${baseColor} 100%)`,
        backgroundSize: '280% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animationDuration: `${speed}s`,
      }}
    >
      {content}
    </span>
  );
};

export default ShinyText;
