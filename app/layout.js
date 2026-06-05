import "./globals.css";
import { headers } from 'next/headers';
import { getBrandByDomain } from '@/config/brands';
import { BrandProvider } from '@/components/BrandProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavigationProgress from '@/components/NavigationProgress';

// Dynamic metadata based on brand
export async function generateMetadata() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const brand = getBrandByDomain(host);
  
  return {
    title: brand.seo.defaultTitle,
    description: brand.description,
    keywords: brand.keywords,
    icons: {
      icon: brand.favicon,
      apple: brand.favicon,
    },
    openGraph: {
      title: brand.seo.defaultTitle,
      description: brand.description,
      images: [brand.seo.ogImage],
      siteName: brand.name,
    },
  };
}

export default async function RootLayout({ children }) {
  // Get brand from request headers
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const brand = getBrandByDomain(host);
  const baseUrl = `${protocol}://${host}`;
  
  // Serialize brand for client components (no sensitive data)
  const clientBrand = {
    domain: brand.domain,
    name: brand.name,
    shortName: brand.shortName,
    tagline: brand.tagline,
    description: brand.description,
    logo: brand.logo,
    favicon: brand.favicon,
    colors: brand.colors,
    contact: brand.contact,
    socialLinks: brand.socialLinks,
    seo: brand.seo,
  };

  return (
    <html lang="en">
      <head>
        <link rel="icon" href={brand.favicon} type="image/png" />
        <link rel="apple-touch-icon" href={brand.favicon} />
        
        {/* Google Tag Manager - Only if GTM ID exists */}
        {brand.analytics?.gtmId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${brand.analytics.gtmId}');`
            }}
          />
        )}
        
        {/* Google Analytics - Only if GA ID exists */}
        {brand.analytics?.gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${brand.analytics.gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${brand.analytics.gaId}');`
              }}
            />
          </>
        )}
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: brand.seo.defaultTitle,
              description: brand.description,
              url: baseUrl,
              potentialAction: {
                '@type': 'SearchAction',
                target: `${baseUrl}/search?q={search_term_string}`,
                'query-input': 'required name=search_term_string'
              }
            })
          }}
        />
        
        {/* Prevent white flash during page transitions */}
        <style>{`
          html, body {
            background: linear-gradient(to bottom, #eff6ff, #faf5ff, #fdf2f8);
            min-height: 100vh;
          }
        `}</style>
      </head>
      <body className={`antialiased flex flex-col min-h-screen bg-gradient-to-b ${brand.colors.gradient}`}>
        {/* Google Tag Manager (noscript) */}
        {brand.analytics?.gtmId && (
          <noscript>
            <iframe 
              src={`https://www.googletagmanager.com/ns.html?id=${brand.analytics.gtmId}`}
              height="0" 
              width="0" 
              style={{display: 'none', visibility: 'hidden'}}
            />
          </noscript>
        )}
        
        <BrandProvider brand={clientBrand}>
          <NavigationProgress />
          <Header />
          <main className="flex-1 flex flex-col min-h-[calc(100vh-80px)]">
            {children}
          </main>
          <Footer />
        </BrandProvider>
      </body>
    </html>
  );
}
