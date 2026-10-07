import { generateMetadata as genMeta, getCurrentBrand } from '@/lib/seo';
import { getBrandByDomain, SITE_HOST } from '@/config/brands';

export async function generateMetadata() {
  const host = SITE_HOST;
  const brand = getBrandByDomain(host);
  
  return genMeta({
    title: `Privacy Policy - ${brand.name}`,
    description: `Privacy policy for ${brand.name}. Learn how we handle your information when you use our website for downloading free coloring pages and printables.`,
    path: '/privacy-policy',
    keywords: 'privacy policy, data protection, coloring pages privacy'
  });
}

export const revalidate = 86400; // Cache for 24 hours

export default async function PrivacyPolicyPage() {
  const brand = await getCurrentBrand();
  const lastUpdated = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 flex-1">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 shadow-2xl mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">🔒 Privacy Policy</h1>
            <p className="text-white/80">Last updated: {lastUpdated}</p>
          </div>
          
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="prose prose-lg max-w-none space-y-8">
              
              <section>
                <h2 className="text-2xl font-bold mb-4 text-purple-700">1. Introduction</h2>
                <p className="text-gray-700 mb-4">
                  Welcome to {brand.name} ("we," "our," or "us"). This website is owned and operated by Color Craft Studio LLC, a Montana limited liability company. We are committed to protecting your privacy
                  and ensuring transparency about how we handle information when you visit our website. This Privacy Policy
                  explains our practices regarding any information that may be associated with your use of our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-purple-700">2. Information We Process</h2>
                <p className="text-gray-700 mb-4">
                  We believe in data minimization and only process information that is necessary for providing our services:
                </p>
                <h3 className="text-xl font-semibold mb-2">Information You Voluntarily Provide:</h3>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li><strong>Contact Information:</strong> When you use our contact form, you provide your name, email address, and message content</li>
                  <li><strong>Newsletter Subscription:</strong> When you subscribe, you provide your name and email address</li>
                  <li><strong>Order Information:</strong> When making a purchase, you provide your name and email for order processing and delivery of digital products</li>
                </ul>
                <h3 className="text-xl font-semibold mb-2">Automatically Collected Information:</h3>
                <p className="text-gray-700 mb-4">
                  We use essential cookies to maintain basic website functionality. We may use analytics services to understand how visitors use our website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-purple-700">3. How We Use Your Information</h2>
                <p className="text-gray-700 mb-4">
                  We use the information you provide solely for the following purposes:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li><strong>Service Delivery:</strong> To process orders and deliver digital products you purchase</li>
                  <li><strong>Communication:</strong> To respond to your inquiries submitted through our contact form</li>
                  <li><strong>Newsletter:</strong> To send you updates about new coloring pages and special offers (only if you subscribed)</li>
                  <li><strong>Order Confirmation:</strong> To send you confirmation emails regarding your purchases</li>
                  <li><strong>Website Functionality:</strong> To ensure our website operates correctly</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-purple-700">4. Data Sharing and Disclosure</h2>
                <p className="text-gray-700 mb-4">
                  We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following limited circumstances:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li><strong>Service Providers:</strong> With trusted third-party services that help us operate our website (e.g., email delivery services), who are contractually obligated to protect your information</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our legal rights</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-purple-700">5. Data Retention</h2>
                <p className="text-gray-700 mb-4">
                  We retain your information only for as long as necessary to fulfill the purposes outlined in this policy:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li><strong>Contact Form Submissions:</strong> Retained until your inquiry is resolved</li>
                  <li><strong>Newsletter Subscriptions:</strong> Retained until you unsubscribe</li>
                  <li><strong>Order Information:</strong> Retained for the period required by applicable tax and accounting laws</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-purple-700">6. Your Rights</h2>
                <p className="text-gray-700 mb-4">
                  Depending on your location, you may have certain rights regarding your personal information:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Objection:</strong> Object to processing of your personal information</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  To exercise any of these rights, please contact us using the information provided below.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-purple-700">7. Data Security</h2>
                <p className="text-gray-700 mb-4">
                  We implement appropriate technical and organizational measures to protect your information against 
                  unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over 
                  the Internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-purple-700">8. Children's Privacy</h2>
                <p className="text-gray-700 mb-4">
                  Our website is designed to be family-friendly. We do not knowingly collect personal information from 
                  children under 13 years of age. If you are a parent or guardian and believe your child has provided 
                  us with personal information, please contact us so we can take appropriate action.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-purple-700">9. Changes to This Policy</h2>
                <p className="text-gray-700 mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
                  new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-purple-700">10. Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>Through our <a href="/contact" className="text-purple-600 hover:underline font-bold">Contact Form</a></li>
                  <li>Email: {brand.contact.email}</li>
                  {brand.contact.phone && <li>Phone: {brand.contact.phone}</li>}
                  {brand.contact.address && <li>Address: {brand.contact.address}</li>}
                </ul>
              </section>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
