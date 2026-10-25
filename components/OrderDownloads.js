'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

// The list of files a paid order unlocks. Every file is downloaded with its proof-of-purchase token (see lib/downloadAccess.js).
// Single products are listed first, then one block per bundle with a "Download all" button.
export default function OrderDownloads({ downloads, orderNumber }) {
  const [busy, setBusy] = useState(null);

  const download = async (d, keepBusy = false) => {
    if (!keepBusy) setBusy(d.productId + (d.bundleId || ''));
    try {
      const fileName = d.title.replace(/[^a-z0-9]/gi, '_') + '.' + d.ext;
      const res = await fetch(`/api/download?file=${encodeURIComponent(d.key)}&name=${encodeURIComponent(fileName)}&order=${encodeURIComponent(orderNumber)}&pt=${encodeURIComponent(d.token)}&format=json`);
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
      alert('Download failed. Please try again, or find your files later on the My Downloads page with your order number.');
    } finally {
      if (!keepBusy) setBusy(null);
    }
  };

  const downloadAll = async (files, key) => {
    setBusy(key);
    for (const d of files) {
      await download(d, true);
      await new Promise((r) => setTimeout(r, 900)); // browsers may ask permission for several downloads, so start them one after another
    }
    setBusy(null);
  };

  const singles = downloads.filter((d) => !d.bundleId);
  const bundles = Object.values(
    downloads.filter((d) => d.bundleId).reduce((acc, d) => {
      (acc[d.bundleId] ||= { id: d.bundleId, title: d.bundleTitle, files: [] }).files.push(d);
      return acc;
    }, {})
  );

  if (downloads.length === 0) {
    return <p className="text-sm text-muted-foreground">There are no downloadable files on this order. Please contact support with your order number.</p>;
  }

  return (
    <div className="space-y-3 text-left">
      {singles.map((d) => (
        <div key={d.productId} className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg">
          <span className="font-medium text-sm">{d.title}</span>
          <Button variant="outline" size="sm" disabled={!!busy} onClick={() => download(d)}>
            <Download className="h-4 w-4 mr-1" /> {busy === d.productId ? 'Preparing...' : 'Download'}
          </Button>
        </div>
      ))}
      {bundles.map((b) => (
        <div key={b.id} className="p-3 bg-white rounded-lg">
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
              <div key={d.productId} className="flex items-center justify-between gap-2 text-sm bg-gray-50 rounded px-2 py-1">
                <span className="truncate">{d.title}</span>
                <Button variant="outline" size="sm" disabled={!!busy} onClick={() => download(d)}>
                  {busy === d.productId + d.bundleId ? 'Preparing...' : 'Download'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
