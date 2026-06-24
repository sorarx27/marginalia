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
  onSave: (bookId: number, newPage: number, note: string) => void;
}

export default function BookProgressModal({ book, onClose, onSave }: BookProgressModalProps) {
  const [page, setPage] = useState(book.current_page);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    onSave(book.id, page, note);
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
                background: \linear-gradient(to right, #d4af37 \%, rgba(255,255,255,0.1) \%)\
              }}
            />
            
            <style jsx>{\
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
            \}</style>
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
              {isSaving ? 'Saving Checkpoint...' : 'Save Checkpoint'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
