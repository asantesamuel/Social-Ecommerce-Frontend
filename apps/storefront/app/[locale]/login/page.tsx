'use client';

import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Link } from '../../../i18n/routing';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <div className="glass-card w-full max-w-md shadow-2xl p-8 lg:p-12">
        <h1 className="text-4xl font-black mb-2 text-center text-[#111] tracking-tighter">Welcome Back</h1>
        <p className="text-[#888888] mb-8 text-center font-medium">Log in to view the freshest gear.</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-[#ff3b30]/50 transition-all text-[#111] font-medium"
              placeholder="hey@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl px-4 py-4 pr-12 outline-none focus:ring-2 focus:ring-[#ff3b30]/50 transition-all text-[#111] font-medium"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#111] transition-colors outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={login.isPending}
            className="mt-4 w-full py-4 btn-dopamine outline-none disabled:opacity-50"
          >
            {login.isPending ? 'Logging in...' : 'Enter Storefront'}
          </button>
          {login.isError && <p className="text-minimal-red text-sm text-center">Invalid credentials</p>}
        </form>

        <div className="mt-6 text-center text-sm text-minimal-gray flex flex-col gap-3">
          <span>Don't have an account?</span>
          <div className="flex justify-center gap-6">
            <Link href="/signup" className="text-minimal-red hover:underline font-semibold transition-all">Sign up as Customer</Link>
            <Link href="/signup?role=vendor" className="text-minimal-red hover:underline font-semibold transition-all">Become a Vendor</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
