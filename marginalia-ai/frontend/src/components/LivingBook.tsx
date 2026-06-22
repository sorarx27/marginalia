"use client";
import { useState, useRef } from 'react';

export default function LivingBook({ title, author }: { title: string, author: string }) {
  const [style, setStyle] = useState({});
  const [glareStyle, setGlareStyle] = useState({});
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    
    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out',
    });

    setGlareStyle({
      background: `radial-gradient(circle at ${x}px ${y}px, rgba(212, 175, 55, 0.25) 0%, transparent 60%)`
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s ease-out',
    });
    setGlareStyle({
      background: 'transparent'
    });
  };

  return (
    <div 
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex gap-4 p-3 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 hover:border-[#d4af37]/30 transition-colors cursor-pointer group shadow-2xl"
      style={style}
    >
      <div className="absolute inset-0 z-20 pointer-events-none rounded-xl transition-all duration-300" style={glareStyle} />
      <div className="w-12 h-16 bg-[#2a2422] rounded shadow-md border border-white/10 flex-shrink-0 flex items-center justify-center relative overflow-hidden group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all">
         <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/20 to-transparent" />
         <span className="text-[10px] font-serif text-[#d4af37]/70 font-semibold tracking-wider">Book</span>
      </div>
      <div className="flex flex-col justify-center z-10">
        <p className="text-sm font-serif font-medium text-[#f3efe0] group-hover:text-[#d4af37] transition-colors drop-shadow-md">{title}</p>
        <p className="text-xs text-[#e6dfd5]/60 tracking-wide mt-0.5">{author}</p>
      </div>
    </div>
  );
}
