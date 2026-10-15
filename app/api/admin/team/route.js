import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { TEAM_COLUMNS, isMissingTeamTable, parseTeamInput } from '@/lib/team';

export const runtime = 'nodejs';

const NOT_SETUP = 'Team table is not set up yet. Run supabase-team-migration.sql in the Supabase SQL Editor first.';
const refreshAbout = () => { try { revalidatePath('/[brand]/about', 'page'); } catch {} };

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT ${TEAM_COLUMNS} FROM team_members ORDER BY sort_order, created_at`);
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    if (isMissingTeamTable(err)) return NextResponse.json({ success: false, setupRequired: true, error: NOT_SETUP }, { status: 503 });
    console.error('List team error:', err);
    return NextResponse.json({ success: false, error: 'Failed to load team' }, { status: 500 });
  }
}

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const t = parseTeamInput(await request.json());
    const rows = await prisma.$queryRawUnsafe(
      `INSERT INTO team_members (name, role, bio, badge, avatar, photo_url, gradient, is_visible, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE((SELECT max(sort_order) FROM team_members), 0) + 1)
       RETURNING ${TEAM_COLUMNS}`,
      t.name, t.role, t.bio, t.badge, t.avatar, t.photoUrl, t.gradient, t.isVisible
    );
    refreshAbout();
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (err) {
    if (isMissingTeamTable(err)) return NextResponse.json({ success: false, setupRequired: true, error: NOT_SETUP }, { status: 503 });
    if (!err?.code && !err?.meta) return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    console.error('Create team member error:', err);
    return NextResponse.json({ success: false, error: 'Failed to add team member' }, { status: 500 });
  }
}

// Reorder: body { ids: [id, id, ...] } in the new display order
export async function PUT(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 200) {
      return NextResponse.json({ success: false, error: 'Invalid order' }, { status: 400 });
    }
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!ids.every((i) => UUID.test(String(i)))) return NextResponse.json({ success: false, error: 'Invalid order' }, { status: 400 });
    for (let i = 0; i < ids.length; i++) {
      await prisma.$executeRawUnsafe('UPDATE team_members SET sort_order = $2, updated_at = now() WHERE id = $1::uuid', ids[i], i + 1);
    }
    refreshAbout();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reorder team error:', err);
    return NextResponse.json({ success: false, error: 'Failed to reorder' }, { status: 500 });
  }
}
