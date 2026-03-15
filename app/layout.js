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
        <link rel="icon" href="https://customer-assets.emergentagent.com/job_mandala-maker-2/artifacts/xyc9pvqy_Coloringpages%20logo%20%281%29.png" type="image/png" />
        <link rel="apple-touch-icon" href="https://customer-assets.emergentagent.com/job_mandala-maker-2/artifacts/xyc9pvqy_Coloringpages%20logo%20%281%29.png" />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KGTWF7HK');`
          }}
        />
        {/* End Google Tag Manager */}
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
        <style>{`
          /* Prevent white flash during page transitions */
          html, body {
            background: linear-gradient(to bottom, #eff6ff, #faf5ff, #fdf2f8);
            min-height: 100vh;
          }
        `}</style>
      </head>
      <body className="antialiased flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-KGTWF7HK"
            height="0" 
            width="0" 
            style={{display: 'none', visibility: 'hidden'}}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Header />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}