import { NextResponse } from 'next/server';
import { admin } from '@/lib/supabaseClients';
import { requireAdmin } from '@/lib/adminAuth';

import { revalidateBlog } from '@/lib/revalidate';
// GET /api/blog/[id]
export async function GET(request, { params }) {
  const { id } = await params;
  const { data, error } = await admin.from('blog_posts').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 404 });
  return NextResponse.json({ success: true, data });
}

// PUT /api/blog/[id]
export async function PUT(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  try {
    const body = await request.json();
    const { data, error } = await admin
      .from('blog_posts')
      .update(buildRow(body))
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    revalidateBlog(data.slug);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// DELETE /api/blog/[id]
export async function DELETE(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const { data: before } = await admin.from('blog_posts').select('slug').eq('id', id).single();
  const { error } = await admin.from('blog_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  revalidateBlog(before?.slug);
  return NextResponse.json({ success: true });
}

function buildRow(b) {
  const row = {};
  if (b.title               !== undefined) row.title                 = b.title?.trim();
  if (b.slug                !== undefined) row.slug                  = b.slug?.trim().toLowerCase().replace(/\s+/g, '-');
  if (b.metaTitle           !== undefined) row.meta_title            = b.metaTitle?.trim();
  if (b.description         !== undefined) row.description           = b.description?.trim();
  if (b.coverEmoji          !== undefined) row.cover_emoji           = b.coverEmoji;
  if (b.coverImage          !== undefined) row.cover_image           = b.coverImage || null;
  if (b.htmlContent         !== undefined) row.html_content          = b.htmlContent || null;
  if (b.tags                !== undefined) row.tags = Array.isArray(b.tags) ? b.tags : b.tags.split(',').map(t => t.trim()).filter(Boolean);
  if (b.readTime            !== undefined) row.read_time             = b.readTime;
  if (b.sections            !== undefined) row.sections              = b.sections;
  if (b.faqs                !== undefined) row.faqs                  = b.faqs;
  if (b.relatedCategoryName !== undefined) row.related_category_name = b.relatedCategoryName || null;
  if (b.relatedCategorySlug !== undefined) row.related_category_slug = b.relatedCategorySlug || null;
  if (b.isPublished         !== undefined) row.is_published          = b.isPublished;
  if (b.publishedAt         !== undefined) row.published_at          = b.publishedAt;
  return row;
}
