"use client";
import { useState } from 'react';
import Image from 'next/image';

interface Book {
  id: number;
  title: string;
  author: string;
  cover_image_url: string;
  status: string;
  rating: number | null;
}

interface BookReviewModalProps {
  book: Book;
  onClose: () => void;
  onSave: (bookId: number, rating: number | null, note: string) => void;
}

export default function BookReviewModal({ book, onClose, onSave }: BookReviewModalProps) {
  const [rating, setRating] = useState<number | null>(book.rating);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    onSave(book.id, rating, note);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#0e0c0d]/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-[#161314] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header / Book Info */}
        <div className="relative p-8 flex flex-col items-center text-center overflow-hidden border-b border-white/5">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
             {book.cover_image_url && (
                <Image src={book.cover_image_url} alt={book.title} fill className="object-cover blur-xl" />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-[#161314] to-transparent" />
          </div>

          <div className="w-20 h-28 bg-[#2a2422] rounded shadow-2xl border border-white/10 relative overflow-hidden mb-4 z-10">
            {book.cover_image_url ? (
              <Image src={book.cover_image_url} alt={book.title} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/20 to-transparent flex items-center justify-center">
                <span className="text-xs font-serif text-[#d4af37]/70 font-semibold tracking-wider">Book</span>
              </div>
            )}
          </div>
          
          <h2 className="text-xl font-serif text-[#f3efe0] z-10 mb-1 leading-tight">{book.title}</h2>
          <p className="text-sm text-[#e6dfd5]/60 z-10">{book.author}</p>
        </div>

        {/* Form Area */}
        <div className="p-8 flex flex-col gap-8 bg-gradient-to-b from-transparent to-black/20">
          
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-3">
            <label className="text-xs font-semibold text-[#e6dfd5]/40 uppercase tracking-wider">Your Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill={(rating || 0) >= star ? "#d4af37" : "none"} 
                    stroke={(rating || 0) >= star ? "#d4af37" : "rgba(255,255,255,0.2)"}
                    strokeWidth="1.5"
                    className="w-8 h-8 transition-colors"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-1.81.688l1.15 5.503c.105.501-.412.87-.84.621l-4.785-2.775a.564.564 0 00-.594 0l-4.785 2.775c-.428.249-.945-.12-.84-.621l1.15-5.503a.563.563 0 00-.181-.688l-4.204-3.602c-.38-.325-.178-.948.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Note / Review */}
          <div>
            <label className="text-xs font-semibold text-[#e6dfd5]/40 uppercase tracking-wider mb-3 flex items-center gap-2">
              Final Review
              <span className="px-1.5 py-0.5 rounded text-[8px] bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 uppercase">Optional</span>
            </label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you think of the book overall? This will be added to Liora's knowledge of your taste..."
              className="w-full h-28 bg-[#0e0c0d]/50 border border-white/10 rounded-xl p-4 text-sm text-[#f3efe0] placeholder-[#e6dfd5]/30 focus:border-[#d4af37]/50 focus:bg-white/5 outline-none transition-all font-serif resize-none"
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 text-[#e6dfd5]/60 hover:text-[#f3efe0] hover:bg-white/5 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#9d7e1c] text-[#0e0c0d] font-semibold text-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Review'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
