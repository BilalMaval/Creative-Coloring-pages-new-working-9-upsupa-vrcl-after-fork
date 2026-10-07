import { defaultBrand, toClientBrand } from '@/config/brands';
import { BrandProvider } from '@/components/BrandProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavigationProgress from '@/components/NavigationProgress';

export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
  icons: { icon: defaultBrand.favicon, apple: defaultBrand.favicon },
};

export default function AdminRootLayout({ children }) {
  const brand = defaultBrand;

  return (
    <div className={`flex flex-col min-h-screen bg-gradient-to-b ${brand.colors.gradient}`}>
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
