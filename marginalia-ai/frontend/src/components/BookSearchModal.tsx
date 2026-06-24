"use client";
import { useState } from 'react';
import Image from 'next/image';

interface SearchResult {
  title: string;
  author: string;
  isbn: string | null;
  total_pages: number;
  cover_image_url: string;
}

interface BookSearchModalProps {
  onClose: () => void;
  onSelectBook: (book: SearchResult) => void;
}

export default function BookSearchModal({ onClose, onSelectBook }: BookSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0e0c0d]/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#161314] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-white/5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif text-[#d4af37]">Search Library</h2>
            <button onClick={onClose} className="text-[#e6dfd5]/50 hover:text-[#e6dfd5]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Title, author, or ISBN..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[#f3efe0] placeholder-[#e6dfd5]/30 outline-none focus:border-[#d4af37]/50 transition-colors font-serif"
            />
            <button 
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="px-6 py-3 rounded-xl bg-[#d4af37]/10 text-[#d4af37] font-medium hover:bg-[#d4af37]/20 disabled:opacity-50 transition-colors"
            >
              {isSearching ? '...' : 'Search'}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          {results.length > 0 ? (
            <div className="flex flex-col gap-3">
              {results.map((book, idx) => (
                <div 
                  key={idx} 
                  onClick={() => onSelectBook(book)}
                  className="flex gap-4 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 cursor-pointer transition-all group"
                >
                  <div className="w-12 h-16 bg-[#2a2422] rounded overflow-hidden relative shadow-md flex-shrink-0">
                    {book.cover_image_url ? (
                      <Image src={book.cover_image_url} alt={book.title} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-[#d4af37]/20 to-transparent">
                        <span className="text-[10px] font-serif text-[#d4af37]/70 font-semibold tracking-wider">Book</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <p className="text-sm font-serif font-medium text-[#f3efe0] truncate group-hover:text-[#d4af37] transition-colors">{book.title}</p>
                    <p className="text-xs text-[#e6dfd5]/60 truncate mt-0.5">{book.author}</p>
                    <p className="text-[10px] text-[#e6dfd5]/30 mt-1">{book.total_pages > 0 ? `${book.total_pages} pages` : 'Unknown length'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center gap-2 opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-[#d4af37]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="text-sm font-serif text-[#e6dfd5]">Search the ethereal archives</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
