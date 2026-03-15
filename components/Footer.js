import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star } from 'lucide-react';
import { Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 mt-16 border-t-4 border-yellow-400">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About with Logo */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-yellow-400">
            <div className="flex flex-col items-center mb-4">
              <div className="relative h-20 w-20 mb-3">
                <Image
                  src="https://customer-assets.emergentagent.com/job_mandala-maker-2/artifacts/xyc9pvqy_Coloringpages%20logo%20%281%29.png"
                  alt="CCP Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="font-black text-lg text-gray-800">Creative Coloring Pages</h3>
            </div>
            <p className="text-sm text-gray-700 font-medium text-center">
              🎨 Free coloring pages for kids and families!
            </p>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-pink-400">
            <h3 className="font-black text-lg mb-4 text-pink-600 flex items-center gap-2">
              <Star className="h-5 w-5" />
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">
                  🏠 Home
                </Link>
              </li>
              <li>
                <Link href="/category/coloring-pages" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">
                  🎨 Coloring Pages
                </Link>
              </li>
              <li>
                <Link href="/category/calendars" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">
                  📅 Calendars
                </Link>
              </li>
              <li>
                <Link href="/category/printables" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">
                  📄 Printables
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">
                  ❓ About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* For Parents */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-green-400">
            <h3 className="font-black text-lg mb-4 text-green-600 flex items-center gap-2">
              <Heart className="h-5 w-5" />
              For Parents
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy-policy" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">
                  🔒 Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">
                  📜 Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">
                  ✉️ Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-blue-400">
            <h3 className="font-black text-lg mb-4 text-blue-600">Follow Us!</h3>
            <div className="flex flex-col space-y-3">
              <a
                href="https://facebook.com/creativecoloringpages"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full transition-colors transform hover:scale-105"
              >
                <Facebook className="h-6 w-6" />
                <span>Facebook</span>
              </a>
              <a
                href="https://instagram.com/creativecoloringpages"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-full transition-colors transform hover:scale-105"
              >
                <Instagram className="h-6 w-6" />
                <span>Instagram</span>
              </a>
              <a
                href="https://tiktok.com/@creativecoloringpages"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-full transition-colors transform hover:scale-105"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0011.14-4.02v-6.95a8.16 8.16 0 004.65 1.46v-3.4a4.84 4.84 0 01-1.2-.5z"/>
                </svg>
                <span>TikTok</span>
              </a>
              <a
                href="https://pinterest.com/creativecoloringpages"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-full transition-colors transform hover:scale-105"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.690 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.350-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                </svg>
                <span>Pinterest</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 text-center">
          <div className="bg-white rounded-2xl p-4 inline-block shadow-lg border-4 border-yellow-400">
            <p className="text-sm font-black text-gray-800">
              © {currentYear} Creative Coloring Pages (CCP). Made with ❤️ for Kids!
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}