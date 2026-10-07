import { generateMetadata as genMeta } from '@/lib/seo';
import { getBrandByKey } from '@/config/brands';
import ContactForm from './ContactForm';

export async function generateMetadata({ params }) {
  const { brand: brandKey } = await params;
  const brand = getBrandByKey(brandKey);
  
  return genMeta({
    brand,
    title: `Contact Us - ${brand.name}`,
    description: `Get in touch with ${brand.name}. Have questions about our coloring pages or printables? We'd love to hear from you!`,
    path: '/contact',
    keywords: 'contact us, coloring pages support, help, feedback, suggestions'
  });
}

export const revalidate = 86400;

export default async function ContactPage({ params }) {
  const { brand: brandKey } = await params;
  const brand = getBrandByKey(brandKey);

  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 flex-1">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl p-8 shadow-2xl mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">✉️ Contact Us</h1>
            <p className="text-xl text-white/90">
              Have a question or suggestion? We'd love to hear from you!
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <ContactForm brandEmail={brand.contact.email} />
          </div>

          <div className="mt-8 space-y-3">
            <div className="bg-white rounded-2xl p-5 shadow-lg space-y-2">
              <p className="text-gray-600">
                📧 <strong className="text-purple-600">{brand.contact.email}</strong>
              </p>
              {brand.contact.phone && (
                <p className="text-gray-600">
                  📞 <strong className="text-purple-600">{brand.contact.phone}</strong>
                </p>
              )}
              {brand.contact.address && (
                <p className="text-gray-600">
                  📍 <strong className="text-purple-600">{brand.contact.address}</strong>
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center">
              This website is owned and operated by Color Craft Studio LLC, a Montana limited liability company.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
