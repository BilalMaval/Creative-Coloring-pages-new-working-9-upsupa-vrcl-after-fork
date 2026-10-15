'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Upload, X } from 'lucide-react';

const GRADIENTS = {
  purple: 'from-purple-400 to-pink-400',
  blue: 'from-blue-400 to-cyan-400',
  green: 'from-green-400 to-teal-400',
  orange: 'from-orange-400 to-yellow-400',
  pink: 'from-pink-400 to-rose-400',
  indigo: 'from-indigo-400 to-purple-400',
};

const EMPTY = { name: '', role: '', bio: '', badge: '', avatar: '🙂', photoUrl: '', gradient: 'purple', isVisible: true };

function Avatar({ m, size = 'w-14 h-14', text = 'text-2xl' }) {
  if (m.photo_url || m.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={m.photo_url || m.photoUrl} alt="" className={`${size} rounded-full object-cover shadow`} />;
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-br ${GRADIENTS[m.gradient] || GRADIENTS.purple} flex items-center justify-center ${text} shadow`}>
      {m.avatar || '🙂'}
    </div>
  );
}

export default function AdminTeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setupError, setSetupError] = useState('');
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/team');
      const data = await res.json();
      if (data.success) { setMembers(data.data); setSetupError(''); }
      else if (data.setupRequired) setSetupError(data.error);
      else setError(data.error || 'Failed to load team');
    } catch {
      setError('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditingId(null); setForm({ ...EMPTY }); setError(''); };
  const openEdit = (m) => {
    setEditingId(m.id);
    setForm({
      name: m.name, role: m.role, bio: m.bio || '', badge: m.badge || '', avatar: m.avatar || '🙂',
      photoUrl: m.photo_url || '', gradient: m.gradient || 'purple', isVisible: m.is_visible,
    });
    setError('');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(editingId ? `/api/admin/team/${editingId}` : '/api/admin/team', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Failed to save'); return; }
      setForm(null);
      await load();
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be 5MB or smaller'); return; }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'image');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) setForm((f) => ({ ...f, photoUrl: data.url }));
      else setError(data.error || 'Photo upload failed');
    } catch {
      setError('Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const toggle = async (m) => {
    const res = await fetch(`/api/admin/team/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggleOnly: true, isVisible: !m.is_visible }),
    });
    const data = await res.json();
    if (!data.success) alert(data.error || 'Failed to update');
    load();
  };

  const remove = async (m) => {
    if (!confirm(`Remove ${m.name} from the team? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/team/${m.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) alert(data.error || 'Failed to remove');
    load();
  };

  const move = async (index, dir) => {
    const next = [...members];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setMembers(next);
    const res = await fetch('/api/admin/team', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: next.map((m) => m.id) }),
    });
    const data = await res.json();
    if (!data.success) { alert(data.error || 'Failed to reorder'); load(); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="h-7 w-7" /> Team</h1>
        {!setupError && <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Add Team Member</Button>}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        These profiles appear in the "Meet the Team" section of the About page. Changes show up within a minute. If you hide or remove everyone, the whole section disappears.
      </p>

      {setupError && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardContent className="py-4 text-sm text-yellow-900"><strong>One-time setup needed.</strong> {setupError}</CardContent>
        </Card>
      )}

      {form && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editingId ? 'Edit Team Member' : 'Add Team Member'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={set('name')} required maxLength={80} placeholder="e.g. Sarah M." />
                </div>
                <div>
                  <Label>Role / title *</Label>
                  <Input value={form.role} onChange={set('role')} required maxLength={100} placeholder="e.g. Creative Director" />
                </div>
              </div>

              <div>
                <Label>Short bio</Label>
                <textarea value={form.bio} onChange={set('bio')} maxLength={500} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="One or two sentences" />
                <p className="text-xs text-muted-foreground">{form.bio.length}/500</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Badge (small label)</Label>
                  <Input value={form.badge} onChange={set('badge')} maxLength={40} placeholder="e.g. 🖌️ Art & Design" />
                </div>
                <div>
                  <Label>Emoji avatar</Label>
                  <Input value={form.avatar} onChange={set('avatar')} maxLength={8} className="text-xl" />
                  <p className="text-xs text-muted-foreground">Used when there is no photo</p>
                </div>
                <div>
                  <Label>Avatar color</Label>
                  <select value={form.gradient} onChange={set('gradient')} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                    {Object.keys(GRADIENTS).map((g) => <option key={g} value={g}>{g[0].toUpperCase() + g.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <Label>Photo (optional, JPG/PNG/WebP up to 5MB)</Label>
                <div className="flex items-center gap-3 mt-1">
                  <Avatar m={form} size="w-16 h-16" text="text-3xl" />
                  <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-muted">
                    <Upload className="h-4 w-4" /> {uploading ? 'Uploading...' : form.photoUrl ? 'Replace photo' : 'Upload photo'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={(e) => uploadPhoto(e.target.files?.[0])} />
                  </label>
                  {form.photoUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, photoUrl: '' })}>
                      <X className="h-4 w-4 mr-1" /> Remove photo
                    </Button>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isVisible} onChange={(e) => setForm({ ...form, isVisible: e.target.checked })} />
                Show on the About page
              </label>

              {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded text-sm">{error}</div>}

              <div className="flex gap-2">
                <Button type="submit" disabled={saving || uploading}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add member'}</Button>
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
            ) : members.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No team members. Click "Add Team Member" to add one.</div>
            ) : (
              <ul className="divide-y">
                {members.map((m, i) => (
                  <li key={m.id} className="flex items-center gap-4 p-4">
                    <div className="flex flex-col">
                      <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30 hover:bg-muted rounded" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                      <button type="button" disabled={i === members.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30 hover:bg-muted rounded" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                    </div>
                    <Avatar m={m} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{m.name}</div>
                      <div className="text-sm text-purple-600 truncate">{m.role}</div>
                      {m.bio && <div className="text-xs text-muted-foreground line-clamp-1">{m.bio}</div>}
                    </div>
                    <Badge className={m.is_visible ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}>{m.is_visible ? 'Visible' : 'Hidden'}</Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title={m.is_visible ? 'Hide' : 'Show'} onClick={() => toggle(m)}>{m.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                      <Button variant="ghost" size="icon" title="Remove" className="text-destructive" onClick={() => remove(m)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
