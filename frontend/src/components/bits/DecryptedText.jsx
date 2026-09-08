import React, { useEffect, useState, useRef } from 'react';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

export const DecryptedText = ({
  text = '',
  speed = 35,
  maxIterations = 10,
  sequential = true,
  className = '',
  revealDirection = 'start',
  animateOn = 'mount'
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    let interval;
    let iteration = 0;
    const targetLength = text.length;

    const startAnimation = () => {
      interval = setInterval(() => {
        setDisplayText((prev) =>
          text
            .split('')
            .map((char, index) => {
              if (char === ' ') return ' ';

              if (sequential) {
                if (index < iteration / maxIterations * targetLength) {
                  return text[index];
                }
              } else {
                if (iteration >= maxIterations) {
                  return text[index];
                }
              }

              return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
            })
            .join('')
        );

        iteration += 1;
        if (iteration > maxIterations * (sequential ? 1.5 : 1)) {
          clearInterval(interval);
          setDisplayText(text);
        }
      }, speed);
    };

    startAnimation();

    return () => clearInterval(interval);
  }, [text, speed, maxIterations, sequential]);

  return (
    <span className={className}>
      {displayText}
    </span>
  );
};

export default DecryptedText;
