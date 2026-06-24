-- ============================================================
-- RUN THIS ONCE in Supabase Dashboard → SQL Editor
-- ============================================================

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

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION set_blog_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION set_blog_updated_at();

-- RLS: anyone can read published posts, anon key can do all (admin uses anon key server-side)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read published" ON blog_posts;
DROP POLICY IF EXISTS "service all"           ON blog_posts;

CREATE POLICY "public read published"
  ON blog_posts FOR SELECT
  USING (is_published = true);

-- Allow all operations via anon key (your server-side calls use the anon key)
CREATE POLICY "anon full access"
  ON blog_posts FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Seed: migrate the 5 static articles from lib/blog.js
-- ============================================================

INSERT INTO blog_posts (title, slug, meta_title, description, cover_emoji, tags, read_time, sections, faqs, related_category_name, related_category_slug, published_at)
VALUES

('100 Free Ocean Animal Coloring Pages for Kids',
 '100-free-ocean-animal-coloring-pages',
 '100 Free Ocean Animal Coloring Pages for Kids (Printable PDF)',
 'Discover 100+ free printable ocean animal coloring pages featuring dolphins, sharks, whales, sea turtles, octopuses, and more. Perfect for kids of all ages — download and print instantly!',
 '🐬',
 '["ocean animals","free coloring pages","kids activities","printable","sea creatures"]',
 '7 min read',
 '[{"heading":"Why Kids Love Ocean Animal Coloring Pages","content":"Ocean animals spark curiosity like few other subjects. From the graceful dolphin leaping through waves to the mysterious deep-sea anglerfish glowing in the dark, the ocean is full of creatures that capture children''s imaginations."},{"heading":"The 10 Most Popular Ocean Animals to Color","items":["🐬 **Dolphins** — Always a favourite.","🦈 **Sharks** — Great white, hammerhead, and whale sharks.","🐳 **Whales** — Blue whales, humpbacks, and orcas.","🐢 **Sea Turtles** — The detailed shell pattern gives older kids a satisfying challenge.","🐙 **Octopuses** — Eight arms full of possibilities!","🦀 **Crabs** — Great for younger children thanks to simple shapes.","🐠 **Tropical Fish** — Clownfish, angelfish, and pufferfish.","🦑 **Squids** — Long, flowing bodies make for dramatic coloring pages.","⭐ **Starfish** — Simple five-point shapes ideal for toddlers.","🐡 **Seahorses** — The intricate ridged body is a popular challenge."]}]',
 '[{"q":"Are these ocean animal coloring pages really free?","a":"Yes! Every ocean animal coloring page on Creative Coloring Pages is 100% free to download and print at home. No account required, no hidden fees."},{"q":"What format are the coloring pages in?","a":"All pages are available as high-resolution PDF files, optimised for standard A4 and US Letter paper sizes."},{"q":"Can I use these pages in my classroom or homeschool?","a":"Absolutely. Our coloring pages are free for personal, classroom, and homeschool educational use."}]',
 'Ocean Animals', 'ocean-animals', '2025-01-10'),

('Best Mandala Coloring Pages for Adults and Kids (Free Printables)',
 'best-mandala-coloring-pages',
 'Best Mandala Coloring Pages — Free Printable PDF Download',
 'Explore the best free mandala coloring pages for adults and kids. From simple patterns for beginners to intricate designs for advanced colorists. Download instantly, print at home.',
 '🌀',
 '["mandala","adult coloring","stress relief","free coloring pages","mindfulness"]',
 '8 min read',
 '[{"heading":"What Is a Mandala?","content":"The word \"mandala\" comes from the Sanskrit word meaning \"circle.\" In Hindu and Buddhist traditions, mandalas are spiritual symbols representing the universe. Today, mandala coloring has become one of the most popular forms of art therapy and mindful relaxation."},{"heading":"The Proven Mental Health Benefits of Mandala Coloring","items":["**Reduces anxiety** — The focused, repetitive nature of mandala coloring activates the same brain regions as meditation.","**Improves concentration** — Staying within the lines of intricate patterns trains attention span.","**Promotes mindfulness** — Coloring requires you to be present in the moment.","**Lowers cortisol** — Measurable reductions in the stress hormone cortisol after coloring sessions.","**Boosts creativity** — Choosing color combinations exercises creative thinking."]}]',
 '[{"q":"Are mandala coloring pages suitable for children?","a":"Yes! Simple mandala designs with large sections are excellent for children aged 6 and up. They help develop fine motor skills and concentration."},{"q":"Can I use watercolors on printed mandala pages?","a":"Yes, but print on heavier paper (120gsm+) to prevent warping and bleed-through."},{"q":"Is mandala coloring really therapeutic?","a":"Multiple clinical studies have found that coloring geometric patterns like mandalas reduces anxiety and produces mindfulness states similar to meditation."}]',
 'Mandalas', 'mandalas', '2025-01-20'),

