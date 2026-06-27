import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string | null;
  created_at: string;
}

interface Book {
  id: number;
  title: string;
  author: string | null;
  status: string;
}

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  books: Book[];
  onUpdateUser: () => void;
}

export default function AccountModal({ isOpen, onClose, user, books, onUpdateUser }: AccountModalProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setPassword('');
      setError('');
      setSuccess('');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  // Derive stats
  const activeBooksCount = books.filter(b => b.status === 'Reading').length;
  const joinDate = user.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expired. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const payload: { username?: string; email?: string; password?: string } = {};
      if (username !== user.username && username.trim() !== '') {
        payload.username = username;
      }
      if (email !== user.email && email.trim() !== '') {
        payload.email = email;
      }
      if (password.trim() !== '') {
        payload.password = password;
      }

      if (Object.keys(payload).length === 0) {
        setSuccess('No changes were made.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to update account');
      }

      setSuccess('Account updated successfully!');
      setPassword('');
      onUpdateUser(); // Refresh user state in parent
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    onClose();
    router.push('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="relative w-full max-w-lg p-6 md:p-8 bg-[#161314]/95 border border-[#d4af37]/20 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] sidebar-scrollable-container">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#e6dfd5]/50 hover:text-[#d4af37] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-serif text-[#f3efe0] mb-6 text-center border-b border-white/5 pb-4">
          Manage Account
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Left Column: Account Profile Summary Card */}
          <div className="md:col-span-2 flex flex-col items-center p-4 rounded-xl bg-white/5 border border-white/5 text-center h-fit">
            <div className="w-16 h-16 mb-3 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#9d7e1c] flex items-center justify-center text-[#0e0c0d] font-bold text-2xl shadow-lg uppercase">
              {user.username ? user.username[0] : 'U'}
            </div>
            <h3 className="text-base font-medium text-[#f3efe0] truncate w-full">{user.username}</h3>
            <p className="text-xs text-[#e6dfd5]/40 mb-4 truncate w-full">{user.email || 'No email set'}</p>
            
            <div className="w-full border-t border-white/5 pt-4 space-y-3 text-left">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#e6dfd5]/30">Member Since</p>
                <p className="text-xs text-[#e6dfd5]/70">{joinDate}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#e6dfd5]/30">Active Desk Books</p>
                <p className="text-xs text-[#d4af37] font-serif italic">{activeBooksCount} currently reading</p>
              </div>
            </div>
          </div>

          {/* Right Column: Profile Form Settings */}
          <form onSubmit={handleUpdateAccount} className="md:col-span-3 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#e6dfd5]/70 mb-1">Username</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0e0c0d] border border-white/10 rounded-lg px-3 py-2 text-[#f3efe0] focus:border-[#d4af37]/50 focus:outline-none transition-colors text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-[#e6dfd5]/70 mb-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0e0c0d] border border-white/10 rounded-lg px-3 py-2 text-[#f3efe0] focus:border-[#d4af37]/50 focus:outline-none transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#e6dfd5]/70 mb-1">New Password (optional)</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0e0c0d] border border-white/10 rounded-lg px-3 py-2 text-[#f3efe0] placeholder-white/20 focus:border-[#d4af37]/50 focus:outline-none transition-colors text-sm"
              />
              <p className="text-[10px] text-[#e6dfd5]/30 mt-1">Leave blank to keep current password</p>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-9 rounded-lg bg-[#d4af37] hover:bg-[#c29e2f] text-[#0e0c0d] font-semibold text-xs transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving Changes...' : 'Save Settings'}
              </button>
            </div>
          </form>

        </div>

        {/* Footer: Sign Out Action */}
        <div className="mt-8 pt-4 border-t border-white/5 flex justify-end">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors text-xs font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            Sign Out Securely
          </button>
        </div>

      </div>
    </div>
  );
}
