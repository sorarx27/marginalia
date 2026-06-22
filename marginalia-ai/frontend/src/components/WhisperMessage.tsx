"use client";
import { useEffect, useState } from 'react';

export default function WhisperMessage({ text, delay = 0 }: { text: string, delay?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <p className={`text-[15px] leading-relaxed text-[#e6dfd5] font-serif transition-all duration-[1500ms] ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      {text}
    </p>
  );
}
