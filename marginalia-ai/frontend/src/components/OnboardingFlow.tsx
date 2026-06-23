import { useState } from 'react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [genres, setGenres] = useState<string[]>([]);
  const [pacing, setPacing] = useState('');
  const [dislikes, setDislikes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableGenres = [
    "Fantasy", "Sci-Fi", "Literary Fiction", "Mystery", 
    "Romance", "Historical Fiction", "Non-Fiction", "Horror"
  ];

  const handleGenreToggle = (g: string) => {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        favorite_genres: genres.join(', '),
        pacing_preference: pacing,
        dislikes: dislikes
      };

      const res = await fetch('/api/users/me/taste_profile/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save taste profile");
      
      onComplete();
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-[#0e0c0d]/95 backdrop-blur-md">
      <div className="max-w-xl w-full text-center">
        <h2 className="text-3xl font-serif text-[#f3efe0] mb-8">
          Welcome to the Library
        </h2>
        <p className="text-[#e6dfd5]/70 mb-12">
          Before you meet Liora, let's establish your reading profile. She uses this to find the perfect recommendations.
        </p>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl text-[#f3efe0]">What genres do you find yourself returning to?</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {availableGenres.map(g => (
                <button
                  key={g}
                  onClick={() => handleGenreToggle(g)}
                  className={`px-4 py-2 rounded-full border transition-colors ${
                    genres.includes(g) 
                      ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' 
                      : 'bg-transparent border-white/10 text-[#e6dfd5]/60 hover:border-white/30'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <button 
              onClick={handleNext}
              disabled={genres.length === 0}
              className="mt-8 px-8 py-3 rounded-lg bg-[#d4af37] text-[#0e0c0d] font-semibold hover:bg-[#c29e2f] transition-colors disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl text-[#f3efe0]">How do you prefer the pacing of your stories?</h3>
            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              {['Slow-burn and atmospheric', 'Balanced and character-driven', 'Fast-paced thrill rides'].map(p => (
                <button
                  key={p}
                  onClick={() => setPacing(p)}
                  className={`px-6 py-4 rounded-xl border text-left transition-colors ${
                    pacing === p 
                      ? 'bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]' 
                      : 'bg-[#161314] border-white/5 text-[#e6dfd5] hover:border-white/20'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button 
              onClick={handleNext}
              disabled={!pacing}
              className="mt-8 px-8 py-3 rounded-lg bg-[#d4af37] text-[#0e0c0d] font-semibold hover:bg-[#c29e2f] transition-colors disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl text-[#f3efe0]">Any tropes or elements you strongly dislike?</h3>
            <textarea
              value={dislikes}
              onChange={(e) => setDislikes(e.target.value)}
              placeholder="e.g. gratuitous violence, love triangles, excessive exposition..."
              className="w-full h-32 bg-[#161314] border border-white/10 rounded-xl p-4 text-[#f3efe0] focus:border-[#d4af37]/50 focus:outline-none resize-none"
            />
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="mt-8 px-8 py-3 rounded-lg bg-[#d4af37] text-[#0e0c0d] font-semibold hover:bg-[#c29e2f] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Meet Liora'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
