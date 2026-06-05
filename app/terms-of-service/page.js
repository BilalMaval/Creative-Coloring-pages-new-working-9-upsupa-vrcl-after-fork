import { headers } from 'next/headers';
import { generateMetadata as genMeta, getCurrentBrand } from '@/lib/seo';
import { getBrandByDomain } from '@/config/brands';

export async function generateMetadata() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const brand = getBrandByDomain(host);
  
  return genMeta({
    title: `Terms of Service - ${brand.name}`,
    description: `Terms of service for ${brand.name}. Read our rules and regulations for using our website to download free coloring pages and printables.`,
    path: '/terms-of-service',
    keywords: 'terms of service, terms and conditions, coloring pages terms, usage policy'
  });
}

export const revalidate = 86400; // Cache for 24 hours

export default async function TermsOfServicePage() {
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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 shadow-2xl mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">📜 Terms of Service</h1>
            <p className="text-white/80">Last updated: {lastUpdated}</p>
          </div>
          
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="prose prose-lg max-w-none space-y-8">
              
              <section>
                <h2 className="text-2xl font-bold mb-4 text-blue-700">1. Acceptance of Terms</h2>
                <p className="text-gray-700 mb-4">
                  By accessing and using {brand.name} ("the Website"), you accept and agree to be bound by 
                  these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-blue-700">2. Description of Service</h2>
                <p className="text-gray-700 mb-4">
                  {brand.name} provides downloadable digital content including coloring pages, calendars, 
                  printables, and digital books. Our content is available as both free downloads and premium purchases.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-blue-700">3. License and Permitted Use</h2>
                <p className="text-gray-700 mb-4">
                  When you download content from our Website, you are granted a limited, non-exclusive, 
                  non-transferable license to use the content for the following purposes:
                </p>
                <h3 className="text-xl font-semibold mb-2 text-green-600">✅ Permitted Uses:</h3>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>Personal, non-commercial use at home</li>
                  <li>Educational use in classrooms and schools</li>
                  <li>Use by non-profit organizations for educational activities</li>
                  <li>Printing unlimited copies for personal use</li>
                  <li>Sharing printed copies with family members and students</li>
                </ul>
                <h3 className="text-xl font-semibold mb-2 text-red-600">❌ Prohibited Uses:</h3>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>Selling, redistributing, or sublicensing downloaded content</li>
                  <li>Using content for commercial purposes without explicit written permission</li>
                  <li>Claiming ownership or authorship of our content</li>
                  <li>Removing or altering any watermarks, credits, or copyright notices</li>
                  <li>Creating derivative works for commercial distribution</li>
                  <li>Uploading content to other websites or file-sharing platforms</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-blue-700">4. Intellectual Property Rights</h2>
                <p className="text-gray-700 mb-4">
                  All content on this Website, including but not limited to images, text, graphics, logos, and 
                  downloadable materials, is the property of {brand.name} or its content suppliers 
                  and is protected by international copyright laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-blue-700">5. Purchases and Payments</h2>
                <p className="text-gray-700 mb-4">
                  For premium content purchases:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>All prices are displayed in USD unless otherwise stated</li>
                  <li>Payment is processed securely through our payment partners</li>
                  <li>Digital products are delivered immediately upon successful payment</li>
                  <li>Due to the digital nature of our products, all sales are final</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-blue-700">6. Refund Policy</h2>
                <p className="text-gray-700 mb-4">
                  Due to the digital nature of our products, we generally do not offer refunds. However, we may 
                  consider refund requests in the following circumstances:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>Technical issues preventing access to purchased content</li>
                  <li>Duplicate purchases made in error</li>
                  <li>Product significantly different from its description</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  Refund requests must be made within 7 days of purchase by contacting us through our contact form.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-blue-700">7. User Conduct</h2>
                <p className="text-gray-700 mb-4">
                  You agree not to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>Use the Website for any unlawful purpose</li>
                  <li>Attempt to gain unauthorized access to any part of the Website</li>
                  <li>Interfere with or disrupt the Website or servers</li>
                  <li>Use automated systems to access the Website without permission</li>
                  <li>Submit false or misleading information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-blue-700">8. Disclaimer of Warranties</h2>
                <p className="text-gray-700 mb-4">
                  THE WEBSITE AND ALL CONTENT ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY 
                  KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE WEBSITE WILL BE UNINTERRUPTED, 
                  ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-blue-700">9. Limitation of Liability</h2>
                <p className="text-gray-700 mb-4">
                  TO THE FULLEST EXTENT PERMITTED BY LAW, {brand.name.toUpperCase()} SHALL NOT BE LIABLE FOR ANY 
                  INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATING 
                  TO YOUR USE OF THE WEBSITE OR DOWNLOADED CONTENT.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-blue-700">10. Changes to Terms</h2>
                <p className="text-gray-700 mb-4">
                  We reserve the right to modify these Terms at any time. Changes will be effective immediately 
                  upon posting to the Website. Your continued use of the Website after any changes constitutes 
                  acceptance of the new Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-blue-700">11. Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>Through our <a href="/contact" className="text-blue-600 hover:underline font-bold">Contact Form</a></li>
                  <li>Email: {brand.contact.email}</li>
                </ul>
              </section>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
