"use client";

import { useEffect, useState, useRef } from 'react';

interface EchoModalProps {
  echo: string;
  onClose: () => void;
}

export default function EchoModal({ echo, onClose }: EchoModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Fade in effect
    setTimeout(() => setIsVisible(true), 10);

    // Fetch and synthesize speech
    fetchSpeech();

    // Clean up audio URL on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const fetchSpeech = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/me/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: echo })
      });

      if (!response.ok) {
        throw new Error('TTS Service Unavailable');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const audio = new Audio(url);
      audioRef.current = audio;

      // Register audio handlers
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setError("Playback failed");
      };

      // Play audio automatically
      await audio.play();
    } catch (err: any) {
      console.warn("Speech synthesis failed or was interrupted:", err);
      setError(err.message || "Synthesis failed");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) {
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onplay = () => setIsPlaying(true);
        audio.onpause = () => setIsPlaying(false);
        audio.onended = () => setIsPlaying(false);
        audio.play().catch(err => console.error(err));
      } else {
        fetchSpeech();
      }
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.error(err));
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsVisible(false);
    setTimeout(onClose, 500); // Wait for fade out animation
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* CSS Keyframes for Bounce Equalizer */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes tts-bounce {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1.1); }
        }
        .eq-bar {
          transform-origin: bottom;
          animation: tts-bounce 1s ease-in-out infinite;
        }
        .eq-bar-1 { animation-delay: 0.1s; }
        .eq-bar-2 { animation-delay: 0.3s; }
        .eq-bar-3 { animation-delay: 0.2s; }
        .eq-bar-4 { animation-delay: 0.4s; }
      `}} />

      <div 
        className={`absolute inset-0 bg-[#0e0c0d]/90 backdrop-blur-md transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      
      <div className={`relative w-full max-w-lg bg-[#161314] border border-[#d4af37]/30 rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.15)] overflow-hidden flex flex-col items-center p-8 text-center transition-all duration-500 transform ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}`}>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-32 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.15),transparent_70%)] pointer-events-none" />
        
        {/* Speaking Avatar Container */}
        <div className="relative mb-6">
          {/* Pulsing halo ring */}
          {isPlaying && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-[#d4af37] animate-ping opacity-60" style={{ animationDuration: '2s' }} />
              <div className="absolute -inset-4 rounded-full bg-[#d4af37]/5 blur-md animate-pulse" />
            </>
          )}

          <button 
            onClick={togglePlay}
            disabled={isLoading}
            className={`w-16 h-16 rounded-full bg-gradient-to-tr ${
              isLoading ? 'from-gray-700 to-gray-600' : 'from-[#d4af37] to-[#9d7e1c]'
            } flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)] relative z-10 hover:scale-105 transition-transform active:scale-95`}
            title={isPlaying ? "Pause voice" : "Listen again"}
          >
            {isLoading ? (
              <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : isPlaying ? (
              /* Pause Icon */
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#0e0c0d" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            ) : (
              /* Play / Speak Icon */
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0e0c0d" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Equalizer Visualizer */}
          {isPlaying && (
            <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex items-end gap-1 h-5 z-20 bg-[#161314]/80 px-2 py-1 rounded-full border border-[#d4af37]/30 shadow-md">
              <span className="w-0.5 h-full bg-[#d4af37] eq-bar eq-bar-1 rounded-full" />
              <span className="w-0.5 h-full bg-[#d4af37] eq-bar eq-bar-2 rounded-full" />
              <span className="w-0.5 h-full bg-[#d4af37] eq-bar eq-bar-3 rounded-full" />
              <span className="w-0.5 h-full bg-[#d4af37] eq-bar eq-bar-4 rounded-full" />
            </div>
          )}
        </div>

        <h2 className="text-sm font-semibold text-[#e6dfd5]/40 uppercase tracking-widest mb-4">An Echo from the Archives</h2>
        
        <div className="relative mb-8 w-full">
          <p className="text-xl md:text-2xl font-serif text-[#f3efe0] leading-relaxed italic px-4">
            "{echo}"
          </p>
        </div>

        {error && (
          <div className="text-xs text-[#d4af37]/60 italic mb-4">
            * Liora's voice is resting, reading silently. *
          </div>
        )}

        <div className="flex gap-4">
          {audioUrl && !isPlaying && (
            <button 
              onClick={togglePlay}
              className="px-6 py-2.5 rounded-full border border-[#d4af37]/30 text-[#d4af37]/80 hover:bg-[#d4af37]/10 transition-colors font-medium text-xs tracking-wide"
            >
              Hear Again
            </button>
          )}
          <button 
            onClick={handleClose}
            className="px-8 py-3 rounded-full bg-[#d4af37] text-[#0e0c0d] hover:bg-[#bfa030] transition-colors font-semibold text-sm tracking-wide shadow-lg shadow-[#d4af37]/20"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}

