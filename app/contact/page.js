import { headers } from 'next/headers';
import { generateMetadata as genMeta, getCurrentBrand } from '@/lib/seo';
import { getBrandByDomain } from '@/config/brands';
import ContactForm from './ContactForm';

export async function generateMetadata() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const brand = getBrandByDomain(host);
  
  return genMeta({
    title: `Contact Us - ${brand.name}`,
    description: `Get in touch with ${brand.name}. Have questions about our coloring pages or printables? We'd love to hear from you!`,
    path: '/contact',
    keywords: 'contact us, coloring pages support, help, feedback, suggestions'
  });
}

export const revalidate = 86400;

export default async function ContactPage() {
  const brand = await getCurrentBrand();

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

          <div className="mt-8 text-center">
            <div className="bg-white rounded-2xl p-4 inline-block shadow-lg">
              <p className="text-gray-600">
                You can also reach us at: <strong className="text-purple-600">{brand.contact.email}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
