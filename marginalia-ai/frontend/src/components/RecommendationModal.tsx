"use client";
import Image from 'next/image';

interface Book {
  id: number;
  title: string;
  author: string;
  cover_image_url: string;
  total_pages: number;
  current_page: number;
  status: string;
  recommended_by_liora: boolean;
  liora_note: string | null;
}

interface RecommendationModalProps {
  book: Book;
  onClose: () => void;
  onAccept: (bookId: number) => void;
  onDecline: (bookId: number) => void;
}

export default function RecommendationModal({ book, onClose, onAccept, onDecline }: RecommendationModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#0e0c0d]/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#1a1715] to-[#12100f] border border-[#d4af37]/30 rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.15)] overflow-hidden flex flex-col">
        
        {/* Shimmer Effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-transparent via-[#d4af37]/5 to-transparent shimmer-animation" />

        <div className="p-8 flex flex-col items-center text-center relative z-10">
          <div className="w-24 h-36 bg-[#2a2422] rounded shadow-2xl border border-[#d4af37]/50 relative overflow-hidden mb-6 group">
            {book.cover_image_url ? (
              <Image src={book.cover_image_url} alt={book.title} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/20 to-transparent flex items-center justify-center">
                <span className="text-xs font-serif text-[#d4af37]/70 font-semibold tracking-wider">Book</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#d4af37]/20 to-transparent pointer-events-none" />
          </div>
          
          <h2 className="text-2xl font-serif text-[#f3efe0] mb-1 leading-tight">{book.title}</h2>
          <p className="text-sm text-[#d4af37]/80 font-medium tracking-wide">{book.author}</p>
          
          {/* Liora's Note */}
          <div className="mt-8 mb-8 p-5 bg-[#0e0c0d]/50 rounded-2xl border border-white/5 relative w-full">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#1a1715] px-3 text-[#d4af37] text-xs font-serif italic border border-[#d4af37]/20 rounded-full whitespace-nowrap">
              A note from Liora
            </div>
            <p className="text-[#e6dfd5]/80 font-serif italic text-sm leading-relaxed">
              "{book.liora_note || "Based on your taste profile, I thought you might enjoy this."}"
            </p>
          </div>

          <div className="flex w-full gap-3">
            <button 
              onClick={() => onDecline(book.id)}
              className="flex-1 py-3 rounded-xl border border-white/10 text-[#e6dfd5]/50 hover:text-[#e6dfd5] hover:bg-white/5 transition-colors font-medium text-sm"
            >
              Return to Archives
            </button>
            <button 
              onClick={() => onAccept(book.id)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#9d7e1c] text-[#0e0c0d] font-semibold text-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
            >
              Accept Recommendation
            </button>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: 
        @keyframes shimmer {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(200%) rotate(45deg); }
        }
        .shimmer-animation {
          animation: shimmer 3s infinite linear;
          width: 200%;
          height: 200%;
          top: -50%;
          left: -50%;
        }
      }} />
    </div>
  );
}
