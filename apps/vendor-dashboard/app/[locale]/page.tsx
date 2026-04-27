'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@repo/api';
import { usePathname, useSearchParams } from 'next/navigation';

interface Category {
  id: string;
  name: string;
}

interface VendorProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  stockQuantity: number;
  approvalStatus: string;
  imageUrls?: string[];
}

export default function VendorDashboardPage() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currency, setCurrency] = useState('GHS');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<'business_registration' | 'tax_certificate' | 'id_proof' | 'other'>('business_registration');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productMessage, setProductMessage] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [isSyncingPayment, setIsSyncingPayment] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    stockQuantity: '',
    categoryId: ''
  });

  const paymentReference = searchParams.get('reference') || searchParams.get('trxref');
  const paystackReturnDetected = Boolean(paymentReference);

  // Fetch vendor profile
  const { data: vendor, isLoading, isError, refetch: refetchVendorProfile } = useQuery({
    queryKey: ['vendorProfile'],
    queryFn: async () => {
      const { data } = await apiClient.get('/vendors/me');
      return data;
    },
    retry: false
  });

  const dashboardCallbackUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return `${window.location.origin}${pathname}`;
  }, [pathname]);

  useEffect(() => {
    if (!paystackReturnDetected) {
      return;
    }

    setPaymentMessage('Payment received. Syncing your vendor status...');
    setIsSyncingPayment(true);

    const interval = window.setInterval(async () => {
      const result = await refetchVendorProfile();
      const nextStatus = result.data?.status;

      if (nextStatus && nextStatus !== 'pending_payment') {
        setPaymentMessage(
          nextStatus === 'pending_review'
            ? 'Payment confirmed. You can now upload your verification documents.'
            : 'Payment confirmed and dashboard refreshed.'
        );
        setIsSyncingPayment(false);
        window.clearInterval(interval);
      }
    }, 2500);

    return () => {
      setIsSyncingPayment(false);
      window.clearInterval(interval);
    };
  }, [paystackReturnDetected, refetchVendorProfile]);

  const { data: categories = [] } = useQuery({
    queryKey: ['vendor-categories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/categories');
      return data as Category[];
    },
    enabled: vendor?.status === 'approved'
  });

  const { data: vendorProducts } = useQuery({
    queryKey: ['vendor-products'],
    queryFn: async () => {
      const { data } = await apiClient.get('/products/vendor/my-products', {
        params: { limit: 20 }
      });
      return data;
    },
    enabled: vendor?.status === 'approved'
  });

  const payFeeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/vendors/pay-fee', {
        currency,
        callbackUrl: dashboardCallbackUrl
      });
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
       if (!selectedFile) {
         throw new Error('Please select a document to upload.');
       }

       const contentType = selectedFile.type || 'application/octet-stream';

       const presignResponse = await apiClient.post('/uploads/presign', {
         filename: selectedFile.name,
         contentType,
         fileSize: selectedFile.size,
         folder: 'documents'
       });

       const { uploadUrl, fileKey } = presignResponse.data;

       const uploadResponse = await fetch(uploadUrl, {
         method: 'PUT',
         headers: {
           'Content-Type': contentType
         },
         body: selectedFile
       });

       if (!uploadResponse.ok) {
         throw new Error('Upload to storage failed. Please try again.');
       }

       await apiClient.post('/uploads/confirm', {
         fileKey,
         folder: 'documents'
       });

       const { data } = await apiClient.post('/vendors/documents', {
         fileKey,
         documentType
       });
       return data;
     },
     onSuccess: () => {
       setUploadMessage('Document uploaded successfully and submitted for review.');
       setSelectedFile(null);
       queryClient.invalidateQueries({ queryKey: ['vendorProfile'] });
     },
     onError: (error: any) => {
       setUploadMessage(error?.message || 'Document upload failed.');
     }
  });

  const createProductMutation = useMutation({
    mutationFn: async () => {
      let imageUrls: string[] = [];

      if (productImage) {
        const contentType = productImage.type || 'application/octet-stream';
        const presignResponse = await apiClient.post('/uploads/presign', {
          filename: productImage.name,
          contentType,
          fileSize: productImage.size,
          folder: 'products'
        });

        const { uploadUrl, fileKey } = presignResponse.data;

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': contentType
          },
          body: productImage
        });

        if (!uploadResponse.ok) {
          throw new Error('Product image upload failed.');
        }

        const confirmResponse = await apiClient.post('/uploads/confirm', {
          fileKey,
          folder: 'products'
        });

        imageUrls = [confirmResponse.data.url];
      }

      const payload = {
        name: productForm.name.trim(),
        slug: productForm.slug.trim(),
        description: productForm.description.trim(),
        price: Number(productForm.price),
        stockQuantity: Number(productForm.stockQuantity),
        categoryId: productForm.categoryId || undefined,
        imageUrls
      };

      const { data } = await apiClient.post('/products', payload);
      return data;
    },
    onSuccess: () => {
      setProductMessage('Product created and sent for review.');
      setProductImage(null);
      setProductForm({
        name: '',
        slug: '',
        description: '',
        price: '',
        stockQuantity: '',
        categoryId: ''
      });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
    },
    onError: (error: any) => {
      setProductMessage(error?.response?.data?.message || error?.message || 'Product creation failed.');
    }
  });

  const handleProductFieldChange = (field: string, value: string) => {
    setProductForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleNameChange = (value: string) => {
    setProductForm((current) => {
      const nextName = value;
      const nextSlug = current.slug === '' || current.slug === current.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        ? nextName
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        : current.slug;

      return {
        ...current,
        name: nextName,
        slug: nextSlug
      };
    });
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center p-8 text-2xl font-black">LOADING COMMAND CENTER...</div>;
  if (isError) return <div className="flex flex-col items-center justify-center p-8 text-[#ff3b30]"><h2 className="text-4xl font-black">UNAUTHORIZED</h2><p className="mt-4 text-minimal-gray">No vendor profile found for this user.</p></div>

  const status = vendor?.status;

  return (
    <div className="min-h-screen bg-[#fafafa] p-8 lg:p-16">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {paystackReturnDetected && (
          <div className="glass-card border-l-[8px] border-[#111] p-6 lg:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isSyncingPayment ? 'bg-[#111] text-white' : 'bg-[#ecfdf3] text-[#027a48]'}`}>
                  {isSyncingPayment ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="text-xl font-black">OK</span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight text-[#111]">
                    {isSyncingPayment ? 'Payment Confirmed, Syncing Status' : 'Payment Confirmed'}
                  </h2>
                  <p className="text-sm lg:text-base text-minimal-gray font-medium mt-1">
                    {paymentMessage || 'We are updating your vendor access so you can continue onboarding.'}
                  </p>
                  {paymentReference && (
                    <p className="text-xs font-bold uppercase tracking-wider text-[#777] mt-3">
                      Reference: {paymentReference}
                    </p>
                  )}
                </div>
              </div>
              <div className="lg:text-right">
                <div className={`inline-flex items-center gap-2 px-4 py-3 rounded-full text-xs font-black uppercase tracking-widest ${isSyncingPayment ? 'bg-black text-white' : 'bg-[#ecfdf3] text-[#027a48]'}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${isSyncingPayment ? 'bg-white animate-pulse' : 'bg-[#12b76a]'}`} />
                  {isSyncingPayment ? 'Updating Access' : 'Ready To Continue'}
                </div>
              </div>
            </div>
          </div>
        )}

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
            {paymentMessage && (
              <p className="text-center text-sm font-bold text-[#111] mb-6">{paymentMessage}</p>
            )}
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

               <select
                 value={documentType}
                 onChange={(e) => setDocumentType(e.target.value as 'business_registration' | 'tax_certificate' | 'id_proof' | 'other')}
                 className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl px-4 py-4 outline-none font-medium mb-4"
               >
                 <option value="business_registration">Business Registration</option>
                 <option value="tax_certificate">Tax Certificate</option>
                 <option value="id_proof">ID Proof</option>
                 <option value="other">Other</option>
               </select>
               
               <input 
                 type="file" 
                 accept=".pdf,.doc,.docx,image/jpeg,image/png"
                 onChange={(e) => {
                   setSelectedFile(e.target.files?.[0] || null);
                   setUploadMessage(null);
                 }}
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

               {uploadMessage && (
                 <p className="mt-4 text-sm font-medium text-minimal-gray">{uploadMessage}</p>
               )}
             </div>
          </div>
        )}

        {/* APPROVED DASHBOARD */}
        {status === 'approved' && (
          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8 mt-4">
            <div className="glass-card p-8 shadow-md">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-black uppercase text-black tracking-tight">Create Product</h3>
                  <p className="text-[#888] font-medium text-sm">Upload the product image first, then save the listing.</p>
                </div>
                <span className="text-[10px] font-bold uppercase px-3 py-2 rounded-full bg-[#111] text-white tracking-wider">REAL UPLOAD FLOW</span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  value={productForm.name}
                  onChange={(e) => {
                    handleNameChange(e.target.value);
                    setProductMessage(null);
                  }}
                  placeholder="Product name"
                  className="bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl px-4 py-4 outline-none font-medium"
                />
                <input
                  value={productForm.slug}
                  onChange={(e) => {
                    handleProductFieldChange('slug', e.target.value.toLowerCase());
                    setProductMessage(null);
                  }}
                  placeholder="product-slug"
                  className="bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl px-4 py-4 outline-none font-medium"
                />
                <input
                  value={productForm.price}
                  onChange={(e) => {
                    handleProductFieldChange('price', e.target.value);
                    setProductMessage(null);
                  }}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  className="bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl px-4 py-4 outline-none font-medium"
                />
                <input
                  value={productForm.stockQuantity}
                  onChange={(e) => {
                    handleProductFieldChange('stockQuantity', e.target.value);
                    setProductMessage(null);
                  }}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Stock quantity"
                  className="bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl px-4 py-4 outline-none font-medium"
                />
                <select
                  value={productForm.categoryId}
                  onChange={(e) => {
                    handleProductFieldChange('categoryId', e.target.value);
                    setProductMessage(null);
                  }}
                  className="bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl px-4 py-4 outline-none font-medium md:col-span-2"
                >
                  <option value="">No Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <textarea
                  value={productForm.description}
                  onChange={(e) => {
                    handleProductFieldChange('description', e.target.value);
                    setProductMessage(null);
                  }}
                  placeholder="Product description"
                  className="bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl px-4 py-4 outline-none font-medium min-h-32 md:col-span-2 resize-y"
                />
                <div className="md:col-span-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      setProductImage(e.target.files?.[0] || null);
                      setProductMessage(null);
                    }}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold
                      file:bg-black file:text-white file:cursor-pointer transition-all border border-[#e4e4e7] rounded-xl py-4 px-4 bg-gray-50"
                  />
                  <p className="mt-3 text-xs text-minimal-gray font-medium">Accepted: JPEG, PNG, WEBP. Image upload is verified before the product is stored.</p>
                </div>
              </div>

              <button
                onClick={() => createProductMutation.mutate()}
                disabled={
                  createProductMutation.isPending ||
                  !productForm.name.trim() ||
                  !productForm.slug.trim() ||
                  productForm.price === '' ||
                  productForm.stockQuantity === ''
                }
                className="w-full mt-6 py-4 btn-dopamine text-lg text-white disabled:opacity-50"
              >
                {createProductMutation.isPending ? 'Uploading and Saving...' : 'Create Product'}
              </button>

              {productMessage && (
                <p className="mt-4 text-sm font-medium text-minimal-gray">{productMessage}</p>
              )}
            </div>

            <div className="glass-card p-8 shadow-md">
              <div className="mb-6">
                <h3 className="text-2xl font-black uppercase text-black tracking-tight">Your Products</h3>
                <p className="text-[#888] font-medium text-sm">These entries now only save image URLs that came through the verified upload path.</p>
              </div>

              <div className="flex flex-col gap-4">
                {(vendorProducts?.data as VendorProduct[] | undefined)?.map((product) => (
                  <div key={product.id} className="border border-[#f4f4f5] rounded-2xl p-4 bg-[#fafafa]">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-[#f4f4f5] overflow-hidden flex-shrink-0">
                        {product.imageUrls?.[0] ? (
                          <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-black text-lg tracking-tight">{product.name}</h4>
                            <p className="text-sm text-minimal-gray font-medium">{product.slug}</p>
                          </div>
                          <span className="text-[10px] font-bold uppercase px-3 py-2 rounded-full bg-black text-white tracking-wider">{product.approvalStatus}</span>
                        </div>
                        <div className="flex gap-6 mt-4 text-sm font-bold text-[#555]">
                          <span>${Number(product.price).toFixed(2)}</span>
                          <span>{product.stockQuantity} in stock</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )) || <p className="text-sm text-minimal-gray font-medium">No products yet.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
