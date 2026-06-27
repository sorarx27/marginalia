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
}

interface BookProgressModalProps {
  book: Book;
  onClose: () => void;
  onSave: (bookId: number, newPage: number, note: string, dropBook?: boolean) => void;
}

export default function BookProgressModal({ book, onClose, onSave }: BookProgressModalProps) {
  const [page, setPage] = useState(book.current_page);
  const [note, setNote] = useState('');
  const [dropBook, setDropBook] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    onSave(book.id, page, note, dropBook);
  };

  const handleFinish = () => {
    setIsSaving(true);
    // Passing -1 or page = total_pages to indicate finished
    // Since page > 0 is checked in backend, we'll pass the maximum possible page, or 1000 if 0
    const finalPage = book.total_pages > 0 ? book.total_pages : 1000;
    onSave(book.id, finalPage, note, false);
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
          
          {/* Slider */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="text-xs font-semibold text-[#e6dfd5]/40 uppercase tracking-wider">Reading Progress</label>
              <div className="text-right">
                <span className="text-2xl font-serif text-[#d4af37]">{page}</span>
                <span className="text-sm text-[#e6dfd5]/40 ml-1">/ {book.total_pages > 0 ? book.total_pages : '?'}</span>
              </div>
            </div>
            
            <input 
              type="range" 
              min="0" 
              max={book.total_pages > 0 ? book.total_pages : 1000} 
              value={page}
              onChange={(e) => setPage(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
              style={{
                background: `linear-gradient(to right, #d4af37 ${book.total_pages > 0 ? (page / book.total_pages) * 100 : 0}%, rgba(255,255,255,0.1) ${book.total_pages > 0 ? (page / book.total_pages) * 100 : 0}%)`
              }}
            />
            
            <style jsx>{`
              input[type=range]::-webkit-slider-thumb {
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #d4af37;
                border: 2px solid #161314;
                box-shadow: 0 0 10px rgba(212,175,55,0.5);
                cursor: pointer;
                transition: transform 0.1s;
              }
              input[type=range]::-webkit-slider-thumb:hover {
                transform: scale(1.2);
              }
            `}</style>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-[#e6dfd5]/40 uppercase tracking-wider mb-3 flex items-center gap-2">
              Thoughts so far...
              <span className="px-1.5 py-0.5 rounded text-[8px] bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 uppercase">Optional</span>
            </label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What do you think of the pacing? The characters? The prose? Liora will remember this..."
              className="w-full h-28 bg-[#0e0c0d]/50 border border-white/10 rounded-xl p-4 text-sm text-[#f3efe0] placeholder-[#e6dfd5]/30 focus:border-[#d4af37]/50 focus:bg-white/5 outline-none transition-all font-serif resize-none"
            />
          </div>

          {/* Remove book from desk toggle */}
          <div className="flex items-center gap-3 bg-[#0e0c0d]/30 border border-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/5 transition-all" onClick={() => setDropBook(!dropBook)}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${dropBook ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]' : 'border-white/20 text-transparent'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-serif text-[#f3efe0] font-medium">Remove book from my desk</span>
              <span className="text-[10px] text-[#e6dfd5]/40 font-serif">Stop reading this book for now and shelf it</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <div className="flex gap-3">
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
                {isSaving ? 'Saving Checkpoint...' : 'Save Checkpoint'}
              </button>
            </div>
            <button 
              onClick={handleFinish}
              disabled={isSaving}
              className="w-full py-3 rounded-xl border border-[#d4af37]/30 text-[#d4af37] font-semibold text-sm hover:bg-[#d4af37]/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
              </svg>
              Mark as Finished
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
