import React from 'react';

export default function BrandHeader({ 
  title = "EcoSort Studio", 
  version = "v2.0", 
  subtitle = "Autonomous Optical Waste & Material Sorting" 
}) {
  return (
    <div className="flex items-center gap-3.5 select-none">
      {/* 3-Arrow Optical Badge */}
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#2D303A] bg-[#14151A] shadow-md shadow-black/50">
        <svg viewBox="0 0 100 100" className="h-10 w-10" fill="none">
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
            {/* 3 Bold Arrows with uniform static color */}
            <use href="#bold-blade" fill="#34D399" />
            <use href="#bold-blade" transform="rotate(120)" fill="#34D399" />
            <use href="#bold-blade" transform="rotate(240)" fill="#34D399" />

            {/* Enlarged Center Camera Lens & Diode (Static Color) */}
            <circle cx="0" cy="0" r="18" fill="#14151A" stroke="#2D303A" stroke-width="2" />
            <circle cx="0" cy="0" r="11" fill="#34D399" />
            <circle cx="-3" cy="-3" r="3.5" fill="#FFFFFF" />
          </g>
        </svg>
      </div>

      {/* Title, Badge & Subtitle */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[17px] font-bold tracking-tight text-[#F5F4F0]">
            EcoSort <span className="text-[#34D399]">Studio</span>
          </span>
          <span className="rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-2 py-[1px] font-mono text-[10.5px] font-medium text-[#34D399]">
            {version}
          </span>
        </div>
        <span className="text-[11.5px] font-medium tracking-wide text-[#9CA3AF]">
          {subtitle}
        </span>
      </div>
    </div>
  );
}
