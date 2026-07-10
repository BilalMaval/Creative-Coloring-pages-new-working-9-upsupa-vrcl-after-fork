'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Save, X, ChevronDown, ChevronUp,
  BookOpen, Search, Globe, FileText, Clock, Tag, AlignLeft, HelpCircle,
  Link2, Smile, RefreshCw, CheckCircle, AlertCircle, Loader2, Upload, Code2, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ── Helpers ─────────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const EMPTY_POST = {
  title: '', slug: '', metaTitle: '', description: '',
  coverEmoji: '📝', coverImage: '',
  htmlContent: '',
  tags: '', readTime: '5 min read',
  relatedCategoryName: '', relatedCategorySlug: '',
  isPublished: true, publishedAt: new Date().toISOString().split('T')[0],
  sections: [], faqs: [],
};

const EMPTY_SECTION = { heading: '', content: '', items: [] };
const EMPTY_FAQ     = { q: '', a: '' };

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const colors = type === 'success'
    ? 'bg-green-600 text-white'
    : 'bg-red-600 text-white';
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl ${colors} text-sm font-bold max-w-sm`}>
      {type === 'success' ? <CheckCircle className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
      {msg}
      <button onClick={onClose}><X className="h-4 w-4" /></button>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
        <div className="text-4xl mb-4 text-center">⚠️</div>
        <p className="text-center font-bold text-gray-800 mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

// ── Section Editor ────────────────────────────────────────────────────────────

function SectionEditor({ section, onChange, onRemove, index }) {
  const [itemInput, setItemInput] = useState('');
  const [showItems, setShowItems] = useState(true);

  const addItem = () => {
    if (!itemInput.trim()) return;
    onChange({ ...section, items: [...(section.items || []), itemInput.trim()] });
    setItemInput('');
  };

  const removeItem = (i) => {
    onChange({ ...section, items: section.items.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="border-2 border-gray-200 rounded-2xl p-5 bg-gray-50 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-700 text-sm">Section {index + 1}</span>
        <button onClick={onRemove} className="text-red-500 hover:text-red-700 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-600 mb-1 block">Heading *</label>
        <input
          value={section.heading}
          onChange={e => onChange({ ...section, heading: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Section heading..."
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-600 mb-1 block">Prose Content (optional — leave blank if using bullet items)</label>
        <textarea
          value={section.content || ''}
          onChange={e => onChange({ ...section, content: e.target.value })}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          placeholder="Write paragraphs here... Use **bold** for emphasis. Separate paragraphs with a blank line."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-gray-600">Bullet Items (optional)</label>
          <button onClick={() => setShowItems(!showItems)} className="text-gray-400 hover:text-gray-600">
            {showItems ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showItems && (
          <>
            {(section.items || []).map((item, i) => (
              <div key={i} className="flex items-start gap-2 mb-2">
                <span className="mt-2 text-purple-400 text-xs">•</span>
                <span className="flex-1 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2" dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                <button onClick={() => removeItem(i)} className="mt-2 text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input
                value={itemInput}
                onChange={e => setItemInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Add bullet item (Enter to add)..."
              />
              <Button size="sm" variant="outline" onClick={addItem} className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Use **text** for bold. Press Enter or click + to add.</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── FAQ Editor ────────────────────────────────────────────────────────────────

function FAQEditor({ faq, onChange, onRemove, index }) {
  return (
    <div className="border-2 border-gray-200 rounded-2xl p-5 bg-gray-50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-700 text-sm">FAQ {index + 1}</span>
        <button onClick={onRemove} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
      </div>
      <div>
        <label className="text-xs font-bold text-gray-600 mb-1 block">Question *</label>
        <input
          value={faq.q}
          onChange={e => onChange({ ...faq, q: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Question text..."
        />
      </div>
      <div>
        <label className="text-xs font-bold text-gray-600 mb-1 block">Answer *</label>
        <textarea
          value={faq.a}
          onChange={e => onChange({ ...faq, a: e.target.value })}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          placeholder="Answer text..."
        />
      </div>
    </div>
  );
}

// ── Post Form ─────────────────────────────────────────────────────────────────

function PostForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_POST);
  const [autoSlug, setAutoSlug] = useState(!initial?.id);
  const [tab, setTab]   = useState('basic'); // basic | content | seo
  const [contentMode, setContentMode] = useState(initial?.htmlContent ? 'html' : 'builder');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleTitleChange = (v) => {
    set('title', v);
    if (autoSlug) set('slug', slugify(v));
    if (!form.metaTitle || form.metaTitle === form.title) set('metaTitle', v);
  };

  const updateSection = (i, val) => {
    const arr = [...form.sections];
    arr[i] = val;
    set('sections', arr);
  };
  const removeSection = (i) => set('sections', form.sections.filter((_, idx) => idx !== i));
  const addSection    = ()  => set('sections', [...form.sections, { ...EMPTY_SECTION, items: [] }]);

  const updateFaq = (i, val) => {
    const arr = [...form.faqs];
    arr[i] = val;
    set('faqs', arr);
  };
  const removeFaq = (i) => set('faqs', form.faqs.filter((_, idx) => idx !== i));
  const addFaq    = ()  => set('faqs', [...form.faqs, { ...EMPTY_FAQ }]);

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'image');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) set('coverImage', data.url);
      else alert('Image upload failed: ' + data.error);
    } catch { alert('Image upload failed'); }
    finally { setUploadingCover(false); }
  };

  const TABS = [
    { id: 'basic',   label: 'Basic Info',  icon: FileText },
    { id: 'content', label: 'Content',     icon: AlignLeft },
    { id: 'seo',     label: 'SEO & Meta',  icon: Globe },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-2 border-b border-gray-200 pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-bold transition-colors ${
              tab === id
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* BASIC INFO */}
      {tab === 'basic' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Cover emoji + picker */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1 block">
                <Smile className="h-4 w-4 text-purple-500" /> Cover Emoji
              </label>
              <div className="flex gap-2">
                <input
                  value={form.coverEmoji}
                  onChange={e => set('coverEmoji', e.target.value)}
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => setEmojiPickerOpen(o => !o)}
                  className="border-2 border-gray-200 rounded-xl px-3 text-sm text-gray-500 hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  {emojiPickerOpen ? '▲' : '▼'}
                </button>
              </div>
              {emojiPickerOpen && (
                <div className="mt-2 p-2 border-2 border-gray-200 rounded-xl bg-white shadow-lg flex flex-wrap gap-1">
                  {['📝','🎨','🖍️','✏️','🖌️','📚','🌟','🎉','🦁','🐶','🐱','🦋','🌸','🌈','🎭','🏆','💡','🔥','❤️','🎯','🧩','🎪','🌺','🦄','🐼','🦊','🐸','🌙','⭐','🍀','🎸','🎵','🚀','🌍','🎃','🎄','🎁','🍭','🌻','🦅'].map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => { set('coverEmoji', e); setEmojiPickerOpen(false); }}
                      className={`text-lg p-1 rounded-lg hover:bg-purple-100 transition-colors ${form.coverEmoji === e ? 'bg-purple-200 ring-2 ring-purple-400' : ''}`}
                    >{e}</button>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">Used if no image uploaded</p>
            </div>
            {/* Cover image upload */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1 block">
                <Upload className="h-4 w-4 text-purple-500" /> Cover Image
              </label>
              <label className="flex flex-col items-center justify-center w-full h-[58px] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors relative overflow-hidden">
                {form.coverImage ? (
                  <>
                    <img src={form.coverImage} alt="cover" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                      <span className="text-white text-xs font-bold">Change</span>
                    </div>
                  </>
                ) : uploadingCover ? (
                  <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                ) : (
                  <span className="text-xs text-gray-400 font-medium">Upload image</span>
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={handleCoverImageUpload} disabled={uploadingCover} />
              </label>
              {form.coverImage && (
                <button onClick={() => set('coverImage', '')} className="text-xs text-red-500 hover:text-red-700 mt-1">✕ Remove image</button>
              )}
            </div>
            {/* Read time */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1 block">
                <Clock className="h-4 w-4 text-purple-500" /> Read Time
              </label>
              <input
                value={form.readTime}
                onChange={e => set('readTime', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="5 min read"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1 block">
              <FileText className="h-4 w-4 text-purple-500" /> Title *
            </label>
            <input
              value={form.title}
              onChange={e => handleTitleChange(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold"
              placeholder="Article title..."
            />
          </div>

          {/* Slug */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1 block">
              <Link2 className="h-4 w-4 text-purple-500" /> URL Slug *
            </label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 bg-gray-100 border-2 border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500">/blog/</span>
              <input
                value={form.slug}
                onChange={e => { setAutoSlug(false); set('slug', slugify(e.target.value)); }}
                className="flex-1 border-2 border-gray-200 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="article-url-slug"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1 block">
              <AlignLeft className="h-4 w-4 text-purple-500" /> Short Description / Meta Description
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              placeholder="1-2 sentence description used as intro paragraph and SEO meta description..."
            />
            <p className={`text-xs mt-1 ${form.description.length > 160 ? 'text-orange-500' : 'text-gray-400'}`}>
              {form.description.length}/160 chars (ideal for SEO)
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1 block">
              <Tag className="h-4 w-4 text-purple-500" /> Tags (comma-separated)
            </label>
            <input
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="coloring pages, kids, animals"
            />
          </div>

          {/* Related category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Related Category Name</label>
              <input
                value={form.relatedCategoryName}
                onChange={e => set('relatedCategoryName', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Ocean Animals"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Related Category Slug</label>
              <div className="flex items-center gap-1">
                <span className="text-gray-400 text-sm">/category/</span>
                <input
                  value={form.relatedCategorySlug}
                  onChange={e => set('relatedCategorySlug', slugify(e.target.value))}
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="ocean-animals"
                />
              </div>
            </div>
          </div>

          {/* Publish settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-gray-200">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Published Date</label>
              <input
                type="date"
                value={form.publishedAt}
                onChange={e => set('publishedAt', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer group w-full p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-400 transition-colors">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={e => set('isPublished', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${form.isPublished ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${form.isPublished ? 'translate-x-5.5 ml-0.5' : 'ml-0.5'}`} style={{ transform: form.isPublished ? 'translateX(20px)' : 'translateX(0)' }} />
                  </div>
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">{form.isPublished ? 'Published' : 'Draft'}</div>
                  <div className="text-xs text-gray-500">{form.isPublished ? 'Visible on /blog' : 'Hidden from public'}</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      {tab === 'content' && (
        <div className="space-y-6">
          {/* Mode toggle */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
            <button
              onClick={() => setContentMode('builder')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                contentMode === 'builder' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layers className="h-4 w-4" /> Section Builder
            </button>
            <button
              onClick={() => setContentMode('html')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                contentMode === 'html' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Code2 className="h-4 w-4" /> Full Page
            </button>
          </div>

          {/* HTML mode */}
          {contentMode === 'html' && (
            <div className="space-y-3">
              {/* File upload */}
              <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors w-fit">
                <Upload className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-600">Upload file</span>
                <input
                  type="file"
                  accept=".html,.htm"
                  className="sr-only"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => set('htmlContent', ev.target.result);
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
              </label>
              <textarea
                value={form.htmlContent}
                onChange={e => set('htmlContent', e.target.value)}
                rows={20}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 resize-y"
                placeholder="<h2>Your heading</h2><p>Your article content...</p>"
              />
              {form.htmlContent && (
                <button onClick={() => set('htmlContent', '')} className="text-xs text-red-500 hover:text-red-700">
                  ✕ Clear HTML content (switch back to section builder)
                </button>
              )}
            </div>
          )}

          {/* Builder mode */}
          {contentMode === 'builder' && (
            <>
              {/* Sections */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-gray-800 flex items-center gap-2">
                    <AlignLeft className="h-5 w-5 text-purple-500" />
                    Article Sections
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {form.sections.length}
                    </span>
                  </h3>
                  <Button onClick={addSection} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="h-4 w-4 mr-1" /> Add Section
                  </Button>
                </div>

                {form.sections.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                    <AlignLeft className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No sections yet.</p>
                    <p className="text-xs">Click "Add Section" to build your article content.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.sections.map((s, i) => (
                      <SectionEditor
                        key={i} index={i} section={s}
                        onChange={val => updateSection(i, val)}
                        onRemove={() => removeSection(i)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* FAQs */}
              <div className="border-t-2 border-gray-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-gray-800 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-purple-500" />
                    FAQs
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {form.faqs.length}
                    </span>
                  </h3>
                  <Button onClick={addFaq} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="h-4 w-4 mr-1" /> Add FAQ
                  </Button>
                </div>

                {form.faqs.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                    <HelpCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No FAQs yet.</p>
                    <p className="text-xs">FAQs appear in a structured FAQ section and generate Schema.org markup.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.faqs.map((faq, i) => (
                      <FAQEditor
                        key={i} index={i} faq={faq}
                        onChange={val => updateFaq(i, val)}
                        onRemove={() => removeFaq(i)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* SEO */}
      {tab === 'seo' && (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1 block">
              <Globe className="h-4 w-4 text-purple-500" /> SEO Title (browser tab & Google)
            </label>
            <input
              value={form.metaTitle}
              onChange={e => set('metaTitle', e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="SEO optimised title — can differ from the article title"
            />
            <p className={`text-xs mt-1 ${form.metaTitle.length > 60 ? 'text-orange-500 font-bold' : 'text-gray-400'}`}>
              {form.metaTitle.length}/60 chars (ideal)
            </p>
          </div>

          {/* Google Preview */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Google Search Preview</p>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">https://www.creativecoloringpages.com/blog/{form.slug || 'your-post-slug'}</p>
              <p className="text-blue-700 font-medium text-base leading-tight line-clamp-1">
                {form.metaTitle || form.title || 'Your article title will appear here'}
              </p>
              <p className="text-gray-600 text-sm line-clamp-2">
                {form.description || 'Your description will appear here as the search snippet. Keep it under 160 characters for best results.'}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-bold mb-1">SEO Tips</p>
            <ul className="space-y-1 text-xs">
              <li>• Keep SEO title under 60 characters to avoid truncation in Google</li>
              <li>• Meta description 140–160 chars — be descriptive and include the main keyword</li>
              <li>• Slug should match the main keyword phrase (already auto-generated)</li>
              <li>• Add FAQs — they can appear as rich results in Google search</li>
            </ul>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-100 sticky bottom-0 bg-white pb-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4 mr-2" /> Cancel
        </Button>
        <Button
          onClick={() => onSave(form)}
          disabled={saving || !form.title.trim() || !form.slug.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8"
        >
          {saving
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
            : <><Save className="h-4 w-4 mr-2" /> Save Post</>
          }
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminBlogPage() {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all'); // all | published | draft

  const [mode,        setMode]        = useState('list');   // list | create | edit
  const [editPost,    setEditPost]     = useState(null);
  const [saving,      setSaving]       = useState(false);
  const [confirmDel,  setConfirmDel]   = useState(null);    // post id to delete
  const [toast,       setToast]        = useState(null);

  const notify = (msg, type = 'success') => setToast({ msg, type });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/blog?admin=1');
      const data = await res.json();
      if (data.success) setPosts(data.data);
      else notify('Failed to load posts', 'error');
    } catch {
      notify('Network error', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const payload = {
        title:                form.title,
        slug:                 form.slug,
        metaTitle:            form.metaTitle,
        description:          form.description,
        coverEmoji:           form.coverEmoji,
        coverImage:           form.coverImage || null,
        htmlContent:          form.htmlContent || null,
        tags:                 typeof form.tags === 'string'
          ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
          : form.tags,
        readTime:             form.readTime,
        sections:             form.sections,
        faqs:                 form.faqs,
        relatedCategoryName:  form.relatedCategoryName || null,
        relatedCategorySlug:  form.relatedCategorySlug || null,
        isPublished:          form.isPublished,
        publishedAt:          form.publishedAt,
      };

      let res;
      if (editPost?.id) {
        res = await fetch(`/api/blog/${editPost.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');

      notify(editPost?.id ? 'Post updated!' : 'Post created!');
      setMode('list');
      setEditPost(null);
      fetchPosts();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmDel(null);
    try {
      const res  = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      notify('Post deleted');
      fetchPosts();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const handleTogglePublish = async (post) => {
    try {
      const res  = await fetch(`/api/blog/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !post.is_published }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      notify(post.is_published ? 'Post set to Draft' : 'Post Published!');
      fetchPosts();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  // Filtered list
  const filtered = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all'
      ? true
      : filter === 'published' ? p.is_published : !p.is_published;
    return matchSearch && matchFilter;
  });

  const publishedCount = posts.filter(p => p.is_published).length;
  const draftCount     = posts.filter(p => !p.is_published).length;

  return (
    <AdminLayout>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {confirmDel && (
        <ConfirmDialog
          message="Delete this post? This cannot be undone."
          onConfirm={() => handleDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}

      {/* ── LIST VIEW ── */}
      {mode === 'list' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-purple-600" />
                Blog Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {publishedCount} published · {draftCount} draft{draftCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchPosts} size="sm">
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
              <Button
                onClick={() => { setEditPost(null); setMode('create'); }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> New Post
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Posts',   val: posts.length,        color: 'bg-purple-50 border-purple-200 text-purple-700' },
              { label: 'Published',     val: publishedCount,      color: 'bg-green-50  border-green-200  text-green-700'  },
              { label: 'Drafts',        val: draftCount,          color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
            ].map(s => (
              <div key={s.label} className={`${s.color} border-2 rounded-2xl p-4 text-center`}>
                <div className={`text-3xl font-black ${s.color.split(' ')[2]}`}>{s.val}</div>
                <div className="text-xs font-bold mt-1 opacity-75">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search & filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search posts..."
                className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'published', 'draft'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-colors ${
                    filter === f
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Posts table */}
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-purple-500 mx-auto mb-3" />
              <p className="text-gray-500">Loading posts…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl">
              <BookOpen className="h-14 w-14 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-bold mb-1">
                {search ? 'No posts match your search' : 'No posts yet'}
              </p>
              {!search && (
                <Button
                  onClick={() => { setEditPost(null); setMode('create'); }}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" /> Create First Post
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(post => (
                <Card key={post.id} className="hover:shadow-md transition-shadow border-2 border-gray-100 hover:border-purple-200">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Cover image or emoji */}
                      <div className="flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        {post.cover_image
                          ? <img src={post.cover_image} alt="" className="w-full h-full object-cover" />
                          : <span className="text-4xl">{post.cover_emoji || '📝'}</span>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <h3 className="font-black text-gray-800 text-base leading-tight line-clamp-2">
                              {post.title}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">/blog/{post.slug}</p>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${
                            post.is_published
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {post.is_published ? '● Published' : '○ Draft'}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{post.description}</p>

                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.read_time}</span>
                          <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{(post.sections || []).length} sections · {(post.faqs || []).length} FAQs</span>
                          <span>{formatDate(post.published_at)}</span>
                          {post.tags?.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {(post.tags || []).slice(0, 3).map(tag => (
                                <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">#{tag}</span>
                              ))}
                              {post.tags.length > 3 && <span className="text-gray-400">+{post.tags.length - 3}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => { setEditPost(post); setMode('edit'); }}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTogglePublish(post)}
                          className={post.is_published ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}
                        >
                          {post.is_published
                            ? <><EyeOff className="h-3.5 w-3.5 mr-1" /> Unpublish</>
                            : <><Eye     className="h-3.5 w-3.5 mr-1" /> Publish</>
                          }
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-3.5 w-3.5 mr-1" /> View
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:bg-red-50 hover:border-red-300"
                          onClick={() => setConfirmDel(post.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CREATE / EDIT VIEW ── */}
      {(mode === 'create' || mode === 'edit') && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setMode('list'); setEditPost(null); }}
              className="text-gray-500 hover:text-gray-800 transition-colors p-2 hover:bg-gray-100 rounded-xl"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-800">
                {mode === 'create' ? 'New Blog Post' : `Edit: ${editPost?.title}`}
              </h1>
              <p className="text-sm text-gray-500">
                {mode === 'create'
                  ? 'Fill in the details below. All fields except Title and Slug are optional.'
                  : 'Update the post content and click Save.'}
              </p>
            </div>
          </div>

          <Card className="border-2 border-gray-100">
            <CardContent className="p-6">
              <PostForm
                initial={editPost ? {
                  id:                   editPost.id,
                  title:                editPost.title || '',
                  slug:                 editPost.slug  || '',
                  metaTitle:            editPost.meta_title || editPost.title || '',
                  description:          editPost.description || '',
                  coverEmoji:           editPost.cover_emoji || '📝',
                  coverImage:           editPost.cover_image || '',
                  htmlContent:          editPost.html_content || '',
                  tags:                 Array.isArray(editPost.tags) ? editPost.tags.join(', ') : (editPost.tags || ''),
                  readTime:             editPost.read_time || '5 min read',
                  sections:             editPost.sections || [],
                  faqs:                 editPost.faqs    || [],
                  relatedCategoryName:  editPost.related_category_name || '',
                  relatedCategorySlug:  editPost.related_category_slug || '',
                  isPublished:          editPost.is_published !== false,
                  publishedAt:          editPost.published_at || new Date().toISOString().split('T')[0],
                } : null}
                onSave={handleSave}
                onCancel={() => { setMode('list'); setEditPost(null); }}
                saving={saving}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
