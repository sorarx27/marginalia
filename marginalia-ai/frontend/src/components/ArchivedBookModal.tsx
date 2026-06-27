"use client";
import { useState } from 'react';
import Image from 'next/image';

interface Book {
  id: number;
  title: string;
  author: string;
  cover_image_url: string;
  current_page: number;
  total_pages: number;
  liora_note?: string;
}

interface ArchivedBookModalProps {
  book: Book;
  onClose: () => void;
  onResume: (bookId: number) => void;
  onDelete: (bookId: number) => void;
}

export default function ArchivedBookModal({ book, onClose, onResume, onDelete }: ArchivedBookModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResume = async () => {
    setIsProcessing(true);
    await onResume(book.id);
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to permanently remove "${book.title}" from your library?`)) {
      setIsProcessing(true);
      await onDelete(book.id);
      setIsProcessing(false);
    }
  };

  const progressPercent = book.total_pages > 0 ? Math.round((book.current_page / book.total_pages) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#0e0c0d]/85 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-[#161314] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header / Book Info with Blurred Cover Background */}
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
          <div className="mt-2.5 px-2.5 py-1 rounded bg-[#d4af37]/10 border border-[#d4af37]/20 text-[10px] font-serif text-[#d4af37] tracking-wide uppercase z-10">
            Archived Journey
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 flex flex-col gap-6 bg-gradient-to-b from-transparent to-black/20">
          
          {/* Progress Section */}
          <div className="bg-[#0e0c0d]/40 border border-white/5 rounded-2xl p-5">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs font-semibold text-[#e6dfd5]/40 uppercase tracking-wider">Progress Stopped At</span>
              <span className="text-sm text-[#e6dfd5]/80 font-serif">
                <strong className="text-lg font-medium text-[#d4af37]">{book.current_page}</strong> / {book.total_pages > 0 ? book.total_pages : '?'} pages ({progressPercent}%)
              </span>
            </div>
            
            {/* Custom mini progress bar */}
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#d4af37]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Thoughts/Notes Section */}
          {book.liora_note && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#e6dfd5]/40 uppercase tracking-wider">Last Recorded Reflection</label>
              <div className="max-h-24 overflow-y-auto bg-[#0e0c0d]/20 border border-white/5 rounded-xl p-4 text-sm text-[#e6dfd5]/80 font-serif italic leading-relaxed">
                "{book.liora_note}"
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-2">
            <button 
              onClick={handleResume}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#9d7e1c] text-[#0e0c0d] font-semibold text-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4.72 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L11.69 12 4.72 5.03a.75.75 0 0 1 0-1.06Zm6 0a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L17.69 12l-6.97-6.97a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
              Resume Journey
            </button>

            <div className="flex gap-3">
              <button 
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl border border-white/10 text-[#e6dfd5]/60 hover:text-[#f3efe0] hover:bg-white/5 transition-colors font-medium text-sm"
              >
                Close
              </button>
              <button 
                onClick={handleDelete}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl border border-red-500/20 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                Dissolve Copy
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