('Free Dinosaur Coloring Pages: 50+ Printables for Kids',
 'free-dinosaur-coloring-pages',
 'Free Dinosaur Coloring Pages for Kids — 50+ Printable PDFs',
 'Download 50+ free printable dinosaur coloring pages featuring T-Rex, Triceratops, Stegosaurus, Brachiosaurus, Velociraptor, and more. Perfect for kids who love prehistoric creatures!',
 '🦕',
 '["dinosaurs","free coloring pages","kids activities","printable","T-Rex"]',
 '6 min read',
 '[{"heading":"Why Dinosaur Coloring Pages Are Perfect for Kids","content":"Dinosaurs capture children''s imaginations like almost nothing else. The combination of enormous size, dramatic shapes, and the mystery of extinction makes them endlessly fascinating."},{"heading":"The Most Popular Dinosaurs to Color","items":["🦖 **T-Rex** — The undisputed king with massive head and tiny arms.","🦕 **Brachiosaurus** — Long neck stretching to the treetops.","🦎 **Triceratops** — Three horns and a striking frill.","⚔️ **Stegosaurus** — Distinctive back plates and spiked tail.","🌿 **Velociraptor** — Modern science shows they likely had feathers!"]}]',
 '[{"q":"What color were dinosaurs really?","a":"Scientists have discovered some small feathered dinosaurs had iridescent black feathers. But most large dinosaurs'' colors remain unknown — so your child''s color choices are as valid as anyone''s!"},{"q":"Did dinosaurs have feathers?","a":"Yes! Fossil evidence shows that many theropod dinosaurs had feathers. Modern birds are actually living dinosaurs."},{"q":"Are these dinosaur coloring pages free to print?","a":"Yes, all dinosaur coloring pages on our site are completely free to download and print."}]',
 'Dinosaurs', 'dinosaurs', '2025-02-05'),

('Free Butterfly Coloring Pages — 40+ Beautiful Printables',
 'free-butterfly-coloring-pages',
 'Free Butterfly Coloring Pages for Kids & Adults — Printable PDFs',
 'Download 40+ free printable butterfly coloring pages. From simple monarch butterflies to intricate stained-glass designs. Perfect for all ages — beautiful results every time!',
 '🦋',
 '["butterflies","nature coloring","free coloring pages","printable","kids activities"]',
 '6 min read',
 '[{"heading":"Why Butterfly Coloring Pages Are Timeless Favourites","content":"Few subjects are more universally beloved in coloring than butterflies. Their perfect bilateral symmetry, infinite color combinations in nature, and graceful shapes make them ideal subjects."},{"heading":"Popular Butterfly Species to Color","items":["🦋 **Monarch Butterfly** — Iconic orange and black pattern.","💙 **Blue Morpho** — Stunning iridescent blue wings.","⬛ **Swallowtail** — Elegant elongated wings with distinctive tail-like extensions.","🌸 **Painted Lady** — Orange, brown, and white with detailed eyespot patterns.","🎭 **Peacock Butterfly** — Four dramatic eyespots."]}]',
 '[{"q":"Are butterfly coloring pages suitable for adults?","a":"Absolutely. Intricate butterfly designs with detailed wing patterns, eyespots, and delicate veining are popular in adult coloring."},{"q":"How do I make butterfly wing colors look realistic?","a":"Layer colors from light to dark, add darker shades near the wing edges and veins, and leave tiny white spots uncolored."},{"q":"Can I use these pages for a school science project?","a":"Yes! Our butterfly pages are free for educational use."}]',
 'Butterflies', 'butterflies', '2025-02-20'),

('Free Christmas Coloring Pages — 60+ Holiday Printables for Kids',
 'free-christmas-coloring-pages',
 'Free Christmas Coloring Pages for Kids — 60+ Printable PDFs',
 'Download 60+ free printable Christmas coloring pages featuring Santa Claus, reindeer, Christmas trees, snowmen, elves, and festive winter scenes. Perfect holiday activity for all ages!',
 '🎄',
 '["christmas","holiday","free coloring pages","kids activities","santa","winter"]',
 '7 min read',
 '[{"heading":"Christmas Coloring Pages: A Holiday Tradition","content":"Christmas coloring pages have been a holiday tradition for generations. Whether used as a quiet activity to occupy excited children on Christmas Eve, a creative alternative to screen time, or a thoughtful gift — printable Christmas coloring pages are endlessly useful."},{"heading":"The 10 Most Popular Christmas Coloring Themes","items":["🎅 **Santa Claus** — Classic full-body Santa, Santa reading his list, Santa going down a chimney.","🦌 **Reindeer** — Rudolph with his glowing red nose is the clear favourite.","🎄 **Christmas Tree** — Decorated, undecorated, with presents underneath.","⛄ **Snowman** — A perennial winter favourite.","🧝 **Elves** — Santa''s workshop elves making toys."]}]',
 '[{"q":"Are these Christmas coloring pages free to print?","a":"Yes, completely free! Download any Christmas coloring page and print as many copies as you need."},{"q":"What paper size are the Christmas coloring pages designed for?","a":"All pages are designed for standard A4 and US Letter paper."},{"q":"Do you have religious Christmas coloring pages (Nativity)?","a":"Yes! Our Christmas collection includes both secular and religious designs."},{"q":"Can I use these for a church or Sunday school Christmas activity?","a":"Absolutely. Our coloring pages are free for personal, educational, and non-commercial religious use."}]',
 'Christmas', 'christmas', '2025-03-01')

ON CONFLICT (slug) DO NOTHING;
