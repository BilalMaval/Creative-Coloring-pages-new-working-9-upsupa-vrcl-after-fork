import { NextResponse } from 'next/server';
import { supabase, admin } from '@/lib/supabaseClients';

// GET /api/blog?admin=1  — all posts for admin panel
// GET /api/blog          — published only for public blog
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const isAdmin = searchParams.get('admin') === '1';

  const client = isAdmin ? admin : supabase;
  let query = client.from('blog_posts').select('*').order('published_at', { ascending: false });
  if (!isAdmin) query = query.eq('is_published', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data || [], source: 'database' });
}

// POST /api/blog  — create new post
export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.title?.trim()) return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    if (!body.slug?.trim())  return NextResponse.json({ success: false, error: 'Slug is required'  }, { status: 400 });

    const { data, error } = await admin
      .from('blog_posts')
      .insert([buildRow(body)])
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

function buildRow(b) {
  return {
    title:                 b.title?.trim(),
    slug:                  b.slug?.trim().toLowerCase().replace(/\s+/g, '-'),
    meta_title:            b.metaTitle?.trim() || b.title?.trim(),
    description:           b.description?.trim() || '',
    cover_emoji:           b.coverEmoji || '📝',
    tags:                  Array.isArray(b.tags) ? b.tags : (b.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    read_time:             b.readTime || '5 min read',
    sections:              Array.isArray(b.sections) ? b.sections : [],
    faqs:                  Array.isArray(b.faqs)     ? b.faqs     : [],
    related_category_name: b.relatedCategoryName || null,
    related_category_slug: b.relatedCategorySlug || null,
    is_published:          b.isPublished !== false,
    published_at:          b.publishedAt || new Date().toISOString().split('T')[0],
  };
}
