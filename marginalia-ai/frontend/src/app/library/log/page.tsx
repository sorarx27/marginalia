"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BookSearchModal from "@/components/BookSearchModal";
import BookReviewModal from "@/components/BookReviewModal";

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  total_pages: number;
  current_page: number;
  cover_image_url: string;
  status: string;
  rating: number | null;
}

export default function ReadingLog() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [readBooks, setReadBooks] = useState<Book[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedReviewBook, setSelectedReviewBook] = useState<Book | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    setMounted(true);
    fetchBooks();
  }, [router]);

  const fetchBooks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch('/api/users/me/books/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Only show books that are marked as Read
        setReadBooks(data.filter((b: Book) => b.status === 'Read').sort((a: Book, b: Book) => b.id - a.id));
      }
    } catch (e) {
      console.error("Failed to fetch books", e);
    }
  };

  const handleAddBook = async (book: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch('/api/users/me/books/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          total_pages: book.total_pages,
          cover_image_url: book.cover_image_url,
          status: 'Read', // Automatically mark as read if added from this page
          current_page: book.total_pages || 0
        })
      });
      if (res.ok) {
        setIsSearchModalOpen(false);
        fetchBooks();
      }
    } catch (e) {
      console.error("Failed to add book", e);
    }
  };

  const handleUpdateReview = async (bookId: number, rating: number | null, note: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch(`/api/users/me/books/${bookId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ rating: rating, note: note })
      });
      if (res.ok) {
        setSelectedReviewBook(null);
        fetchBooks();
      }
    } catch (e) {
      console.error("Failed to update review", e);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#0e0c0d] overflow-x-hidden text-[#f7f5f3] font-sans antialiased pb-20 md:pb-0">
      
      {/* Background styling */}
      <div className={`absolute inset-0 transition-opacity duration-[2000ms] ${mounted ? 'opacity-20' : 'opacity-0'} pointer-events-none`}>
        <Image src="/library_background.png" alt="Background" fill className="object-cover object-center blur-sm" />
        <div className="absolute inset-0 bg-[#0e0c0d]/80" />
      </div>

      <div className={`relative z-10 max-w-6xl mx-auto px-6 py-12 transition-all duration-[1500ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <button 
              onClick={() => router.push('/library')}
              className="flex items-center gap-2 text-[#d4af37]/70 hover:text-[#d4af37] text-sm font-medium mb-4 transition-colors w-fit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Desk
            </button>
            <h1 className="text-4xl md:text-5xl font-serif text-[#f3efe0] font-medium tracking-wide">Reading Log</h1>
            <p className="text-[#e6dfd5]/60 mt-2 font-serif text-lg">A chronicle of journeys taken and worlds explored.</p>
          </div>
          
          <button 
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#9d7e1c] text-[#0e0c0d] font-semibold text-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all w-fit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Finished Book
          </button>
        </header>

        {/* Grid */}
        {readBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
            {readBooks.map(book => (
              <div 
                key={book.id} 
                className="group relative flex flex-col gap-3 cursor-pointer"
                onClick={() => setSelectedReviewBook(book)}
              >
                <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden shadow-xl border border-white/10 group-hover:border-[#d4af37]/50 transition-colors bg-[#161314]">
                  {book.cover_image_url ? (
                    <Image src={book.cover_image_url} alt={book.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/20 to-transparent flex items-center justify-center p-4 text-center">
                      <span className="text-xs font-serif text-[#d4af37]/70 font-semibold">{book.title}</span>
                    </div>
                  )}
                  {/* Rating Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                    {book.rating ? (
                      <div className="flex text-[#d4af37]">
                        {[...Array(book.rating)].map((_, i) => (
                          <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-white/70 tracking-wide">Review Book</span>
                    )}
                  </div>
                </div>
                <div className="px-1">
                  <h3 className="text-sm font-serif text-[#f3efe0] font-medium truncate">{book.title}</h3>
                  <p className="text-xs text-[#e6dfd5]/50 truncate">{book.author}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-[#d4af37]/40 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <h3 className="text-xl font-serif text-[#f3efe0] mb-2">Your log is empty</h3>
            <p className="text-[#e6dfd5]/50 text-center max-w-md text-sm">Tell Liora about the books you've read, or manually add them here to build your reading history.</p>
          </div>
        )}

      </div>

      {isSearchModalOpen && (
        <BookSearchModal 
          onClose={() => setIsSearchModalOpen(false)}
          onSelectBook={handleAddBook}
        />
      )}

      {selectedReviewBook && (
        <BookReviewModal 
          book={selectedReviewBook}
          onClose={() => setSelectedReviewBook(null)}
          onSave={handleUpdateReview}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0e0c0d]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 z-50">
        <button onClick={() => router.push('/library')} className="flex flex-col items-center gap-1 text-[#e6dfd5]/50 hover:text-[#e6dfd5]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.38-.443.865-1.146 1.674-2.273 2.22.428.026.862.036 1.302.036 2.012 0 3.86-.554 5.402-1.536.883.1 1.79.15 2.723.15z" />
          </svg>
          <span className="text-[10px] font-medium">Chat</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#d4af37]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <span className="text-[10px] font-medium">Log</span>
        </button>
        <button onClick={() => router.push('/library/profile')} className="flex flex-col items-center gap-1 text-[#e6dfd5]/50 hover:text-[#e6dfd5]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <span className="text-[10px] font-medium">Taste</span>
        </button>
      </nav>
    </div>
  );
}
