'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Plus, Pencil, Trash2, Power, Star, ExternalLink, ArrowUp, ArrowDown, X, Upload, Search } from 'lucide-react';
import { unitPrice, bundleTotals, slugify } from '@/lib/bundlePricing';

const EMPTY = { title: '', slug: '', description: '', price: '', image: '', tags: '', isActive: true, isFeatured: false, productIds: [] };
const money = (n) => `$${Number(n || 0).toFixed(2)}`;

function Thumb({ src, className = 'w-10 h-12' }) {
  if (!src) return <div className={`${className} rounded bg-muted flex items-center justify-center text-sm`}>🎨</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" className={`${className} rounded object-cover bg-muted`} />;
}

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState([]);
  const [pool, setPool] = useState([]); // all products that can go in a bundle
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [bRes, pRes] = await Promise.all([fetch('/api/admin/bundles'), fetch('/api/printables?limit=1000')]);
      const b = await bRes.json();
      const p = await pRes.json();
      if (b.success) setBundles(b.data); else setError(b.error || 'Failed to load bundles');
      if (p.success) setPool(p.data);
    } catch {
      setError('Failed to load bundles');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // Products shown in the picker/selection: the live catalogue plus anything already in the bundle being edited
  const productMap = useMemo(() => {
    const m = new Map(pool.map((p) => [p.id, p]));
    if (editingId) {
      const current = bundles.find((b) => b.id === editingId);
      (current?.items || []).forEach((i) => { if (!m.has(i.id)) m.set(i.id, i); });
    }
    return m;
  }, [pool, bundles, editingId]);

  const selected = (form?.productIds || []).map((id) => productMap.get(id)).filter(Boolean);
  const totals = bundleTotals(selected, form?.price);

  const openNew = () => { setEditingId(null); setForm({ ...EMPTY }); setSlugTouched(false); setSearch(''); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openEdit = (b) => {
    setEditingId(b.id);
    setForm({
      title: b.title, slug: b.slug, description: b.description || '', price: b.price, image: b.image || '',
      tags: (b.tags || []).join(', '), isActive: b.isActive, isFeatured: b.isFeatured, productIds: b.items.map((i) => i.id),
    });
    setSlugTouched(true);
    setSearch('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setTitle = (e) => {
    const title = e.target.value;
    setForm({ ...form, title, ...(slugTouched ? {} : { slug: slugify(title) }) });
  };

  const addProduct = (id) => { if (!form.productIds.includes(id)) setForm({ ...form, productIds: [...form.productIds, id] }); };
  const removeProduct = (id) => setForm({ ...form, productIds: form.productIds.filter((x) => x !== id) });
  const moveProduct = (i, dir) => {
    const next = [...form.productIds];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setForm({ ...form, productIds: next });
  };
  const suggestPrice = (percentOff) => setForm({ ...form, price: (Math.round(totals.regularTotal * (1 - percentOff / 100) * 100) / 100).toFixed(2) });

  const uploadCover = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Cover image must be 5MB or smaller'); return; }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'image');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) setForm((f) => ({ ...f, image: data.url })); else setError(data.error || 'Upload failed');
    } catch { setError('Upload failed'); } finally { setUploading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(editingId ? `/api/admin/bundles/${editingId}` : '/api/admin/bundles', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Failed to save bundle'); return; }
      setForm(null);
      await load();
    } catch { setError('Failed to save bundle'); } finally { setSaving(false); }
  };

  const toggle = async (b, field) => {
    const res = await fetch(`/api/admin/bundles/${b.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggle: field, value: !b[field] }),
    });
    const data = await res.json();
    if (!data.success) alert(data.error || 'Failed to update bundle');
    load();
  };

  const remove = async (b) => {
    if (!confirm(`Delete bundle "${b.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/bundles/${b.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) alert(data.error || 'Failed to delete bundle');
    load();
  };

  const q = search.trim().toLowerCase();
  const candidates = pool.filter((p) => !form?.productIds.includes(p.id) && (!q || p.title.toLowerCase().includes(q))).slice(0, 60);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Package className="h-7 w-7" /> Bundles</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> New Bundle</Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        A bundle sells several products together at one fixed price. Customers see how much they save compared with buying the products one by one.
      </p>

      {form && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editingId ? 'Edit Bundle' : 'New Bundle'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={setTitle} required maxLength={120} placeholder="e.g. Spring Coloring Mega Pack" />
                </div>
                <div>
                  <Label>Web address (slug) *</Label>
                  <Input value={form.slug} onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: slugify(e.target.value) }); }} required maxLength={80} className="font-mono" />
                  <p className="text-xs text-muted-foreground mt-1">/bundle/{form.slug || '...'}</p>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <textarea value={form.description} onChange={set('description')} maxLength={4000} rows={4} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="What is in this bundle and who is it for?" />
              </div>

              {/* Products */}
              <div>
                <Label className="text-base">Products in this bundle * <span className="text-muted-foreground font-normal">(choose at least 2)</span></Label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                  <div className="border rounded-lg">
                    <div className="p-3 border-b relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products to add..." className="pl-9" />
                    </div>
                    <ul className="max-h-80 overflow-y-auto divide-y">
                      {candidates.length === 0 && <li className="p-4 text-sm text-muted-foreground text-center">{pool.length === 0 ? 'Loading products...' : 'No matching products'}</li>}
                      {candidates.map((p) => (
                        <li key={p.id} className="flex items-center gap-3 p-2">
                          <Thumb src={p.webpPath} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.title}</p>
                            <p className="text-xs text-muted-foreground">{unitPrice(p) === 0 ? 'Free' : money(unitPrice(p))}</p>
                          </div>
                          <Button type="button" size="sm" variant="outline" onClick={() => addProduct(p.id)}><Plus className="h-4 w-4" /></Button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border rounded-lg">
                    <div className="p-3 border-b text-sm font-medium">Selected ({selected.length})</div>
                    <ul className="max-h-80 overflow-y-auto divide-y">
                      {selected.length === 0 && <li className="p-4 text-sm text-muted-foreground text-center">Add products from the list on the left</li>}
                      {selected.map((p, i) => (
                        <li key={p.id} className="flex items-center gap-2 p-2">
                          <div className="flex flex-col">
                            <button type="button" disabled={i === 0} onClick={() => moveProduct(i, -1)} className="p-0.5 disabled:opacity-30 hover:bg-muted rounded" aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                            <button type="button" disabled={i === selected.length - 1} onClick={() => moveProduct(i, 1)} className="p-0.5 disabled:opacity-30 hover:bg-muted rounded" aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
                          </div>
                          <Thumb src={p.webpPath} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.title}</p>
                            <p className="text-xs text-muted-foreground">{unitPrice(p) === 0 ? 'Free' : money(unitPrice(p))}{p.isActive === false ? ' · inactive' : ''}</p>
                          </div>
                          <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removeProduct(p.id)}><X className="h-4 w-4" /></Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div>
                  <Label>Bundle price ($) *</Label>
                  <Input type="number" step="0.01" min="0.01" value={form.price} onChange={set('price')} required />
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs text-muted-foreground mr-1 self-center">Suggest:</span>
                    {[10, 20, 30, 40].map((pc) => (
                      <Button key={pc} type="button" size="sm" variant="outline" disabled={totals.regularTotal <= 0} onClick={() => suggestPrice(pc)}>{pc}% off</Button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 rounded-lg bg-muted/50 p-4 text-sm space-y-1">
                  <div className="flex justify-between"><span>Total if bought separately</span><strong>{money(totals.regularTotal)}</strong></div>
                  <div className="flex justify-between"><span>Bundle price</span><strong>{form.price ? money(totals.price) : '-'}</strong></div>
                  <div className="flex justify-between border-t pt-1"><span>Customer saves</span>
                    <strong className={totals.savings > 0 ? 'text-green-700' : 'text-orange-600'}>{form.price ? `${money(totals.savings)} (${totals.percentOff}%)` : '-'}</strong>
                  </div>
                  {form.price && selected.length > 0 && totals.savings === 0 && (
                    <p className="text-xs text-orange-600 pt-1">The bundle price is not lower than buying separately, so customers save nothing. You can still save it.</p>
                  )}
                  <p className="text-xs text-muted-foreground pt-1">Product sale prices are used in this total. Free products count as $0.</p>
                </div>
              </div>

              {/* Cover + extras */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Cover image (optional)</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Thumb src={form.image} className="w-20 h-16" />
                    <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-muted">
                      <Upload className="h-4 w-4" /> {uploading ? 'Uploading...' : form.image ? 'Replace' : 'Upload'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={(e) => uploadCover(e.target.files?.[0])} />
                    </label>
                    {form.image && <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, image: '' })}><X className="h-4 w-4 mr-1" /> Remove</Button>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Without a cover, the first 4 products are shown as a collage.</p>
                </div>
                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input value={form.tags} onChange={set('tags')} placeholder="spring, flowers, kids" />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active (visible and buyable)</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured on the home page</label>
              </div>

              {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded text-sm">{error}</div>}

              <div className="flex gap-2">
                <Button type="submit" disabled={saving || uploading}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create bundle'}</Button>
                <Button type="button" variant="outline" onClick={() => setForm(null)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!form && error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded text-sm mb-4">{error}</div>}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : bundles.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No bundles yet. Click "New Bundle" to create one.</div>
          ) : (
            <ul className="divide-y">
              {bundles.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-4 p-4">
                  <Thumb src={b.image || b.items[0]?.webpPath} className="w-16 h-14" />
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-semibold">{b.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">/bundle/{b.slug}</div>
                    <div className="text-xs text-muted-foreground mt-1">{b.items.length} products · {b.sold} sold</div>
                  </div>
                  <div className="text-sm text-right">
                    <div className="font-semibold">{money(b.price)}</div>
                    {b.savings > 0
                      ? <div className="text-xs text-green-700">{money(b.regularTotal)} separately · {b.percentOff}% off</div>
                      : <div className="text-xs text-orange-600">No saving ({money(b.regularTotal)} separately)</div>}
                  </div>
                  <div className="flex gap-1">
                    <Badge className={b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}>{b.isActive ? 'Active' : 'Hidden'}</Badge>
                    {b.isFeatured && <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>}
                  </div>
                  <div className="flex gap-1">
                    <a href={`/bundle/${b.slug}`} target="_blank" rel="noreferrer" title="View on site"><Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button></a>
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title={b.isFeatured ? 'Remove from home page' : 'Feature on home page'} onClick={() => toggle(b, 'isFeatured')}><Star className={`h-4 w-4 ${b.isFeatured ? 'fill-yellow-400 text-yellow-500' : ''}`} /></Button>
                    <Button variant="ghost" size="icon" title={b.isActive ? 'Hide' : 'Show'} onClick={() => toggle(b, 'isActive')}><Power className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Delete" className="text-destructive" onClick={() => remove(b)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
