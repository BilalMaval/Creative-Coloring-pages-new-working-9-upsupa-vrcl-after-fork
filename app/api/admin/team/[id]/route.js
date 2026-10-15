import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { TEAM_COLUMNS, isMissingTeamTable, parseTeamInput } from '@/lib/team';

export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const refreshAbout = () => { try { revalidatePath('/[brand]/about', 'page'); } catch {} };

export async function PUT(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = params;
  if (!UUID.test(id)) return NextResponse.json({ success: false, error: 'Invalid team member' }, { status: 400 });
  try {
    const body = await request.json();

    if (body.toggleOnly) {
      const rows = await prisma.$queryRawUnsafe(
        `UPDATE team_members SET is_visible = $2, updated_at = now() WHERE id = $1::uuid RETURNING ${TEAM_COLUMNS}`,
        id, body.isVisible === true
      );
      if (!rows[0]) return NextResponse.json({ success: false, error: 'Team member not found' }, { status: 404 });
      refreshAbout();
      return NextResponse.json({ success: true, data: rows[0] });
    }

    const t = parseTeamInput(body);
    const rows = await prisma.$queryRawUnsafe(
      `UPDATE team_members SET name = $2, role = $3, bio = $4, badge = $5, avatar = $6, photo_url = $7,
         gradient = $8, is_visible = $9, updated_at = now()
       WHERE id = $1::uuid RETURNING ${TEAM_COLUMNS}`,
      id, t.name, t.role, t.bio, t.badge, t.avatar, t.photoUrl, t.gradient, t.isVisible
    );
    if (!rows[0]) return NextResponse.json({ success: false, error: 'Team member not found' }, { status: 404 });
    refreshAbout();
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (err) {
    if (isMissingTeamTable(err)) return NextResponse.json({ success: false, error: 'Team table is not set up yet' }, { status: 503 });
    if (!err?.code && !err?.meta) return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    console.error('Update team member error:', err);
    return NextResponse.json({ success: false, error: 'Failed to update team member' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = params;
  if (!UUID.test(id)) return NextResponse.json({ success: false, error: 'Invalid team member' }, { status: 400 });
  try {
    await prisma.$executeRawUnsafe('DELETE FROM team_members WHERE id = $1::uuid', id);
    refreshAbout();
    return NextResponse.json({ success: true });
  } catch (err) {
    if (isMissingTeamTable(err)) return NextResponse.json({ success: false, error: 'Team table is not set up yet' }, { status: 503 });
    console.error('Delete team member error:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete team member' }, { status: 500 });
  }
}
