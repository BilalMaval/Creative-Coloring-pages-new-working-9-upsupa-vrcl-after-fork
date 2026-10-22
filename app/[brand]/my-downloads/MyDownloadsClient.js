'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, PackageSearch } from 'lucide-react';

export default function MyDownloadsClient() {
  const [form, setForm] = useState({ orderNumber: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(null);

  const lookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) setOrder(data); else setError(data.error || 'Order not found');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const download = async (d, keepBusy = false) => {
    if (!keepBusy) setBusy(d.productId + (d.bundleId || ''));
    try {
      const fileName = d.title.replace(/[^a-z0-9]/gi, '_') + '.' + d.ext;
      const res = await fetch(`/api/download?file=${encodeURIComponent(d.key)}&name=${encodeURIComponent(fileName)}&order=${encodeURIComponent(order.orderNumber)}&pt=${encodeURIComponent(d.token)}&format=json`);
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error('Download failed');
      const link = document.createElement('a');
      link.href = data.url;
      link.download = fileName;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert('Download failed. Please try again, or contact support with your order number.');
    } finally {
      if (!keepBusy) setBusy(null);
    }
  };

  const downloadAll = async (files, key) => {
    setBusy(key);
    for (const d of files) {
      await download(d, true);
      await new Promise((r) => setTimeout(r, 900));
    }
    setBusy(null);
  };

  // Group: single products first, then one block per bundle
  const singles = order ? order.downloads.filter((d) => !d.bundleId) : [];
  const bundles = order
    ? Object.values(order.downloads.filter((d) => d.bundleId).reduce((acc, d) => {
        (acc[d.bundleId] ||= { id: d.bundleId, title: d.bundleTitle, files: [] }).files.push(d);
        return acc;
      }, {}))
    : [];

  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 flex-1">
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2 flex items-center gap-3">
          <PackageSearch className="h-8 w-8" /> My Downloads
        </h1>
        <p className="text-gray-600 mb-6">Enter the order number and email address from your order confirmation to get your files again.</p>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={lookup} className="space-y-4">
              <div>
                <Label htmlFor="orderNumber">Order number</Label>
                <Input id="orderNumber" value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} placeholder="CCP-XXXXXXXX-XXXX" required className="uppercase" />
              </div>
              <div>
                <Label htmlFor="email">Email address used at checkout</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" required />
              </div>
              {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded text-sm">{error}</div>}
              <Button type="submit" disabled={loading} className="w-full" size="lg">{loading ? 'Looking up...' : 'Find my downloads'}</Button>
            </form>
          </CardContent>
        </Card>

        {order && (
          <Card>
            <CardHeader><CardTitle>Order #{order.orderNumber}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {order.downloads.length === 0 && (
                <p className="text-sm text-muted-foreground">There are no downloadable files on this order. Please contact support with your order number.</p>
              )}

              {singles.map((d) => (
                <div key={d.productId} className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium text-sm">{d.title}</span>
                  <Button variant="outline" size="sm" disabled={busy === d.productId} onClick={() => download(d)}>
                    <Download className="h-4 w-4 mr-1" /> {busy === d.productId ? 'Preparing...' : 'Download'}
                  </Button>
                </div>
              ))}

              {bundles.map((b) => (
                <div key={b.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-semibold">🎁 {b.title}</span>
                    {b.files.length > 1 && (
                      <Button variant="outline" size="sm" disabled={!!busy} onClick={() => downloadAll(b.files, `all-${b.id}`)}>
                        {busy === `all-${b.id}` ? 'Preparing...' : 'Download all'}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {b.files.map((d) => (
                      <div key={d.productId} className="flex items-center justify-between gap-2 text-sm bg-white rounded px-2 py-1">
                        <span className="truncate">{d.title}</span>
                        <Button variant="outline" size="sm" disabled={!!busy} onClick={() => download(d)}>
                          {busy === d.productId + d.bundleId ? 'Preparing...' : 'Download'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
