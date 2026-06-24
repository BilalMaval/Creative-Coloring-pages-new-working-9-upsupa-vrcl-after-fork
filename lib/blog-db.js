/**
 * Blog DB — single source of truth is Supabase blog_posts table.
 * Service role key is used server-side for all writes (create/update/delete).
 * Anon key is used for public reads.
 */
import { createClient } from '@supabase/supabase-js';

// Public read client (anon key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

// Admin write client (service role key — server only, never sent to browser)
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

// ── shape ──────────────────────────────────────────────────────────────────

export function mapPost(row) {
  if (!row) return null;
  return {
    id:              row.id,
    title:           row.title,
    slug:            row.slug,
    metaTitle:       row.meta_title  || row.title,
    description:     row.description || '',
    coverEmoji:      row.cover_emoji || '📝',
    tags:            Array.isArray(row.tags) ? row.tags : [],
    readTime:        row.read_time   || '5 min read',
    sections:        Array.isArray(row.sections) ? row.sections : [],
    faqs:            Array.isArray(row.faqs)     ? row.faqs     : [],
    relatedCategory: row.related_category_slug
      ? { name: row.related_category_name, slug: row.related_category_slug }
      : null,
    isPublished:  row.is_published,
    publishedAt:  row.published_at,
    updatedAt:    row.updated_at ? row.updated_at.split('T')[0] : row.published_at,
    createdAt:    row.created_at,
  };
}

// ── public reads ────────────────────────────────────────────────────────────

export async function getAllPublishedPosts() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error) { console.error('[blog-db] getAllPublishedPosts:', error.message); return []; }
  return (data || []).map(mapPost);
}

export async function getPostBySlug(slug) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) return null;
  return mapPost(data);
}

// ── admin reads (all posts incl. drafts) ────────────────────────────────────

export async function getAllPostsAdmin() {
  const { data, error } = await adminClient()
    .from('blog_posts')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) { console.error('[blog-db] getAllPostsAdmin:', error.message); return []; }
  return (data || []).map(mapPost);
}

// ── writes (service role) ───────────────────────────────────────────────────

export async function createPost(payload) {
  const { data, error } = await adminClient()
    .from('blog_posts')
    .insert([toRow(payload)])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapPost(data);
}

export async function updatePost(id, payload) {
  const { data, error } = await adminClient()
    .from('blog_posts')
    .update(toRow(payload))
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapPost(data);
}

export async function deletePost(id) {
  const { error } = await adminClient().from('blog_posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// ── util ────────────────────────────────────────────────────────────────────

function toRow(p) {
  const row = {};
  if (p.title               !== undefined) row.title                 = p.title;
  if (p.slug                !== undefined) row.slug                  = p.slug;
  if (p.metaTitle           !== undefined) row.meta_title            = p.metaTitle;
  if (p.description         !== undefined) row.description           = p.description;
  if (p.coverEmoji          !== undefined) row.cover_emoji           = p.coverEmoji;
  if (p.tags                !== undefined) row.tags = Array.isArray(p.tags)
    ? p.tags : String(p.tags).split(',').map(t => t.trim()).filter(Boolean);
  if (p.readTime            !== undefined) row.read_time             = p.readTime;
  if (p.sections            !== undefined) row.sections              = p.sections;
  if (p.faqs                !== undefined) row.faqs                  = p.faqs;
  if (p.relatedCategoryName !== undefined) row.related_category_name = p.relatedCategoryName || null;
  if (p.relatedCategorySlug !== undefined) row.related_category_slug = p.relatedCategorySlug || null;
  if (p.isPublished         !== undefined) row.is_published          = p.isPublished;
  if (p.publishedAt         !== undefined) row.published_at          = p.publishedAt;
  return row;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}
