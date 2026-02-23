import "./globals.css";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata = genMeta({
  title: 'Free Printable Coloring Pages & Mandalas',
  description: 'Download and print free coloring pages, mandalas, and printable activities for kids and adults. New designs added regularly!',
  keywords: 'coloring pages, printable coloring pages, mandalas, free printables, coloring sheets, kids coloring, adult coloring, mandala designs'
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Free Printable Coloring Pages & Mandalas',
              description: 'Download free printable coloring pages and mandalas for kids and adults',
              url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
              potentialAction: {
                '@type': 'SearchAction',
                target: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/search?q={search_term_string}`,
                'query-input': 'required name=search_term_string'
              }
            })
          }}
        />
      </head>
      <body className="antialiased">
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex flex-col" style={{ minHeight: 'calc(100vh - 160px)' }}>
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}