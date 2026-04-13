'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@repo/api';
import { useRouter } from 'next/navigation';

export default function VendorDashboardPage() {
  const queryClient = useQueryClient();
  const [currency, setCurrency] = useState('GHS');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch vendor profile
  const { data: vendor, isLoading, isError } = useQuery({
    queryKey: ['vendorProfile'],
    queryFn: async () => {
      const { data } = await apiClient.get('/vendors/me');
      return data;
    },
    retry: false
  });

  const payFeeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/vendors/pay-fee', { currency, callbackUrl: window.location.href });
      return data;
    },
    onSuccess: (data) => {
      if (data.fee?.paymentUrl) {
         window.location.href = data.fee.paymentUrl;
      }
    }
  });

  const uploadDocMutation = useMutation({
     mutationFn: async () => {
       if (!selectedFile) return;
       // Simulating S3 upload by assuming it works and just sending a mock fileKey
       const fileKey = `docs/${Date.now()}_${selectedFile.name}`;
       const { data } = await apiClient.post('/vendors/documents', {
         fileKey,
         documentType: 'business_registration'
       });
       return data;
     },
     onSuccess: () => {
       alert("Document Uploaded!");
       setSelectedFile(null);
     }
  });

  if (isLoading) return <div className="flex h-screen items-center justify-center p-8 text-2xl font-black">LOADING COMMAND CENTER...</div>;
  if (isError) return <div className="flex flex-col items-center justify-center p-8 text-[#ff3b30]"><h2 className="text-4xl font-black">UNAUTHORIZED</h2><p className="mt-4 text-minimal-gray">No vendor profile found for this user.</p></div>

  const status = vendor?.status;

  return (
    <div className="min-h-screen bg-[#fafafa] p-8 lg:p-16">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <header className="flex justify-between items-center glass-card p-6 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-[#111] uppercase tracking-tighter">Command Center</h1>
            <p className="text-minimal-gray font-medium">{vendor.companyName}</p>
          </div>
          <div>
             <span className="font-bold py-2 px-4 rounded-full bg-[#111] text-white uppercase text-xs tracking-wider">
               STATUS: {status}
             </span>
          </div>
        </header>

        {/* PENDING PAYMENT */}
        {status === 'pending_payment' && (
          <div className="glass-card shadow-2xl border-l-[8px] border-[#ff3b30] p-8 lg:p-12 mb-8 mt-12 max-w-2xl mx-auto">
            <h2 className="text-4xl justify-center text-center font-black mb-4 uppercase tracking-tighter">Access Denied</h2>
            <p className="text-[#555] font-medium text-center mb-10 text-lg">Your onboarding fee must be cleared before you can unlock the command center.</p>
            <div className="flex flex-col gap-4">
              <select 
                 value={currency} 
                 onChange={e => setCurrency(e.target.value)}
                 className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl px-4 py-4 outline-none font-medium"
              >
                  <option value="GHS">GHS (Ghana Cedis)</option>
                  <option value="USD">USD (US Dollars)</option>
              </select>
              <button 
                 onClick={() => payFeeMutation.mutate()} 
                 disabled={payFeeMutation.isPending}
                 className="w-full py-5 btn-dopamine text-lg text-white"
              >
                {payFeeMutation.isPending ? 'Connecting to Gateway...' : 'Pay Gateway Fee'}
              </button>
            </div>
          </div>
        )}

        {/* PENDING REVIEW / DOCUMENT UPLOAD (PAYMENT GATED) */}
        {status === 'pending_review' && (
          <div className="grid lg:grid-cols-2 gap-8">
             <div className="glass-card shadow-sm p-8 flex flex-col justify-center items-center h-full min-h-[300px]">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-center">Awaiting Validation</h2>
                <p className="text-minimal-gray font-medium text-center mt-4 text-lg">Our team is reviewing your profile. In the meantime, you must upload your business documents.</p>
             </div>
             
             <div className="glass-card p-8 bg-white border border-[#eaeaea]">
               <h3 className="text-xl font-bold uppercase tracking-tight mb-6">Upload Verification Doc</h3>
               <p className="text-sm font-medium text-minimal-gray mb-6">Must be Business Registration or ID proof.</p>
               
               <input 
                 type="file" 
                 onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                 className="block w-full text-sm text-slate-500 mb-6
                   file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold
                   file:bg-black file:text-white file:cursor-pointer transition-all border border-[#e4e4e7] rounded-xl py-4 px-4 bg-gray-50"
               />
               
               <button 
                 onClick={() => uploadDocMutation.mutate()}
                 disabled={!selectedFile || uploadDocMutation.isPending}
                 className="w-full py-4 bg-black text-white rounded-xl uppercase font-bold tracking-widest hover:bg-neutral-800 disabled:opacity-50 transition-colors"
               >
                 {uploadDocMutation.isPending ? 'Uploading...' : 'Submit Document'}
               </button>
             </div>
          </div>
        )}

        {/* APPROVED DASHBOARD */}
        {status === 'approved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div className="glass-card p-10 cursor-pointer group hover:-translate-y-2 transition-all shadow-md">
              <h3 className="text-2xl font-black uppercase text-black group-hover:text-[#ff3b30] transition-colors mb-2">Inventory Sync</h3>
              <p className="text-[#888] font-medium font-sm">Manage your drops, edit specs, and control supply chains.</p>
            </div>
            <div className="glass-card p-10 cursor-pointer group hover:-translate-y-2 transition-all shadow-md">
              <h3 className="text-2xl font-black uppercase text-black group-hover:text-[#ff3b30] transition-colors mb-2">Order Matrix</h3>
              <p className="text-[#888] font-medium font-sm">Fulfill demands. Track logistics. Monitor revenue streams.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
