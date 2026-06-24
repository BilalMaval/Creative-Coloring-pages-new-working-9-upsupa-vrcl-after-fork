/**
 * POST /api/blog/setup
 * Creates the blog_posts table (if missing) and seeds all 5 static articles.
 * Uses the Supabase service role key so it can run DDL.
 * Called once from the Admin Blog page "Setup Database" button.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { blogPosts } from '@/lib/blog';

export async function POST() {
  // Need service role key for DDL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey) {
    return NextResponse.json({
      success: false,
      error: 'SUPABASE_SERVICE_ROLE_KEY is not set in environment variables. Add it to your .env.local file.',
    }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // ── 1. Create table ───────────────────────────────────────────────────────
  const createSQL = `
    CREATE TABLE IF NOT EXISTS blog_posts (
      id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title                 text NOT NULL,
      slug                  text NOT NULL UNIQUE,
      meta_title            text,
      description           text,
      cover_emoji           text DEFAULT '📝',
      tags                  jsonb DEFAULT '[]',
      read_time             text DEFAULT '5 min read',
      sections              jsonb DEFAULT '[]',
      faqs                  jsonb DEFAULT '[]',
      related_category_name text,
      related_category_slug text,
      is_published          boolean NOT NULL DEFAULT true,
      published_at          date NOT NULL DEFAULT CURRENT_DATE,
      updated_at            timestamptz NOT NULL DEFAULT now(),
      created_at            timestamptz NOT NULL DEFAULT now()
    );

    CREATE OR REPLACE FUNCTION set_blog_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN NEW.updated_at = now(); RETURN NEW; END;
    $$;

    DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
    CREATE TRIGGER blog_posts_updated_at
      BEFORE UPDATE ON blog_posts
      FOR EACH ROW EXECUTE FUNCTION set_blog_updated_at();

    ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'public read published'
      ) THEN
        CREATE POLICY "public read published" ON blog_posts FOR SELECT USING (is_published = true);
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'anon full access'
      ) THEN
        CREATE POLICY "anon full access" ON blog_posts FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `;

  const { error: ddlError } = await supabase.rpc('exec_sql', { sql: createSQL }).catch(() => ({ error: null }));
  // rpc('exec_sql') may not exist — try direct approach via REST instead
  // We'll use the pg REST endpoint with service role

  // ── 2. Try inserting posts (table may already exist from the SQL file) ────
  const rows = blogPosts.map(p => ({
    title:                 p.title,
    slug:                  p.slug,
    meta_title:            p.metaTitle || p.title,
    description:           p.description || '',
    cover_emoji:           p.coverEmoji || '📝',
    tags:                  p.tags || [],
    read_time:             p.readTime || '5 min read',
    sections:              p.sections || [],
    faqs:                  p.faqs || [],
    related_category_name: p.relatedCategory?.name || null,
    related_category_slug: p.relatedCategory?.slug || null,
    is_published:          true,
    published_at:          p.publishedAt,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('blog_posts')
    .upsert(rows, { onConflict: 'slug', ignoreDuplicates: false })
    .select('slug');

  if (insertError) {
    // Table still doesn't exist — try creating it via Supabase Management REST API
    const mgmtResult = await createTableViaManagementAPI(url, serviceKey, createSQL);

    if (!mgmtResult.success) {
      return NextResponse.json({
        success: false,
        error: `Could not create table: ${mgmtResult.error}. Please run supabase-blog-migration.sql manually in your Supabase dashboard → SQL Editor.`,
        manualSQL: true,
      }, { status: 500 });
    }

    // Retry insert after table creation
    const { data: retried, error: retryError } = await supabase
      .from('blog_posts')
      .upsert(rows, { onConflict: 'slug', ignoreDuplicates: false })
      .select('slug');

    if (retryError) {
      return NextResponse.json({
        success: false,
        error: `Table created but seeding failed: ${retryError.message}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Table created and ${retried?.length || 0} articles seeded successfully!`,
      seeded: retried?.map(r => r.slug),
    });
  }

  return NextResponse.json({
    success: true,
    message: `${inserted?.length || 0} articles synced to database!`,
    seeded: inserted?.map(r => r.slug),
  });
}

async function createTableViaManagementAPI(supabaseUrl, serviceKey, sql) {
  try {
    // Extract project ref from URL: https://<ref>.supabase.co
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!match) return { success: false, error: 'Cannot determine project ref from URL' };
    const projectRef = match[1];

    const res = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: text };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
