"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import LivingBook from "@/components/LivingBook";
import WhisperMessage from "@/components/WhisperMessage";
import OnboardingFlow from "@/components/OnboardingFlow";
import BookSearchModal from "@/components/BookSearchModal";
import BookProgressModal from "@/components/BookProgressModal";
import RecommendationModal from "@/components/RecommendationModal";
import EchoModal from "@/components/EchoModal";

interface Message {
  id: string;
  role: 'user' | 'liora';
  text: string;
}

interface Memory {
  id: number;
  memory_type: string;
  content: string;
  image_url?: string;
}

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  total_pages: number;
  current_page: number;
  cover_image_url: string;
  status: string;
  recommended_by_liora: boolean;
  liora_note: string | null;
}

export default function LibraryDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{username: string, email: string, taste_profile?: any} | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activeBooks, setActiveBooks] = useState<Book[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedProgressBook, setSelectedProgressBook] = useState<Book | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Book | null>(null);
  const [echoMessage, setEchoMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Liora Speech States & Refs
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const chatAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatAudioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (chatAudioRef.current) {
        chatAudioRef.current.pause();
      }
      if (chatAudioUrlRef.current) {
        URL.revokeObjectURL(chatAudioUrlRef.current);
      }
    };
  }, []);

  const handleSpeakMessage = async (messageId: string, text: string) => {
    if (chatAudioRef.current && playingMessageId === messageId) {
      chatAudioRef.current.pause();
      setPlayingMessageId(null);
      return;
    }

    // Stop currently playing audio
    if (chatAudioRef.current) {
      chatAudioRef.current.pause();
    }
    setPlayingMessageId(messageId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/me/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error('Failed to fetch voice');

      const blob = await response.blob();
      
      // Clean up previous URL
      if (chatAudioUrlRef.current) {
        URL.revokeObjectURL(chatAudioUrlRef.current);
      }
      
      const url = URL.createObjectURL(blob);
      chatAudioUrlRef.current = url;

      const audio = new Audio(url);
      chatAudioRef.current = audio;

      audio.onended = () => {
        setPlayingMessageId(null);
      };
      audio.onerror = () => {
        setPlayingMessageId(null);
      };

      await audio.play();
    } catch (error) {
      console.warn("Liora's voice could not be loaded:", error);
      setPlayingMessageId(null);
    }
  };
  const triggerWelcomeBackGreeting = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/me/chat/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: '__WELCOME_BACK__' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages([{ id: Date.now().toString(), role: 'liora', text: data.reply }]);
      } else {
        setMessages([
          { id: '1', role: 'liora', text: "Welcome back. It's so lovely to see you." }
        ]);
      }
    } catch (error) {
      console.error(error);
      setMessages([
        { id: '1', role: 'liora', text: "Welcome back. It's so lovely to see you." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    
    // Fetch user details
    fetch('/api/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Auth failed');
      return res.json();
    })
    .then(data => {
      setUser(data);
      if (!data.taste_profile || !data.taste_profile.favorite_genres) {
        setNeedsOnboarding(true);
      } else {
        triggerWelcomeBackGreeting();
      }
      setMounted(true);
    })
    .catch(() => {
      localStorage.removeItem('token');
      router.push('/');
    });

    fetchMemories();
    fetchBooks();
  }, [router]);

  const fetchMemories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch('/api/users/me/memories/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (e) {
      console.error("Failed to fetch memories", e);
    }
  };

  const fetchBooks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch('/api/users/me/books/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveBooks(data.filter((b: Book) => b.status !== 'Read'));
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
          cover_image_url: book.cover_image_url
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

  const handleUpdateProgress = async (bookId: number, newPage: number, note: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      let newStatus = 'To Read';
      if (newPage > 0) {
        // If we know the total pages and we hit it, mark as Read. Otherwise, Currently Reading.
        if (selectedProgressBook && selectedProgressBook.total_pages > 0 && newPage >= selectedProgressBook.total_pages) {
          newStatus = 'Read';
        } else {
          newStatus = 'Currently Reading';
        }
      }

      const res = await fetch(`/api/users/me/books/${bookId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ current_page: newPage, note: note, status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedProgressBook(null);
        fetchBooks();
        if (note) {
          // A note triggers memory extraction. Wait a bit then fetch memories
          setTimeout(() => fetchMemories(), 3000);
        }
        if (data.echo) {
          setEchoMessage(data.echo);
        }
      }
    } catch (e) {
      console.error("Failed to update progress", e);
    }
  };

  const handleAcceptRecommendation = async (bookId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch(`/api/users/me/books/${bookId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ recommended_by_liora: false })
      });
      if (res.ok) {
        setSelectedRecommendation(null);
        fetchBooks();
      }
    } catch (e) {
      console.error("Failed to accept recommendation", e);
    }
  };

  const handleDeclineRecommendation = async (bookId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch(`/api/users/me/books/${bookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedRecommendation(null);
        fetchBooks();
      }
    } catch (e) {
      console.error("Failed to decline recommendation", e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getConversationStarters = () => {
    const starters = [];
    if (activeBooks.length > 0) {
      const book = activeBooks[0];
      starters.push(`What are other readers saying about "${book.title}"?`);
      starters.push(`Help me understand the themes of "${book.title}".`);
    } else {
      starters.push("Recommend me a book based on my reading taste.");
    }
    starters.push("Can you share a beautiful literary quote with me?");
    starters.push("Help me find my next magical read.");
    return starters;
  };

  const handleSendStarter = async (starterText: string) => {
    if (isLoading) return;
    setInput('');
    
    const newMessage: Message = { id: Date.now().toString(), role: 'user', text: starterText };
    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/me/chat/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: starterText }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      setMessages((prev) => [...prev, { id: Date.now().toString() + 'r', role: 'liora', text: data.reply }]);
      setTimeout(() => {
        fetchMemories();
      }, 3000);
      
    } catch (error) {
      console.error('Error sending starter:', error);
      setMessages((prev) => [...prev, { id: Date.now().toString() + 'e', role: 'liora', text: "*(The connection to the ethereal plane seems unstable...)*" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerInitialGreeting = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/me/chat/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: '__INITIAL_GREETING__' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages([{ id: Date.now().toString(), role: 'liora', text: data.reply }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const newMessage: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/me/chat/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userText }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      setMessages((prev) => [...prev, { id: Date.now().toString() + 'r', role: 'liora', text: data.reply }]);
      
      // Memory extraction takes a bit, so wait 3 seconds before fetching new memories
      setTimeout(() => {
        fetchMemories();
      }, 3000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, { id: Date.now().toString() + 'e', role: 'liora', text: "*(The connection to the ethereal plane seems unstable...)*" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full bg-[#0e0c0d] overflow-hidden text-[#f7f5f3] font-sans antialiased">
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

      {/* Entry Flash Fade Out (Catches the transition from homepage) */}
      <div className={`absolute inset-0 z-[100] bg-[#f3efe0] pointer-events-none transition-opacity duration-[2000ms] ease-in-out ${mounted ? 'opacity-0' : 'opacity-100'}`} />

      {/* Immersive Background */}
      <div 
        className={`absolute inset-0 transition-opacity duration-[2000ms] ${mounted ? 'opacity-30' : 'opacity-0'}`}
      >
        <Image
          src="/library_background.png"
          alt="Magical Library Interior"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c0d] via-[#0e0c0d]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0c0d] via-transparent to-[#0e0c0d]" />
      </div>

      {/* Floating Magic Dust Effects (CSS driven) */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-[#d4af37]/40 rounded-full blur-[2px] animate-pulse" />
          <div className="absolute top-[60%] left-[80%] w-3 h-3 bg-[#d4af37]/30 rounded-full blur-[3px] animate-pulse delay-700" />
          <div className="absolute top-[40%] left-[50%] w-1.5 h-1.5 bg-white/40 rounded-full blur-[1px] animate-pulse delay-1000" />
        </div>
      )}

      {/* Dashboard Layout */}
      <div className={`relative z-10 flex h-[100dvh] max-w-[1600px] mx-auto transition-all duration-[1500ms] delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Left Sidebar: Navigation (Desktop) */}
        <aside className="hidden md:flex w-64 h-full border-r border-white/5 p-6 flex-col gap-8 bg-[#0e0c0d]/40 backdrop-blur-xl shadow-[inset_-1px_0_0_rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-wider text-[#e6dfd5] font-serif drop-shadow-md">
              M A R G I N A L I A
            </span>
          </div>

          <nav className="flex flex-col gap-2 flex-1">
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 transition-all text-sm font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.38-.443.865-1.146 1.674-2.273 2.22.428.026.862.036 1.302.036 2.012 0 3.86-.554 5.402-1.536.883.1 1.79.15 2.723.15z" />
              </svg>
              Chat with Liora
            </button>
            <button 
              onClick={() => router.push('/library/log')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#e6dfd5]/60 hover:text-[#e6dfd5] hover:bg-white/5 transition-all text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              Reading Log
            </button>
            <button 
              onClick={() => router.push('/library/profile')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#e6dfd5]/60 hover:text-[#e6dfd5] hover:bg-white/5 transition-all text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              Taste Profile
            </button>
          </nav>

          <div className="mt-auto">
            <button className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-white/5 transition-colors text-left">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#9d7e1c] flex items-center justify-center text-[#0e0c0d] font-bold text-xs uppercase">
                {user?.username ? user.username[0] : 'U'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-[#e6dfd5] truncate">{user?.username || 'Guest Reader'}</p>
                <p className="text-xs text-[#e6dfd5]/40 truncate">Manage Account</p>
              </div>
            </button>
          </div>
        </aside>

        {/* Center: Chat / Interaction Area */}
        <main className="flex-1 flex flex-col relative px-4 md:px-8 pt-4 md:py-6 w-full h-[100dvh] md:h-auto">
          <header className="flex justify-between items-center mb-4 md:mb-8 mt-2 md:mt-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-xl font-medium text-[#f3efe0] font-serif">Liora's Desk</h2>
            </div>
            <div className="flex gap-2 items-center">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d4af37]"></span>
              </span>
              <span className="text-xs text-[#d4af37]/80 font-serif italic hidden sm:inline">Liora is listening...</span>
            </div>
          </header>

          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-36 md:pb-24 no-scrollbar">
            {mounted && messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-4 max-w-2xl ${msg.role === 'user' ? 'self-end flex-row-reverse' : ''}`}>
                {msg.role === 'liora' && (
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-[#d4af37] rounded-full blur-[10px] opacity-20 animate-[pulse_3s_ease-in-out_infinite]" />
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[#d4af37]/40 relative z-10">
                      <Image src="/liora_portrait.png" alt="Liora" fill className="object-cover" />
                    </div>
                  </div>
                )}
                <div className={`p-5 rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.05),0_10px_30px_-10px_rgba(0,0,0,0.5)] relative group/bubble ${
                  msg.role === 'user' 
                    ? 'bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#f3efe0] rounded-tr-none' 
                    : 'bg-[#161314]/80 backdrop-blur-md border border-white/5 rounded-tl-none'
                }`}>
                  {msg.role === 'liora' ? (
                    <div className="flex flex-col gap-2">
                      <div className="pr-4">
                        <WhisperMessage text={msg.text} delay={0} />
                      </div>
                      
                      {/* Read Aloud Button */}
                      <button 
                        onClick={() => handleSpeakMessage(msg.id, msg.text)}
                        className={`absolute right-3 bottom-3 p-1.5 rounded-full bg-[#0e0c0d]/60 border border-[#d4af37]/20 text-[#d4af37] flex items-center justify-center transition-all ${
                          playingMessageId === msg.id 
                            ? 'opacity-100 scale-100 bg-[#d4af37]/10 border-[#d4af37]/40' 
                            : 'opacity-0 group-hover/bubble:opacity-100 scale-95 hover:scale-105 hover:bg-[#d4af37]/10'
                        }`}
                        title={playingMessageId === msg.id ? "Pause speech" : "Read aloud"}
                      >
                        {playingMessageId === msg.id ? (
                          /* Equalizer Animation inside button */
                          <div className="flex items-end gap-[1.5px] h-3.5 w-3.5 px-0.5 pb-0.5">
                            <span className="w-[1.5px] h-full bg-[#d4af37] eq-bar eq-bar-1 rounded-full" />
                            <span className="w-[1.5px] h-full bg-[#d4af37] eq-bar eq-bar-2 rounded-full" />
                            <span className="w-[1.5px] h-full bg-[#d4af37] eq-bar eq-bar-3 rounded-full" />
                          </div>
                        ) : (
                          /* Speaker Icon */
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="font-serif leading-relaxed text-[15px]">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-4 max-w-2xl">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#d4af37]/40 relative z-10 opacity-50">
                    <Image src="/liora_portrait.png" alt="Liora" fill className="object-cover" />
                  </div>
                </div>
                <div className="bg-[#161314]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl rounded-tl-none shadow-[inset_1px_1px_0_rgba(255,255,255,0.05)] flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <div className="absolute bottom-20 md:bottom-8 left-4 md:left-8 right-4 md:right-8 z-20">
            {/* Conversation Starter Chips */}
            {messages.length <= 1 && !isLoading && (
              <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                {getConversationStarters().map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendStarter(starter)}
                    className="px-4 py-2 rounded-full text-xs font-serif bg-[#161314]/80 backdrop-blur-md border border-white/5 hover:border-[#d4af37]/40 text-[#e6dfd5]/80 hover:text-[#d4af37] hover:bg-[#d4af37]/5 hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all duration-300"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            )}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d4af37]/20 via-[#f3efe0]/10 to-[#d4af37]/20 rounded-2xl blur opacity-30 group-focus-within:opacity-100 group-focus-within:bg-[#d4af37]/40 transition duration-500"></div>
              <div className="relative flex items-center bg-[#0e0c0d]/90 backdrop-blur-xl border border-white/10 group-focus-within:border-[#d4af37]/30 rounded-2xl px-4 py-3 shadow-2xl transition-colors">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  disabled={isLoading}
                  placeholder="Tell Liora what you're looking for..." 
                  className="flex-1 bg-transparent border-none outline-none text-[#f3efe0] placeholder-[#e6dfd5]/30 text-[15px] font-serif disabled:opacity-50"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="p-2 rounded-xl bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0e0c0d] transition-colors disabled:opacity-50 disabled:hover:bg-[#d4af37]/10 disabled:hover:text-[#d4af37]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden absolute bottom-0 left-0 right-0 h-16 bg-[#0e0c0d]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 z-50">
          <button className="flex flex-col items-center gap-1 text-[#d4af37]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.38-.443.865-1.146 1.674-2.273 2.22.428.026.862.036 1.302.036 2.012 0 3.86-.554 5.402-1.536.883.1 1.79.15 2.723.15z" />
            </svg>
            <span className="text-[10px] font-medium">Chat</span>
          </button>
          <button 
            onClick={() => router.push('/library/log')}
            className="flex flex-col items-center gap-1 text-[#e6dfd5]/50 hover:text-[#e6dfd5]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-[10px] font-medium">Log</span>
          </button>
          <button 
            onClick={() => router.push('/library/profile')}
            className="flex flex-col items-center gap-1 text-[#e6dfd5]/50 hover:text-[#e6dfd5]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span className="text-[10px] font-medium">Taste</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#e6dfd5]/50 hover:text-[#e6dfd5]">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#9d7e1c] flex items-center justify-center text-[#0e0c0d] font-bold text-[9px] uppercase">
              {user?.username ? user.username[0] : 'U'}
            </div>
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </nav>

        {/* Right Sidebar: Memory / Context Panel */}
        <aside className="hidden xl:flex w-80 border-l border-white/5 p-6 flex-col gap-8 bg-[#0e0c0d]/60 backdrop-blur-2xl shadow-[inset_1px_0_0_rgba(255,255,255,0.02)]">
          <div>
            <h3 className="text-xs font-semibold text-[#e6dfd5]/40 uppercase tracking-wider mb-5 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-[#d4af37]/70">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
              Liora's Notes on You
            </h3>
            
            {/* Ethereal Memories */}
            <div className="space-y-4">
              {memories.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 cursor-default">
                  <p className="text-[13px] text-[#e6dfd5]/40 font-serif italic text-center">Liora is observing you...</p>
                </div>
              ) : (
                memories.map((mem, idx) => (
                  <div key={mem.id} className={`group relative p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all hover:shadow-[0_0_15px_rgba(212,175,55,0.05)] cursor-default overflow-hidden animate-[float_6s_ease-in-out_infinite]`} style={{ animationDelay: `${idx * 0.5}s` }}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#d4af37]/60 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[13px] text-[#f3efe0] mb-1.5 font-serif italic leading-relaxed">"{mem.content}"</p>
                    {mem.image_url && (
                      <div className="mt-2 mb-2 rounded-lg overflow-hidden border border-white/10 shadow-inner">
                        <img src={mem.image_url} alt="Visual memory" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700" />
                      </div>
                    )}
                    <p className="text-[10px] text-[#e6dfd5]/40 uppercase tracking-wide">{mem.memory_type}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-semibold text-[#e6dfd5]/40 uppercase tracking-wider mb-5 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-[#d4af37]/70">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              On The Desk
            </h3>
            {/* Living Book */}
            {activeBooks.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {activeBooks.map(book => (
                  <div 
                    key={book.id} 
                    className={`group relative flex flex-col items-center gap-3 cursor-pointer ${book.recommended_by_liora ? 'animate-pulse' : ''}`}
                    onClick={() => book.recommended_by_liora ? setSelectedRecommendation(book) : setSelectedProgressBook(book)}
                  >
                    <div className={`relative w-28 h-40 rounded shadow-2xl border ${book.recommended_by_liora ? 'border-[#d4af37]' : 'border-white/10 group-hover:border-[#d4af37]/50'} transition-colors overflow-hidden`}>
                      {book.cover_image_url ? (
                        <Image src={book.cover_image_url} alt={book.title} fill className="object-cover" />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-tr ${book.recommended_by_liora ? 'from-[#d4af37]/40' : 'from-[#d4af37]/20'} to-transparent flex items-center justify-center p-2 text-center`}>
                          <span className="text-[10px] font-serif text-[#d4af37]/70 font-semibold">{book.title}</span>
                        </div>
                      )}
                      {/* Shimmer overlay for recommendations */}
                      {book.recommended_by_liora && (
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#d4af37]/30 to-transparent mix-blend-overlay shimmer-animation" />
                      )}
                      
                      {/* Progress Bar overlay */}
                      {!book.recommended_by_liora && book.total_pages > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                          <div 
                            className="h-full bg-[#d4af37]" 
                            style={{ width: `${Math.min(100, Math.max(0, (book.current_page / book.total_pages) * 100))}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="text-center px-2">
                      <h3 className="text-xs font-serif text-[#f3efe0] font-medium truncate w-28 flex items-center justify-center gap-1">
                        {book.recommended_by_liora && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-[#d4af37]">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                        )}
                        {book.title}
                      </h3>
                      <p className="text-[10px] text-[#e6dfd5]/50 truncate w-28">{book.author}</p>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => setIsSearchModalOpen(true)}
                  className="w-full h-40 rounded-xl border border-dashed border-[#d4af37]/30 text-[#d4af37]/70 hover:text-[#d4af37] hover:bg-[#d4af37]/5 transition-colors font-serif text-sm flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsSearchModalOpen(true)}
                className="w-full group p-6 rounded-xl border border-dashed border-white/20 hover:border-[#d4af37]/50 hover:bg-[#d4af37]/5 transition-all flex flex-col items-center justify-center gap-3 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#d4af37]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#f3efe0] font-serif text-sm group-hover:text-[#d4af37] transition-colors">Place a book on your desk</p>
                  <p className="text-[11px] text-[#e6dfd5]/40 mt-1">Search the global library</p>
                </div>
              </button>
            )}
          </div>
        </aside>

        <style jsx>{`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
            100% { transform: translateY(0px); }
          }
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
        `}</style>

      </div>

      {needsOnboarding && (
        <OnboardingFlow 
          onComplete={() => {
            setNeedsOnboarding(false);
            triggerInitialGreeting();
          }} 
        />
      )}

      {isSearchModalOpen && (
        <BookSearchModal 
          onClose={() => setIsSearchModalOpen(false)}
          onSelectBook={handleAddBook}
        />
      )}

      {selectedProgressBook && (
        <BookProgressModal 
          book={selectedProgressBook}
          onClose={() => setSelectedProgressBook(null)}
          onSave={handleUpdateProgress}
        />
      )}

      {selectedRecommendation && (
        <RecommendationModal
          book={selectedRecommendation}
          onClose={() => setSelectedRecommendation(null)}
          onAccept={handleAcceptRecommendation}
          onDecline={handleDeclineRecommendation}
        />
      )}

      {echoMessage && (
        <EchoModal 
          echo={echoMessage} 
          onClose={() => setEchoMessage(null)} 
        />
      )}
    </div>
  );
}
