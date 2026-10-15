-- ============================================================
-- RUN THIS ONCE in Supabase Dashboard -> SQL Editor
-- Adds ONE new table for the Team Management feature and copies in the 6 people currently
-- shown on the About page, so the page looks exactly the same until you edit it.
-- It does not touch any existing table or data. Safe to run twice (the seed only runs if the table is empty).
-- ============================================================

CREATE TABLE IF NOT EXISTS team_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  role        text NOT NULL,
  bio         text,
  badge       text,
  avatar      text NOT NULL DEFAULT '🙂',
  photo_url   text,
  gradient    text NOT NULL DEFAULT 'purple',
  sort_order  integer NOT NULL DEFAULT 0,
  is_visible  boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_members_order_idx ON team_members (sort_order, created_at);

-- Only the server (service role / database connection) can read or write it
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

INSERT INTO team_members (name, role, bio, badge, avatar, gradient, sort_order)
SELECT * FROM (VALUES
  ('Sarah M.', 'Creative Director & Co-founder', 'Former art teacher with 10+ years in children''s education. Sarah hand-picks every design and makes sure it''s perfect for little hands.', '🖌️ Art & Design', '🎨', 'purple', 1),
  ('James K.', 'Lead Developer & Co-founder', 'Full-stack developer passionate about making free resources accessible to every family, anywhere in the world.', '⚙️ Tech & Platform', '💻', 'blue', 2),
  ('Priya L.', 'Content & SEO Lead', 'Writer and parent of two who researches every coloring theme to make sure our guides and descriptions actually help families.', '📝 Content', '✍️', 'green', 3),
  ('Lily T.', 'Illustrator', 'Freelance illustrator specialising in bold, child-friendly linework. Lily creates our exclusive original coloring pages.', '🖊️ Illustration', '🌈', 'orange', 4),
  ('Marco R.', 'Community Manager', 'Responds to every email, gathers parent feedback, and champions user ideas that make the site better every month.', '💬 Support', '📬', 'pink', 5),
  ('Chen W.', 'Security & Privacy', 'Keeps the site safe and family-friendly. No trackers, no ads targeting kids, no data ever sold — Chen makes sure of it.', '🛡️ Safety', '🔒', 'indigo', 6)
) AS seed(name, role, bio, badge, avatar, gradient, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM team_members);
