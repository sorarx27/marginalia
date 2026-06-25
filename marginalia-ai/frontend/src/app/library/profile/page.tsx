"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface Memory {
  id: number;
  memory_type: string;
  content: string;
}

interface Book {
  id: number;
  title: string;
  total_pages: number;
  current_page: number;
}

export default function TasteProfileDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{username: string, taste_profile?: any} | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [userRes, memRes, booksRes] = await Promise.all([
          fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/users/me/memories/', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/users/me/books/', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (userRes.ok) setUser(await userRes.json());
        if (memRes.ok) setMemories(await memRes.json());
        if (booksRes.ok) setBooks(await booksRes.json());
        
        setMounted(true);
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      }
    };

    fetchData();
  }, [router]);

  // Derived Stats
  const totalPagesRead = books.reduce((acc, book) => acc + book.current_page, 0);
  const booksCompleted = books.filter(b => b.current_page > 0 && b.current_page === b.total_pages).length;
  const currentlyReading = books.length - booksCompleted;

  // Radar Chart Data
  const radarData = [
    { subject: 'Complexity', A: user?.taste_profile?.complexity_score || 50, fullMark: 100 },
    { subject: 'Worldbuilding', A: user?.taste_profile?.worldbuilding_score || 50, fullMark: 100 },
    { subject: 'Character Focus', A: user?.taste_profile?.character_score || 50, fullMark: 100 },
    { subject: 'Dark Tone', A: user?.taste_profile?.tone_score || 50, fullMark: 100 },
    { subject: 'Pacing', A: user?.taste_profile?.pacing_score || 50, fullMark: 100 },
  ];

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#0e0c0d] text-[#f7f5f3] font-sans antialiased overflow-x-hidden">
      {/* Background Elements */}
      <div className={`absolute inset-0 transition-opacity duration-[2000ms] pointer-events-none ${mounted ? 'opacity-30' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 via-[#0e0c0d] to-[#d4af37]/10" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.15),transparent_50%)]" />
      </div>

      <div className={`relative z-10 max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12 transition-all duration-[1500ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <button 
            onClick={() => router.push('/library')}
            className="flex items-center gap-2 text-[#e6dfd5]/60 hover:text-[#d4af37] transition-colors font-medium text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Desk
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#9d7e1c] flex items-center justify-center text-[#0e0c0d] font-bold text-lg uppercase shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              {user?.username ? user.username[0] : 'U'}
            </div>
            <div>
              <h1 className="text-xl font-serif text-[#f3efe0]">{user?.username}'s Profile</h1>
              <p className="text-xs text-[#e6dfd5]/40 uppercase tracking-widest mt-0.5">Reader Identity</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Stats & Identity */}
          <div className="flex flex-col gap-8 lg:col-span-1">
            
            {/* Reading Statistics */}
            <section className="p-6 rounded-2xl bg-[#161314]/80 backdrop-blur-xl border border-white/5 shadow-2xl">
              <h2 className="text-xs font-semibold text-[#e6dfd5]/40 uppercase tracking-wider mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#d4af37]/70">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                Reading Statistics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0e0c0d]/50 p-4 rounded-xl border border-white/5">
                  <p className="text-3xl font-serif text-[#d4af37] mb-1">{totalPagesRead.toLocaleString()}</p>
                  <p className="text-[10px] text-[#e6dfd5]/40 uppercase tracking-widest">Pages Read</p>
                </div>
                <div className="bg-[#0e0c0d]/50 p-4 rounded-xl border border-white/5">
                  <p className="text-3xl font-serif text-[#f3efe0] mb-1">{currentlyReading}</p>
                  <p className="text-[10px] text-[#e6dfd5]/40 uppercase tracking-widest">Active Books</p>
                </div>
                <div className="bg-[#0e0c0d]/50 p-4 rounded-xl border border-white/5 col-span-2">
                  <p className="text-3xl font-serif text-[#f3efe0] mb-1">{booksCompleted}</p>
                  <p className="text-[10px] text-[#e6dfd5]/40 uppercase tracking-widest">Books Completed</p>
                </div>
              </div>
            </section>

            {/* Identity Matrix (Radar Chart) */}
            <section className="p-6 rounded-2xl bg-[#161314]/80 backdrop-blur-xl border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 blur-[40px] pointer-events-none" />
              <h2 className="text-xs font-semibold text-[#e6dfd5]/40 uppercase tracking-wider mb-2 w-full flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#d4af37]/70">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                </svg>
                Identity Matrix
              </h2>
              
              <div className="w-full h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(230,223,213,0.6)', fontSize: 10, fontFamily: 'serif' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Taste"
                      dataKey="A"
                      stroke="#d4af37"
                      strokeWidth={2}
                      fill="#d4af37"
                      fillOpacity={0.4}
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full mt-6 space-y-4">
                <div>
                  <p className="text-[10px] text-[#e6dfd5]/40 uppercase tracking-widest mb-2">Favorite Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {user?.taste_profile?.favorite_genres ? (
                      user.taste_profile.favorite_genres.split(',').map((g: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 rounded-lg text-xs font-medium">{g.trim()}</span>
                      ))
                    ) : (
                      <span className="text-sm text-[#e6dfd5]/40 italic">Not defined yet</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Right Column: Liora's Insights (Memories) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h2 className="text-xs font-semibold text-[#e6dfd5]/40 uppercase tracking-wider mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#d4af37]/70">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Liora's Insights
            </h2>
            
            {memories.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl text-center p-6">
                <div className="w-12 h-12 rounded-full border border-[#d4af37]/20 flex items-center justify-center mb-4">
                  <span className="w-2 h-2 bg-[#d4af37] rounded-full animate-ping" />
                </div>
                <p className="text-[#f3efe0] font-serif text-lg mb-2">The archives are waiting</p>
                <p className="text-sm text-[#e6dfd5]/40 max-w-sm">Chat with Liora about your books. She will naturally extract insights about your taste and display them here over time.</p>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 gap-4 space-y-4">
                {memories.map((mem) => (
                  <div 
                    key={mem.id} 
                    className="break-inside-avoid relative p-6 rounded-2xl bg-[#161314]/80 backdrop-blur-md border border-white/5 hover:border-[#d4af37]/30 hover:bg-white/[0.03] transition-all group overflow-hidden shadow-lg hover:shadow-[0_10px_30px_rgba(212,175,55,0.05)]"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#d4af37]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#e6dfd5]/60 uppercase tracking-widest">{mem.memory_type}</span>
                    </div>
                    <p className="text-[15px] text-[#f3efe0] font-serif leading-relaxed italic">"{mem.content}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
