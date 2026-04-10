'use client';

import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Link } from '../../../i18n/routing';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate({ firstName, lastName, email, password });
  };

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <div className="glass-card w-full max-w-md shadow-2xl p-8 lg:p-12">
        <h1 className="text-4xl font-black mb-2 text-center text-[#111] tracking-tighter">Create Account</h1>
        <p className="text-[#888888] mb-8 text-center font-medium">Join the future of commerce.</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">First Name</label>
                <input 
                  type="text" 
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-[#ff3b30]/50 transition-all text-[#111] font-medium"
                  placeholder="Jane"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Last Name</label>
                <input 
                  type="text" 
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-[#ff3b30]/50 transition-all text-[#111] font-medium"
                  placeholder="Doe"
                />
              </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-minimal-red/50 transition-all text-foreground"
              placeholder="hey@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-minimal-red/50 transition-all text-foreground"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={register.isPending}
            className="mt-6 w-full py-4 btn-dopamine outline-none disabled:opacity-50"
          >
            {register.isPending ? 'Signing up...' : 'Create Account'}
          </button>
          {register.isError && <p className="text-minimal-red text-sm text-center">Registration failed</p>}
        </form>

        <p className="mt-6 text-center text-sm text-minimal-gray">
          Already a member? <Link href="/login" className="text-foreground hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
