import React, { useEffect, useState, useRef } from 'react';

export const CountUp = ({
  to,
  from = 0,
  duration = 0.8,
  delay = 0,
  decimals = 0,
  className = '',
  suffix = '',
  prefix = ''
}) => {
  const [value, setValue] = useState(from);
  const startTimeRef = useRef(null);

  useEffect(() => {
    let animationFrame;
    const target = Number(to) || 0;
    const initial = Number(from) || 0;
    const durationMs = duration * 1000;

    const timeout = setTimeout(() => {
      const animate = (timestamp) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const progress = Math.min((timestamp - startTimeRef.current) / durationMs, 1);

        // Ease-out cubic curve
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = initial + (target - initial) * easeProgress;

        setValue(current);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          setValue(target);
          startTimeRef.current = null;
        }
      };

      animationFrame = requestAnimationFrame(animate);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animationFrame);
      startTimeRef.current = null;
    };
  }, [to, from, duration, delay]);

  return (
    <span className={className}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export default CountUp;
