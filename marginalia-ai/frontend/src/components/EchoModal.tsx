"use client";

import { useEffect, useState } from 'react';

interface EchoModalProps {
  echo: string;
  onClose: () => void;
}

export default function EchoModal({ echo, onClose }: EchoModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in effect
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 500); // Wait for fade out animation
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className={`absolute inset-0 bg-[#0e0c0d]/90 backdrop-blur-md transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      
      <div className={`relative w-full max-w-lg bg-[#161314] border border-[#d4af37]/30 rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.15)] overflow-hidden flex flex-col items-center p-8 text-center transition-all duration-500 transform ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}`}>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-32 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.15),transparent_70%)] pointer-events-none" />
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#9d7e1c] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(212,175,55,0.4)] relative">
            <div className="absolute inset-0 rounded-full border-2 border-[#d4af37] animate-ping opacity-50" style={{ animationDuration: '3s' }} />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0e0c0d" className="w-8 h-8 z-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
        </div>

        <h2 className="text-sm font-semibold text-[#e6dfd5]/40 uppercase tracking-widest mb-4">An Echo from the Archives</h2>
        
        <p className="text-xl md:text-2xl font-serif text-[#f3efe0] leading-relaxed mb-8 italic">
          "{echo}"
        </p>

        <button 
          onClick={handleClose}
          className="px-8 py-3 rounded-full border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors font-medium text-sm tracking-wide"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}
