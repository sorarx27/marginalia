import { useState, useEffect } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(initialMode !== 'signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode !== 'signup');
      setError('');
      setUsername('');
      setEmail('');
      setPassword('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login Flow
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const res = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });

        if (!res.ok) throw new Error('Invalid credentials');
        
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        onSuccess();
      } else {
        // Registration Flow
        const res = await fetch('/api/users/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Registration failed');
        }

        // Auto-login after registration
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const loginRes = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });

        const data = await loginRes.json();
        localStorage.setItem('token', data.access_token);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-8 bg-[#161314] border border-[#d4af37]/20 rounded-2xl shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#e6dfd5]/50 hover:text-[#d4af37] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-serif text-[#f3efe0] mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Join the Library'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#e6dfd5]/70 mb-1">Username</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0e0c0d] border border-white/10 rounded-lg px-4 py-2.5 text-[#f3efe0] focus:border-[#d4af37]/50 focus:outline-none transition-colors"
            />
          </div>
          
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-[#e6dfd5]/70 mb-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0e0c0d] border border-white/10 rounded-lg px-4 py-2.5 text-[#f3efe0] focus:border-[#d4af37]/50 focus:outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#e6dfd5]/70 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0e0c0d] border border-white/10 rounded-lg px-4 py-2.5 text-[#f3efe0] focus:border-[#d4af37]/50 focus:outline-none transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-11 mt-6 rounded-lg bg-[#d4af37] text-[#0e0c0d] font-semibold text-sm hover:bg-[#c29e2f] transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : (isLogin ? 'Enter Library' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-[#e6dfd5]/70 hover:text-[#d4af37] transition-colors"
          >
            {isLogin ? "Don't have a library card? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
