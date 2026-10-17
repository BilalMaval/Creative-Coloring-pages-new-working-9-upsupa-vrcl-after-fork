'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tag, Plus, Pencil, Trash2, Power, Shuffle } from 'lucide-react';

const EMPTY = {
  code: '', description: '', discountType: 'PERCENT', discountValue: '',
  minOrderAmount: '', maxDiscountAmount: '',
  startDate: '', startTime: '00:01', expiresDate: '', expiresTime: '23:59',
  usageLimit: '', perCustomerLimit: '', isActive: true,
};

// Dates and times are entered in the admin's own timezone and converted to an exact moment (UTC) before saving,
// so "00:01" means 00:01 for the admin, not for the server.
const pad = (n) => String(n).padStart(2, '0');
const splitLocal = (iso, fallbackTime) => {
  if (!iso) return { date: '', time: fallbackTime };
  const d = new Date(iso);
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
};
const joinLocal = (date, time, fallbackTime) => (date ? new Date(`${date}T${time || fallbackTime}`).toISOString() : '');

const randomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
};

function statusOf(c) {
  const now = new Date();
  if (!c.is_active) return { label: 'Disabled', cls: 'bg-gray-200 text-gray-700' };
  if (c.expires_at && new Date(c.expires_at) < now) return { label: 'Expired', cls: 'bg-red-100 text-red-700' };
  if (c.starts_at && new Date(c.starts_at) > now) return { label: 'Scheduled', cls: 'bg-blue-100 text-blue-700' };
  if (c.usage_limit != null && c.used_count >= c.usage_limit) return { label: 'Used up', cls: 'bg-orange-100 text-orange-700' };
  return { label: 'Active', cls: 'bg-green-100 text-green-700' };
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setupError, setSetupError] = useState('');
  const [form, setForm] = useState(null); // null = closed
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (data.success) { setCoupons(data.data); setSetupError(''); }
      else if (data.setupRequired) setSetupError(data.error);
      else setError(data.error || 'Failed to load coupons');
    } catch {
      setError('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditingId(null); setForm({ ...EMPTY, code: randomCode() }); setError(''); };
  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({
      code: c.code, description: c.description || '', discountType: c.discount_type, discountValue: c.discount_value,
      minOrderAmount: c.min_order_amount || '', maxDiscountAmount: c.max_discount_amount ?? '',
      startDate: splitLocal(c.starts_at, '00:01').date, startTime: splitLocal(c.starts_at, '00:01').time,
      expiresDate: splitLocal(c.expires_at, '23:59').date, expiresTime: splitLocal(c.expires_at, '23:59').time,
      usageLimit: c.usage_limit ?? '', perCustomerLimit: c.per_customer_limit ?? '', isActive: c.is_active,
    });
    setError('');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          startsAt: joinLocal(form.startDate, form.startTime, '00:01'),
          expiresAt: joinLocal(form.expiresDate, form.expiresTime, '23:59'),
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Failed to save coupon'); return; }
      setForm(null);
      await load();
    } catch {
      setError('Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c) => {
    const res = await fetch(`/api/admin/coupons/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggleOnly: true, isActive: !c.is_active }),
    });
    const data = await res.json();
    if (!data.success) alert(data.error || 'Failed to update coupon');
    load();
  };

  const remove = async (c) => {
    if (!confirm(`Delete coupon ${c.code}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) alert(data.error || 'Failed to delete coupon');
    load();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Tag className="h-7 w-7" /> Coupons</h1>
        {!setupError && <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> New Coupon</Button>}
      </div>

      {setupError && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardContent className="py-4 text-sm text-yellow-900">
            <strong>One-time setup needed.</strong> {setupError}
          </CardContent>
        </Card>
      )}

      {form && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editingId ? 'Edit Coupon' : 'New Coupon'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Code *</Label>
                  <div className="flex gap-2">
                    <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required maxLength={32} className="uppercase font-mono" />
                    <Button type="button" variant="outline" size="icon" title="Generate random code" onClick={() => setForm({ ...form, code: randomCode() })}>
                      <Shuffle className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Letters, numbers, - and _. Not case sensitive for customers.</p>
                </div>
                <div>
                  <Label>Discount type *</Label>
                  <select value={form.discountType} onChange={set('discountType')} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FIXED">Fixed amount ($)</option>
                  </select>
                </div>
                <div>
                  <Label>{form.discountType === 'PERCENT' ? 'Percent off *' : 'Amount off ($) *'}</Label>
                  <Input type="number" step="0.01" min="0.01" max={form.discountType === 'PERCENT' ? 100 : undefined} value={form.discountValue} onChange={set('discountValue')} required />
                </div>
              </div>

              <div>
                <Label>Description (optional, shown to customers)</Label>
                <Input value={form.description} onChange={set('description')} maxLength={200} placeholder="e.g. Spring sale - 20% off" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Minimum order ($)</Label>
                  <Input type="number" step="0.01" min="0" value={form.minOrderAmount} onChange={set('minOrderAmount')} placeholder="None" />
                </div>
                {form.discountType === 'PERCENT' && (
                  <div>
                    <Label>Maximum discount ($)</Label>
                    <Input type="number" step="0.01" min="0" value={form.maxDiscountAmount} onChange={set('maxDiscountAmount')} placeholder="No cap" />
                  </div>
                )}
                <div>
                  <Label>Total uses allowed</Label>
                  <Input type="number" min="1" step="1" value={form.usageLimit} onChange={set('usageLimit')} placeholder="Unlimited" />
                </div>
                <div>
                  <Label>Uses per customer (email)</Label>
                  <Input type="number" min="1" step="1" value={form.perCustomerLimit} onChange={set('perCustomerLimit')} placeholder="Unlimited" />
                </div>
                <div>
                  <Label>Starts</Label>
                  <div className="flex gap-2">
                    <Input type="date" value={form.startDate} onChange={set('startDate')} />
                    <Input type="time" value={form.startTime} onChange={set('startTime')} className="w-32" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Leave the date empty to start right away. Default time 00:01.</p>
                </div>
                <div>
                  <Label>Expires</Label>
                  <div className="flex gap-2">
                    <Input type="date" value={form.expiresDate} onChange={set('expiresDate')} />
                    <Input type="time" value={form.expiresTime} onChange={set('expiresTime')} className="w-32" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Leave the date empty for no expiry. Default time 23:59.</p>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active (customers can use it)
              </label>

              {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded text-sm">{error}</div>}

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create coupon'}</Button>
                <Button type="button" variant="outline" onClick={() => setForm(null)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!form && error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded text-sm mb-4">{error}</div>}

      {!setupError && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : coupons.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No coupons yet. Click "New Coupon" to create one.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Rules</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((c) => {
                    const st = statusOf(c);
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-mono font-semibold">{c.code}</div>
                          {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {c.discount_type === 'PERCENT' ? `${c.discount_value}% off` : `$${Number(c.discount_value).toFixed(2)} off`}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground space-y-0.5">
                          {c.min_order_amount > 0 && <div>Min order ${Number(c.min_order_amount).toFixed(2)}</div>}
                          {c.max_discount_amount > 0 && <div>Max discount ${Number(c.max_discount_amount).toFixed(2)}</div>}
                          {c.per_customer_limit != null && <div>{c.per_customer_limit} per customer</div>}
                          {c.starts_at && <div>From {new Date(c.starts_at).toLocaleString()}</div>}
                          {c.expires_at && <div>Until {new Date(c.expires_at).toLocaleString()}</div>}
                          {!(c.min_order_amount > 0 || c.max_discount_amount > 0 || c.per_customer_limit != null || c.starts_at || c.expires_at) && '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.used_count}{c.usage_limit != null ? ` / ${c.usage_limit}` : ''}
                          {c.total_discounted > 0 && <div className="text-xs text-muted-foreground">${Number(c.total_discounted).toFixed(2)} saved</div>}
                        </TableCell>
                        <TableCell><Badge className={st.cls}>{st.label}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title={c.is_active ? 'Disable' : 'Enable'} onClick={() => toggle(c)}><Power className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="Delete" className="text-destructive" onClick={() => remove(c)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
