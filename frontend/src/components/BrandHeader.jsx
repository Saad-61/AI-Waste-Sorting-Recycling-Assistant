import React from 'react';
import ShinyText from './bits/ShinyText';

export default function BrandHeader({ 
  title = "RecycleLens", 
  version = "v2.0", 
  subtitle = "Autonomous Optical Waste & Material Sorting" 
}) {
  return (
    <div className="flex items-center gap-3.5 select-none">
      {/* 3-Arrow Optical Emblem - Hanging directly on background without enclosing box */}
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
        <svg 
          viewBox="0 0 100 100" 
          className="h-11 w-11 transition-transform duration-500 hover:rotate-45" 
          fill="none"
        >
          <defs>
            {/* Bold, Enlarged Arrow Blade definition filling the 100x100 canvas */}
            <path id="bold-blade" d="
              M 26.5 -15.3
              L 36.4 -21.0
              A 42 42 0 0 1 25.9 33.1
              L 29.7 35.4
              L 12.4 34.1
              L 17.0 20.2
              L 18.8 24.1
              A 30.6 30.6 0 0 0 26.5 -15.3
              Z
            " />
          </defs>

          <g transform="translate(50, 50)">
            {/* 3 Bold Arrows with uniform static emerald color */}
            <use href="#bold-blade" fill="#34D399" />
            <use href="#bold-blade" transform="rotate(120)" fill="#34D399" />
            <use href="#bold-blade" transform="rotate(240)" fill="#34D399" />

            {/* Enlarged Center Camera Lens & Diode (Hangs cleanly on #14151A) */}
            <circle cx="0" cy="0" r="18" fill="#14151A" stroke="#282B37" stroke-width="2" />
            <circle cx="0" cy="0" r="11" fill="#34D399" />
            <circle cx="-3" cy="-3" r="3.5" fill="#FFFFFF" />
          </g>
        </svg>
      </div>

      {/* Title & Subtitle */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[17px] font-bold tracking-tight">
            <ShinyText speed={5.5}>
              Recycle
            </ShinyText>
            <span className="text-[#34D399]">Lens</span>
          </span>
        </div>
        <span className="text-[11.5px] font-medium tracking-wide text-[#9CA3AF]">
          {subtitle}
        </span>
      </div>
    </div>
  );
}
