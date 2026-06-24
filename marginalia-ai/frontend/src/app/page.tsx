"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DoorTransition from "@/components/DoorTransition";
import MagicCursor from "@/components/MagicCursor";
import AuthModal from "@/components/AuthModal";

export default function Home() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleEnterLibrary = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsTransitioning(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0e0c0d] text-[#f7f5f3] font-sans antialiased selection:bg-[#d4af37]/30 selection:text-[#f3efe0]">
      <MagicCursor />
      
      {/* Decorative Warm Accent Light */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#d4af37]/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-[#f7f5f3]/5">
        <div className="flex items-center gap-3">
          <span className="text-lg md:text-xl font-bold tracking-wider text-[#e6dfd5] font-serif">
            M A R G I N A L I A
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="text-xs md:text-sm font-medium text-[#e6dfd5]/70 hover:text-[#f3efe0] transition-colors duration-200"
          >
            Log In
          </button>
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="text-xs md:text-sm font-medium px-4 py-2 rounded-lg border border-[#d4af37]/30 hover:border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/5 transition-all duration-300"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-6 md:px-8 py-10 md:py-16 flex flex-col md:flex-row items-center gap-10 md:gap-16 flex-1 justify-center">
        {/* Left Side: Text/Hero */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-6 md:gap-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs md:text-sm text-[#e6dfd5]/80 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
            Meet Liora, Your AI Reading Companion
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold tracking-tight text-[#f3efe0] leading-[1.15]">
              The reading companion that <span className="italic text-[#d4af37]">gets to know you</span>
            </h1>
            <p className="max-w-lg text-[#e6dfd5]/75 text-base md:text-lg leading-relaxed font-light">
              Marginalia is an emotionally intelligent companion designed to remember your reading life, understand your evolving tastes, and offer deeply personalized recommendations over time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-2">
            <button 
              onClick={handleEnterLibrary}
              className="h-12 px-6 md:px-8 rounded-lg bg-[#d4af37] text-[#0e0c0d] font-semibold text-sm hover:bg-[#c29e2f] transition-all duration-300 shadow-lg shadow-[#d4af37]/15 hover:shadow-[#d4af37]/25 flex items-center justify-center gap-2 group w-full sm:w-auto"
            >
              Step inside Liora's Library
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2.5} 
                stroke="currentColor" 
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            
            <button className="h-12 px-6 rounded-lg bg-white/5 border border-white/10 text-[#f3efe0] hover:bg-white/10 font-semibold text-sm transition-all duration-300 backdrop-blur-sm w-full sm:w-auto">
              Learn more
            </button>
          </div>
        </div>

        {/* Right Side: Portrait Frame */}
        <div className="flex-1 max-w-[280px] md:max-w-[380px] w-full flex justify-center mt-4 md:mt-0">
          <div className="relative group w-full aspect-[4/5]">
            {/* Glowing Aura Background */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#d4af37]/30 to-[#9d7e1c]/10 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 pointer-events-none" />
            
            {/* Image Container */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#161314] border border-[#d4af37]/20 p-2 backdrop-blur-xl shadow-2xl">
              <div className="relative w-full h-full rounded-xl overflow-hidden">
                <Image
                  src="/liora_portrait.png"
                  alt="Liora - Your AI Librarian"
                  fill
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  sizes="(max-w-768px) 100vw, 380px"
                />
                
                {/* Vintage Vignette & Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c0d]/80 via-transparent to-black/10 pointer-events-none" />
                
                {/* Small Tag on Image */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between backdrop-blur-md bg-[#0e0c0d]/60 border border-white/10 px-4 py-2.5 rounded-lg">
                  <div>
                    <p className="text-xs font-semibold text-[#f3efe0]">Liora</p>
                    <p className="text-[10px] text-[#e6dfd5]/60">Head Librarian</p>
                  </div>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] md:text-xs text-[#e6dfd5]/40 border-t border-[#f7f5f3]/5 text-center sm:text-left">
        <p>&copy; {new Date().getFullYear()} Marginalia. Your digital reading companion.</p>
        <p className="font-serif italic sm:text-right">"A room without books is like a body without a soul."</p>
      </footer>

      <DoorTransition 
        isAnimating={isTransitioning} 
        onAnimationComplete={() => router.push('/library')} 
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => {
          setIsAuthModalOpen(false);
          setIsTransitioning(true);
        }}
      />
    </div>
  );
}
