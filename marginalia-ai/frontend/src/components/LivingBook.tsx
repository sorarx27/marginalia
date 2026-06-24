"use client";
import { useState, useRef } from 'react';
import Image from 'next/image';

interface LivingBookProps {
  title: string;
  author: string;
  coverImageUrl?: string | null;
  currentPage?: number;
  totalPages?: number;
  onClick?: () => void;
}

export default function LivingBook({ title, author, coverImageUrl, currentPage = 0, totalPages = 0, onClick }: LivingBookProps) {
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
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="relative flex gap-4 p-3 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 hover:border-[#d4af37]/30 transition-colors cursor-pointer group shadow-2xl"
      style={style}
    >
      <div className="absolute inset-0 z-20 pointer-events-none rounded-xl transition-all duration-300" style={glareStyle} />
      <div className="w-12 h-16 bg-[#2a2422] rounded shadow-md border border-white/10 flex-shrink-0 flex items-center justify-center relative overflow-hidden group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all">
         {coverImageUrl ? (
           <Image src={coverImageUrl} alt={title} fill className="object-cover" />
         ) : (
           <>
             <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/20 to-transparent" />
             <span className="text-[10px] font-serif text-[#d4af37]/70 font-semibold tracking-wider">Book</span>
           </>
         )}
      </div>
      <div className="flex flex-col justify-center z-10 flex-1 min-w-0">
        <p className="text-sm font-serif font-medium text-[#f3efe0] group-hover:text-[#d4af37] transition-colors drop-shadow-md truncate">{title}</p>
        <p className="text-xs text-[#e6dfd5]/60 tracking-wide mt-0.5 truncate">{author}</p>
        
        {totalPages > 0 && (
          <div className="mt-2 w-full max-w-[120px]">
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#d4af37]/60 to-[#d4af37] rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, (currentPage / totalPages) * 100))}%` }} 
              />
            </div>
            <p className="text-[9px] text-[#e6dfd5]/40 mt-1 uppercase tracking-wider">{currentPage} / {totalPages}</p>
          </div>
        )}
      </div>
    </div>
  );
}
