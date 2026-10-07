import Script from 'next/script';
import { notFound } from 'next/navigation';
import { getBrandByKey, getBrandKeys, getSiteUrl, toClientBrand } from '@/config/brands';
import { BrandProvider } from '@/components/BrandProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavigationProgress from '@/components/NavigationProgress';

// Middleware rewrites each domain to /<brandKey>/..., so every brand gets its own cached pages.
// Unknown brand keys 404 in the layout below (dynamicParams must stay on for nested routes).
export function generateStaticParams() {
  return getBrandKeys().map((brand) => ({ brand }));
}

export async function generateMetadata({ params }) {
  const { brand: key } = await params;
  const brand = getBrandByKey(key);
  if (!brand) return {};

  return {
    title: brand.seo.defaultTitle,
    description: brand.description,
    keywords: brand.keywords,
    authors: [{ name: brand.name, url: getSiteUrl(brand) }],
    other: {
      author: brand.name,
      ...(brand.seo.pinterestVerify ? { 'p:domain_verify': brand.seo.pinterestVerify } : {}),
    },
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

export default async function BrandLayout({ children, params }) {
  const { brand: key } = await params;
  const brand = getBrandByKey(key);
  if (!brand) notFound();

  return (
    <div className={`flex flex-col min-h-screen bg-gradient-to-b ${brand.colors.gradient}`}>
      {brand.analytics?.gtmId && (
        <>
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${brand.analytics.gtmId}');`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${brand.analytics.gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {brand.analytics?.gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${brand.analytics.gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${brand.analytics.gaId}');`}
          </Script>
        </>
      )}

      <BrandProvider brand={toClientBrand(brand)}>
        <NavigationProgress />
        <Header />
        <main className="flex-1 flex flex-col min-h-[calc(100vh-80px)]">
          {children}
        </main>
        <Footer />
      </BrandProvider>
    </div>
  );
}
