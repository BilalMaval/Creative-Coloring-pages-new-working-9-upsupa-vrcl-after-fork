// Team members (server-only). Table: team_members (see supabase-team-migration.sql).
import prisma from '@/lib/prisma';

export const GRADIENTS = {
  purple: 'from-purple-400 to-pink-400',
  blue: 'from-blue-400 to-cyan-400',
  green: 'from-green-400 to-teal-400',
  orange: 'from-orange-400 to-yellow-400',
  pink: 'from-pink-400 to-rose-400',
  indigo: 'from-indigo-400 to-purple-400',
};

export const TEAM_COLUMNS = 'id, name, role, bio, badge, avatar, photo_url, gradient, sort_order, is_visible, created_at';

export function isMissingTeamTable(err) {
  return /relation "?(public\.)?team_members/i.test(`${err?.message || ''} ${err?.meta?.message || ''}`);
}

// Visible members for the public About page. Returns null when the table does not exist yet
// (the page then keeps its built-in list); an empty array means the admin removed everyone.
export async function getVisibleTeam() {
  try {
    return await prisma.$queryRawUnsafe(
      `SELECT ${TEAM_COLUMNS} FROM team_members WHERE is_visible = true ORDER BY sort_order, created_at`
    );
  } catch (err) {
    if (!isMissingTeamTable(err)) console.error('Team load error:', err);
    return null;
  }
}

const str = (v, max) => (v == null ? '' : String(v)).trim().slice(0, max);

// Validates the admin form. Throws Error(message) on bad input.
export function parseTeamInput(b) {
  const name = str(b.name, 80);
  const role = str(b.role, 100);
  if (!name) throw new Error('Name is required');
  if (!role) throw new Error('Role / title is required');
  const photo = str(b.photoUrl, 500);
  if (photo && !/^https?:\/\//i.test(photo)) throw new Error('Photo must be an image URL');
  return {
    name,
    role,
    bio: str(b.bio, 500) || null,
    badge: str(b.badge, 40) || null,
    avatar: str(b.avatar, 8) || '🙂',
    photoUrl: photo || null,
    gradient: GRADIENTS[b.gradient] ? b.gradient : 'purple',
    isVisible: b.isVisible !== false,
  };
}
