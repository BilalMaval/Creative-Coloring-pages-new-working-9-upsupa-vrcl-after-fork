// Seeds blog_posts table using plain REST fetch (no WebSocket needed, works on Node 18)

const SUPABASE_URL = 'https://vfiyffogstwmeudvnasp.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlmZm9nc3R3bWV1ZHZuYXNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMwNTMwNCwiZXhwIjoyMDg1ODgxMzA0fQ.RrzITgXuLe0PCFInmX7k8CyL-0_H_KA6jyx3HNrjorI';

const HEADERS = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates,return=representation',
};

const rows = [
  {
    title: '100 Free Ocean Animal Coloring Pages for Kids',
    slug: '100-free-ocean-animal-coloring-pages',
    meta_title: '100 Free Ocean Animal Coloring Pages for Kids (Printable PDF)',
    description: 'Discover 100+ free printable ocean animal coloring pages featuring dolphins, sharks, whales, sea turtles, octopuses, and more. Perfect for kids of all ages — download and print instantly!',
    cover_emoji: '🐬',
    tags: ['ocean animals','free coloring pages','kids activities','printable','sea creatures'],
    read_time: '7 min read',
    related_category_name: 'Ocean Animals',
    related_category_slug: 'ocean-animals',
    is_published: true,
    published_at: '2025-01-10',
    sections: [
      { heading: 'Why Kids Love Ocean Animal Coloring Pages', content: 'Ocean animals spark curiosity like few other subjects. From the graceful dolphin leaping through waves to the mysterious deep-sea anglerfish, the ocean is full of creatures that capture imagination. Coloring these animals helps kids learn about marine life while developing fine motor skills, patience, and creativity.' },
      { heading: 'The 10 Most Popular Ocean Animals to Color', items: ['Dolphins — Always a favourite. Their smooth curved bodies are satisfying to color.','Sharks — Great white, hammerhead, and whale sharks are endlessly popular.','Whales — Blue whales, humpbacks, and orcas make stunning full-page scenes.','Sea Turtles — The detailed shell pattern gives older kids a satisfying challenge.','Octopuses — Eight arms full of possibilities!','Crabs — Great for younger children thanks to simple shapes and bold colors.','Tropical Fish — Clownfish, angelfish, and pufferfish are perfect for bright colors.','Squids — Long flowing bodies make for dramatic coloring pages.','Starfish — Simple five-point shapes ideal for toddlers and preschoolers.','Seahorses — The intricate ridged body is a popular challenge for ages 7 and up.'] }
    ],
    faqs: [
      { q: 'Are these ocean animal coloring pages really free?', a: 'Yes! Every ocean animal coloring page on Creative Coloring Pages is 100% free to download and print at home. No account required, no hidden fees.' },
      { q: 'What format are the coloring pages in?', a: 'All pages are available as high-resolution PDF files, optimised for standard A4 and US Letter paper sizes. Simply download and print.' },
      { q: 'Can I use these pages in my classroom or homeschool?', a: 'Absolutely. Our coloring pages are free for personal, classroom, and homeschool educational use.' }
    ]
  },
  {
    title: 'Best Mandala Coloring Pages for Adults and Kids (Free Printables)',
    slug: 'best-mandala-coloring-pages',
    meta_title: 'Best Mandala Coloring Pages — Free Printable PDF Download',
    description: 'Explore the best free mandala coloring pages for adults and kids. From simple patterns for beginners to intricate designs for advanced colorists. Download instantly, print at home.',
    cover_emoji: '🌀',
    tags: ['mandala','adult coloring','stress relief','free coloring pages','mindfulness'],
    read_time: '8 min read',
    related_category_name: 'Mandalas',
    related_category_slug: 'mandalas',
    is_published: true,
    published_at: '2025-01-20',
    sections: [
      { heading: 'What Is a Mandala?', content: 'The word mandala comes from the Sanskrit word meaning circle. In Hindu and Buddhist traditions, mandalas are spiritual symbols representing the universe. Today, mandala coloring has become one of the most popular forms of art therapy and mindful relaxation for people of all ages.' },
      { heading: 'The Proven Mental Health Benefits of Mandala Coloring', items: ['Reduces anxiety — The focused repetitive nature of mandala coloring activates the same brain regions as meditation.','Improves concentration — Staying within the lines of intricate patterns trains attention span over time.','Promotes mindfulness — Coloring requires you to be present in the moment.','Lowers cortisol — Research from art therapists has found measurable reductions in the stress hormone cortisol after coloring sessions.','Boosts creativity — Choosing color combinations exercises creative thinking in a low-stakes environment.'] },
      { heading: 'Types of Mandala Coloring Pages', content: 'Simple Beginner Mandalas: Fewer sections, larger spaces, basic geometric shapes. Perfect for children aged 6+ and adults new to mandala coloring.\n\nIntermediate Mandalas: More sections with moderate detail. Best for ages 10+ and adults wanting a gentle challenge.\n\nAdvanced Intricate Mandalas: Hundreds of tiny cells, fine linework, complex layering. For dedicated colorists using fine-tipped colored pencils or gel pens.' }
    ],
    faqs: [
      { q: 'Are mandala coloring pages suitable for children?', a: 'Yes! Simple mandala designs with large sections are excellent for children aged 6 and up. They help develop fine motor skills and concentration. Save the intricate designs for ages 10+.' },
      { q: 'Can I use watercolors on printed mandala pages?', a: 'Yes, but print on heavier paper (120gsm+) to prevent warping and bleed-through. Use minimal water and let each section dry completely before coloring adjacent areas.' },
      { q: 'Is mandala coloring really therapeutic?', a: 'Multiple clinical studies have found that coloring geometric patterns like mandalas reduces anxiety and produces mindfulness states similar to meditation. Art therapists regularly use mandala coloring in therapeutic settings.' }
    ]
  },
  {
    title: 'Free Dinosaur Coloring Pages: 50+ Printables for Kids',
    slug: 'free-dinosaur-coloring-pages',
    meta_title: 'Free Dinosaur Coloring Pages for Kids — 50+ Printable PDFs',
    description: 'Download 50+ free printable dinosaur coloring pages featuring T-Rex, Triceratops, Stegosaurus, Brachiosaurus, Velociraptor, and more. Perfect for kids who love prehistoric creatures!',
    cover_emoji: '🦕',
    tags: ['dinosaurs','free coloring pages','kids activities','printable','T-Rex'],
    read_time: '6 min read',
    related_category_name: 'Dinosaurs',
    related_category_slug: 'dinosaurs',
    is_published: true,
    published_at: '2025-02-05',
    sections: [
      { heading: 'Why Dinosaur Coloring Pages Are Perfect for Kids', content: 'Dinosaurs capture imagination like almost nothing else. The combination of enormous size, dramatic shapes, and the mystery of extinction makes them endlessly fascinating. Dinosaur coloring pages give kids a way to engage with that fascination actively — creating their own vision of what a T-Rex looked like.' },
      { heading: 'The Most Popular Dinosaurs to Color', items: ['Tyrannosaurus Rex (T-Rex) — The undisputed king. The massive head, tiny arms, and powerful legs make for dramatic coloring pages.','Brachiosaurus — Long neck stretching to the treetops. Great for wide landscape coloring pages.','Triceratops — Three horns and a striking frill make this herbivore immediately recognizable.','Stegosaurus — The distinctive back plates and spiked tail are loved by younger children.','Velociraptor — Modern science shows they likely had feathers!','Ankylosaurus — The armored tank of the dinosaur world, with its club tail.','Pterodactyl — The wings make for impressive coloring pages.'] },
      { heading: 'Fun Dinosaur Facts to Share While Coloring', items: ['Dinosaurs ruled the Earth for about 165 million years. Humans have only been around for 300,000 years.','The T-Rex had a bite force of 12,800 pounds — strong enough to crush a car.','Some dinosaurs like Velociraptors were covered in feathers and are the direct ancestors of modern birds.','The Brachiosaurus was so tall it could look into a four-story building window.','Starfish can regrow lost arms.'] }
    ],
    faqs: [
      { q: 'What color were dinosaurs really?', a: 'Scientists have discovered that some small feathered dinosaurs had iridescent black feathers similar to crows. But most large dinosaurs colors remain unknown — so your childs color choices are as valid as anyones!' },
      { q: 'Did dinosaurs have feathers?', a: 'Yes! Fossil evidence shows that many theropod dinosaurs had feathers. Modern birds are actually living dinosaurs — direct descendants of feathered theropods.' },
      { q: 'Are these dinosaur coloring pages free to print?', a: 'Yes, all dinosaur coloring pages on our site are completely free to download and print. No signup required.' }
    ]
  },
  {
    title: 'Free Butterfly Coloring Pages — 40+ Beautiful Printables',
    slug: 'free-butterfly-coloring-pages',
    meta_title: 'Free Butterfly Coloring Pages for Kids & Adults — Printable PDFs',
    description: 'Download 40+ free printable butterfly coloring pages. From simple monarch butterflies to intricate stained-glass designs. Perfect for all ages — beautiful results every time!',
    cover_emoji: '🦋',
    tags: ['butterflies','nature coloring','free coloring pages','printable','kids activities'],
    read_time: '6 min read',
    related_category_name: 'Butterflies',
    related_category_slug: 'butterflies',
    is_published: true,
    published_at: '2025-02-20',
    sections: [
      { heading: 'Why Butterfly Coloring Pages Are Timeless Favourites', content: 'Few subjects are more universally beloved in coloring than butterflies. Their perfect bilateral symmetry, infinite color combinations in nature, and graceful shapes make them ideal subjects for colorists of every age and skill level. The two-wing symmetry is particularly satisfying — once you decide on a pattern for one wing, you simply mirror it on the other.' },
      { heading: 'Popular Butterfly Species to Color', items: ['Monarch Butterfly — Iconic orange and black pattern, instantly recognizable.','Blue Morpho — Stunning iridescent blue wings.','Swallowtail — Elegant elongated wings with distinctive tail-like extensions.','Painted Lady — Orange, brown, and white with detailed eyespot patterns.','Peacock Butterfly — Four dramatic eyespots that look like the eyes of a peacock feather.','Common Blue — A delicate species with dusty-blue wings edged in white.'] },
      { heading: 'Techniques for Stunning Butterfly Coloring', content: 'Work from the outside in. Color the wing edges first then work toward the body. This establishes the boundary before filling the interior.\n\nMirror your colors. Butterflies have perfectly symmetric wings in real life. Mirror your color choices on both wings for an authentic result.\n\nLayer for depth. Apply light base colors first, then add darker shades near wing edges and veins for a three-dimensional effect.' }
    ],
    faqs: [
      { q: 'Are butterfly coloring pages suitable for adults?', a: 'Absolutely. Intricate butterfly designs with detailed wing patterns, eyespots, and delicate veining are popular in adult coloring. They offer the same mindful, meditative quality as mandala pages.' },
      { q: 'How do I make butterfly wing colors look realistic?', a: 'Layer colors from light to dark, add darker shades near the wing edges and veins, and leave tiny white spots uncolored to simulate the light-reflecting scale structure of real butterfly wings.' },
      { q: 'Can I use these pages for a school science project?', a: 'Yes! Our butterfly pages are free for educational use. Many teachers combine them with lessons on metamorphosis, symmetry, and ecosystems.' }
    ]
  },
  {
    title: 'Free Christmas Coloring Pages — 60+ Holiday Printables for Kids',
    slug: 'free-christmas-coloring-pages',
    meta_title: 'Free Christmas Coloring Pages for Kids — 60+ Printable PDFs',
    description: 'Download 60+ free printable Christmas coloring pages featuring Santa Claus, reindeer, Christmas trees, snowmen, elves, and festive winter scenes. Perfect holiday activity for all ages!',
    cover_emoji: '🎄',
    tags: ['christmas','holiday','free coloring pages','kids activities','santa','winter'],
    read_time: '7 min read',
    related_category_name: 'Christmas',
    related_category_slug: 'christmas',
    is_published: true,
    published_at: '2025-03-01',
    sections: [
      { heading: 'Christmas Coloring Pages: A Holiday Tradition', content: 'Christmas coloring pages have been a holiday tradition for generations. Whether used as a quiet activity to occupy excited children on Christmas Eve, a creative alternative to screen time during school holidays, or a thoughtful gift — printable Christmas coloring pages are endlessly useful. Best of all: they are completely free. Download, print, and start coloring — no subscription, no account, no waiting for delivery.' },
      { heading: 'The 10 Most Popular Christmas Coloring Themes', items: ['Santa Claus — Classic full-body Santa, Santa reading his list, Santa going down a chimney.','Reindeer — Rudolph with his glowing red nose is the clear favourite.','Christmas Tree — Decorated, undecorated, with presents underneath.','Snowman — A perennial winter favourite.','Elves — Santas workshop elves making toys and wrapping presents.','Christmas Bells — Traditional holly-and-bells designs.','Gift Boxes — Presents under the tree with ribbons and bows.','Christmas Star — The star of Bethlehem or decorative geometric star designs.'] },
      { heading: 'Christmas Coloring for School and Classroom Use', content: 'Advent countdown: Print 25 small Christmas images and staple into a mini booklet. One page per day through December.\n\nChristmas card exchange: Each student colors a Christmas page and writes a message on the back. Cards are distributed to classmates.\n\nClassroom decoration: Completed large-format coloring pages make beautiful classroom window decorations when taped up against the light.' }
    ],
    faqs: [
      { q: 'Are these Christmas coloring pages free to print?', a: 'Yes, completely free! Download any Christmas coloring page and print as many copies as you need for personal, family, classroom, or church group use.' },
      { q: 'What paper size are the Christmas coloring pages designed for?', a: 'All pages are designed for standard A4 (210x297mm) and US Letter (8.5x11 inch) paper.' },
      { q: 'Do you have religious Christmas coloring pages (Nativity)?', a: 'Yes! Our Christmas collection includes both secular holiday designs (Santa, reindeer, snowmen) and religious designs (nativity scene, star of Bethlehem, angels).' },
      { q: 'Can I use these for a church or Sunday school Christmas activity?', a: 'Absolutely. Our coloring pages are free for personal, educational, and non-commercial religious use.' }
    ]
  }
];

console.log('Seeding', rows.length, 'blog articles to Supabase...');

const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts`, {
  method: 'POST',
  headers: HEADERS,
  body: JSON.stringify(rows),
});

const text = await res.text();

if (!res.ok) {
  console.error('FAILED (' + res.status + '):', text);
  process.exit(1);
}

const data = JSON.parse(text);
console.log('\nSUCCESS — seeded', data.length, 'articles:');
data.forEach(r => console.log('  ✓', r.slug));
