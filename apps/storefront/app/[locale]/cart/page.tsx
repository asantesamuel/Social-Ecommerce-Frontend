'use client';

import { useCart } from '../../../hooks/useCart';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from '../../../i18n/routing';

export default function CartPage() {
  const { cart, updateItem, removeItem, clearCart } = useCart();
  
  if (cart.isLoading) return <div className="p-24 flex justify-center"><div className="animate-pulse h-96 w-full max-w-4xl bg-black/5 dark:bg-white/5 rounded-3xl" /></div>;
  if (!cart.data) return <div className="p-24 text-center font-bold text-minimal-gray">Failed to load cart</div>;

  const cartData = cart.data;
  const items = cartData.items || [];
  const subtotal = cartData.subtotal || 0;

  return (
    <div className="container mx-auto px-4 pt-24 pb-12 flex-1 max-w-6xl relative z-10 w-full">
      <Link href="/" className="inline-flex items-center gap-2 text-minimal-gray hover:text-foreground transition-colors mb-12 font-medium tracking-wide">
        <ArrowLeft size={20} /> Continue Shopping
      </Link>
      
      <div className="flex items-end justify-between mb-8 pb-6 border-b border-black/5 dark:border-white/10">
        <h1 className="text-5xl font-black tracking-tighter">Your Cart</h1>
        {items.length > 0 && (
          <button 
            onClick={() => clearCart.mutate()} 
            className="text-xs font-black text-minimal-red hover:text-minimal-redDark uppercase tracking-[0.2em] flex items-center gap-2 transition-colors cursor-pointer"
          >
             Clear Cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="glass-card py-32 cursor-default text-center flex flex-col items-center gap-6 shadow-sm border-0 border-transparent rounded-3xl">
           <div className="w-32 h-32 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-2">
              <Trash2 className="text-minimal-gray opacity-30" size={48} />
           </div>
           <h2 className="text-3xl font-black tracking-tight">Your cart is empty.</h2>
           <p className="text-minimal-gray text-lg font-medium">Looks like you haven't added anything to your cart yet.</p>
           <Link href="/" className="mt-6 bg-foreground text-background px-10 py-4 rounded-xl font-bold hover:shadow-xl hover:-translate-y-1 transition-all active:scale-[0.98]">
              Start Shopping
           </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_420px] gap-12 items-start">
          <div className="flex flex-col gap-6">
            {items.map((item: any) => (
              <div key={item.id} className="glass-card flex flex-col sm:flex-row gap-6 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-full sm:w-32 aspect-square bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 rounded-2xl flex-shrink-0 relative overflow-hidden mix-blend-multiply dark:mix-blend-normal">
                   {item.product?.imageUrls?.[0] && <img src={item.product?.imageUrls?.[0]} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-4">
                     <h3 className="font-bold text-xl tracking-tight leading-none">{item.productName || item.product?.name}</h3>
                     <div className="font-black text-2xl text-foreground ml-4">${item.unitPrice?.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5 dark:border-white/5">
                     <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 rounded-xl px-2 py-1">
                        <button onClick={() => updateItem.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg outline-none cursor-pointer disabled:opacity-50"><Minus size={16}/></button>
                        <span className="font-black text-base w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg outline-none cursor-pointer"><Plus size={16}/></button>
                     </div>
                     <button onClick={() => removeItem.mutate(item.id)} className="text-minimal-gray hover:text-minimal-red hover:bg-minimal-red/10 transition-colors p-3 rounded-xl cursor-pointer">
                        <Trash2 size={20} />
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card shadow-2xl border-black/5 dark:border-white/10 sticky top-32 p-8 text-foreground rounded-3xl">
            <h2 className="text-2xl font-bold mb-8 tracking-tight">Order Summary</h2>
            <div className="flex justify-between items-center mb-6 text-minimal-gray font-medium text-lg">
               <span>Subtotal ({items.length} items)</span>
               <span className="text-foreground tracking-tight">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-8 text-minimal-gray font-medium text-lg">
               <span>Shipping</span>
               <span className="text-foreground font-bold tracking-tight">Free</span>
            </div>
            <div className="border-t border-black/10 dark:border-white/10 pt-8 flex justify-between items-center mb-10">
               <span className="font-black text-2xl tracking-tight">Total</span>
               <span className="font-black text-4xl text-minimal-red tracking-tighter">${subtotal.toFixed(2)}</span>
            </div>
            <button className="w-full btn-dopamine py-6 text-xl outline-none">
              SECURE CHECKOUT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
