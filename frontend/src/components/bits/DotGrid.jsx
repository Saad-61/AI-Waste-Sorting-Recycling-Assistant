import React, { useEffect, useRef } from 'react';

export const DotGrid = ({
  dotColor = 'rgba(161, 171, 186, 0.42)', // Clear, visible slate
  activeDotColor = 'rgba(52, 211, 153, 0.95)', // Vibrant emerald on hover
  spacing = 20, // Tight, clean matrix
  dotRadius = 1.25,
  bulgeRadius = 125, // Moderated, gentle proximity field
  maxPush = 28, // Soft, controlled bulge force (does not displace dots excessively)
  className = ''
}) => {
  const canvasRef = useRef(null);
  const targetMouseRef = useRef({ x: -1000, y: -1000 });
  const smoothMouseRef = useRef({ x: -1000, y: -1000 });
  const hasMouseEnteredRef = useRef(false);
  const lastMoveTimeRef = useRef(0);
  const activityRef = useRef(0); // 0 = at rest (static cursor), 1 = full motion

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e) => {
      targetMouseRef.current = { x: e.clientX, y: e.clientY };
      lastMoveTimeRef.current = performance.now();
      if (!hasMouseEnteredRef.current) {
        smoothMouseRef.current = { x: e.clientX, y: e.clientY };
        hasMouseEnteredRef.current = true;
      }
    };

    const handleMouseLeave = () => {
      targetMouseRef.current = { x: -1000, y: -1000 };
      hasMouseEnteredRef.current = false;
      activityRef.current = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    let time = 0;
    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Detect cursor motion vs. static idle state
      const now = performance.now();
      const isMoving = hasMouseEnteredRef.current && (now - lastMoveTimeRef.current < 160);
      const targetActivity = isMoving ? 1.0 : 0.0;

      // Inertia relaxation: quick rise on motion, smooth inertia decay back to resting state
      const lerpSpeed = targetActivity > activityRef.current ? 0.22 : 0.065;
      activityRef.current += (targetActivity - activityRef.current) * lerpSpeed;
      if (activityRef.current < 0.002) activityRef.current = 0;

      // Smooth cursor position interpolation
      smoothMouseRef.current.x += (targetMouseRef.current.x - smoothMouseRef.current.x) * 0.35;
      smoothMouseRef.current.y += (targetMouseRef.current.y - smoothMouseRef.current.y) * 0.35;

      const mx = smoothMouseRef.current.x;
      const my = smoothMouseRef.current.y;
      const currentActivity = activityRef.current;

      // Soft radial glow aura in cursor proximity (persists even when cursor is static)
      if (hasMouseEnteredRef.current && mx > -500 && my > -500) {
        const aura = ctx.createRadialGradient(mx, my, 0, mx, my, bulgeRadius);
        aura.addColorStop(0, 'rgba(52, 211, 153, 0.07)');
        aura.addColorStop(0.6, 'rgba(52, 211, 153, 0.02)');
        aura.addColorStop(1, 'rgba(52, 211, 153, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(mx, my, bulgeRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      const cols = Math.ceil(canvas.width / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const originX = i * spacing;
          const originY = j * spacing;

          const dx = originX - mx;
          const dy = originY - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Subtle ambient idle breathing
          const wave = Math.sin(time + (i + j) * 0.16) * 0.15;

          let renderX = originX;
          let renderY = originY;
          let renderRadius = dotRadius + wave * 0.2;
          let fillStyle = dotColor;

          // Proximity interaction: glow stays around cursor, push displacement returns with inertia
          if (dist < bulgeRadius && dist > 0.05) {
            const linearProximity = 1 - (dist / bulgeRadius);

            // 1. Outward push displacement relaxes with inertia back to origin when cursor is static
            if (currentActivity > 0) {
              const factor = 0.5 * (1 + Math.cos((Math.PI * dist) / bulgeRadius));
              const push = factor * maxPush * currentActivity;
              renderX = originX + (dx / dist) * push;
              renderY = originY + (dy / dist) * push;
            }

            // 2. Optical scale expansion and emerald highlight REMAINS active in cursor proximity!
            renderRadius = dotRadius + linearProximity * 1.5;
            if (linearProximity > 0.35) {
              fillStyle = activeDotColor;
            } else {
              fillStyle = `rgba(110, 231, 183, ${0.4 + linearProximity * 0.5})`;
            }
          }

          ctx.fillStyle = fillStyle;
          ctx.beginPath();
          ctx.arc(renderX, renderY, Math.max(0.65, renderRadius), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [spacing, dotRadius, bulgeRadius, maxPush, dotColor, activeDotColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ opacity: 0.95 }}
    />
  );
};

export default DotGrid;
