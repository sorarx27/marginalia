"use client";

import { useEffect, useState } from "react";

export default function DoorTransition({ 
  isAnimating, 
  onAnimationComplete 
}: { 
  isAnimating: boolean; 
  onAnimationComplete: () => void 
}) {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    if (isAnimating) {
      setPhase(1); // Darken and show center light
      
      const t1 = setTimeout(() => {
        setPhase(2); // Expand light to blinding flash
      }, 1200);

      const t2 = setTimeout(() => {
        setPhase(3); // Solid white-gold before nav
        onAnimationComplete();
      }, 2000);
      
      return () => { 
        clearTimeout(t1); 
        clearTimeout(t2); 
      };
    }
  }, [isAnimating, onAnimationComplete]);

  if (phase === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Background darkens */}
      <div 
        className={`absolute inset-0 bg-[#0e0c0d] transition-opacity duration-1000 ease-out ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Central expanding light core */}
      <div 
        className={`relative z-10 rounded-full bg-[#f3efe0] mix-blend-screen transition-all duration-1000 ease-in w-0 h-0 opacity-0
          ${phase === 1 ? '!w-4 !h-4 !opacity-100 shadow-[0_0_100px_40px_#d4af37]' : ''}
          ${phase >= 2 ? '!w-[200vw] !h-[200vw] !opacity-100 shadow-none' : ''}
        `}
      />

      {/* Magical swirl particles around the core (CSS animated) */}
      <div className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-500 ${phase === 1 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute w-[200px] h-[200px] border-t-2 border-r-2 border-[#d4af37]/60 rounded-full animate-[spin_1s_linear_infinite]" />
        <div className="absolute w-[300px] h-[300px] border-b-2 border-l-2 border-[#e6dfd5]/40 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
        <div className="absolute w-[150px] h-[150px] border-t-2 border-l-2 border-[#f3efe0]/80 rounded-full animate-[spin_0.8s_linear_infinite]" />
      </div>

      {/* Final solid flash overlay to ensure smooth handoff */}
      <div 
        className={`absolute inset-0 z-30 bg-[#f3efe0] transition-opacity duration-300 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
