'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import OrderDownloads from '@/components/OrderDownloads';

const POLL_MS = 2000;
const MAX_TRIES = 40; // about 80 seconds

export default function SuccessClient() {
  const [state, setState] = useState({ status: 'checking' }); // checking | paid | failed | refunded | review | timeout | invalid
  const tries = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const order = params.get('order');
    const sessionId = params.get('session_id');
    if (!order || !sessionId) { setState({ status: 'invalid' }); return undefined; }

    let stop = false;
    let timer;
    const check = async () => {
      try {
        const res = await fetch(`/api/stripe/order-status?order=${encodeURIComponent(order)}&session_id=${encodeURIComponent(sessionId)}`, { cache: 'no-store' });
        const data = await res.json();
        if (stop) return;
        if (res.status === 404) { setState({ status: 'invalid' }); return; }
        if (data.status === 'paid') {
          setState({ status: 'paid', ...data });
          // The payment is confirmed: now it is safe to empty the cart
          try { localStorage.removeItem('cart'); localStorage.removeItem('appliedCoupon'); } catch {}
          window.dispatchEvent(new Event('cartUpdated'));
          return;
        }
        if (['failed', 'refunded', 'review'].includes(data.status)) { setState({ status: data.status, orderNumber: order }); return; }
      } catch {
        // a network blip: just try again
      }
      tries.current += 1;
      if (tries.current >= MAX_TRIES) { setState({ status: 'timeout', orderNumber: order }); return; }
      timer = setTimeout(check, POLL_MS);
    };
    check();
    return () => { stop = true; clearTimeout(timer); };
  }, []);

  const { status } = state;
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            {status === 'checking' && (
              <>
                <Loader2 className="h-16 w-16 mx-auto mb-6 animate-spin text-primary" />
                <h1 className="text-2xl font-bold mb-2">Confirming your payment...</h1>
                <p className="text-muted-foreground">This only takes a few seconds. Please do not close this page.</p>
              </>
            )}

            {status === 'paid' && (
              <>
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold mb-2">Thank you for your purchase!</h1>
                <p className="text-xl text-muted-foreground mb-1">Order #{state.orderNumber}</p>
                <p className="text-muted-foreground mb-6">Paid ${Number(state.total).toFixed(2)}. A confirmation email is on its way. Your downloads are ready:</p>
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <OrderDownloads downloads={state.downloads || []} orderNumber={state.orderNumber} />
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Need your files again later? Use <Link href="/my-downloads" className="underline">My Downloads</Link> with your order number and email.
                </p>
                <Link href="/"><Button size="lg">Continue Shopping</Button></Link>
              </>
            )}

            {status === 'failed' && (
              <>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold mb-2">The payment was not completed</h1>
                <p className="text-muted-foreground mb-6">You have not been charged. Your cart is still saved.</p>
                <Link href="/checkout"><Button size="lg">Try again</Button></Link>
              </>
            )}

            {status === 'refunded' && (
              <>
                <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold mb-2">This order was refunded</h1>
                <p className="text-muted-foreground">The downloads for this order are no longer available. Please contact us if this is a mistake.</p>
              </>
            )}

            {status === 'review' && (
              <>
                <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold mb-2">We are checking your payment</h1>
                <p className="text-muted-foreground">Order #{state.orderNumber}. Your payment was received but needs a quick manual check. We will email you shortly; please contact us with your order number if you do not hear back.</p>
              </>
            )}

            {status === 'timeout' && (
              <>
                <Loader2 className="h-16 w-16 mx-auto mb-6 text-primary" />
                <h1 className="text-2xl font-bold mb-2">Your payment is still being processed</h1>
                <p className="text-muted-foreground mb-6">Order #{state.orderNumber}. Some payment methods take a little longer. You will get a confirmation email as soon as it clears, and your files will then be on the <Link href="/my-downloads" className="underline">My Downloads</Link> page (order number + email).</p>
              </>
            )}

            {status === 'invalid' && (
              <>
                <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold mb-2">We could not find this order</h1>
                <p className="text-muted-foreground mb-6">If you just paid, your confirmation email has the details, and your files are on the <Link href="/my-downloads" className="underline">My Downloads</Link> page.</p>
                <Link href="/"><Button>Back to the shop</Button></Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
