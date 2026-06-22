"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export default function MagicCursor() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    let particleId = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Create 1-2 particles per mouse move event
      const numParticles = Math.random() > 0.5 ? 2 : 1;
      
      const newParticles: Particle[] = Array.from({ length: numParticles }).map(() => {
        // Colors ranging from bright white-gold to deeper amber
        const colors = ['#f3efe0', '#e6dfd5', '#d4af37', '#c29e2f', '#9d7e1c'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        return {
          id: particleId++,
          // Add slight random offset to mouse position
          x: e.clientX + (Math.random() * 20 - 10),
          y: e.clientY + (Math.random() * 20 - 10),
          // Random size between 2px and 6px
          size: Math.random() * 4 + 2,
          color: randomColor,
        };
      });

      setParticles((prev) => [...prev, ...newParticles].slice(-40)); // Keep max 40 particles
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Cleanup loop to fade out particles
    const interval = setInterval(() => {
      setParticles((prev) => prev.slice(1)); // Remove the oldest particle every 50ms
    }, 50);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full mix-blend-screen"
          style={{
            left: p.x,
            top: p.y,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animation: 'magic-fade 0.8s ease-out forwards',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes magic-fade {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, calc(-50% + 20px)) scale(0);
          }
        }
      `}</style>
    </div>
  );
}
