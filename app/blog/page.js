import Link from 'next/link';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';
import { getAllPublishedPosts, formatDate } from '@/lib/blog-db';

// Revalidate every 5 minutes — new posts appear quickly after admin publishes
export const revalidate = 300;

export const metadata = {
  title: 'Coloring Tips & Guides — Free Printable Coloring Pages Blog',
  description:
    'Explore our guides on free printable coloring pages for kids and adults. Tips on ocean animals, mandalas, dinosaurs, butterflies, Christmas themes, and more.',
};

export default async function BlogPage() {
  const posts = await getAllPublishedPosts();

  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 font-bold px-4 py-2 rounded-full mb-4 text-sm">
            <BookOpen className="h-4 w-4" />
            Coloring Tips &amp; Guides
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-800 mb-4">
            The Coloring Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tips, ideas, and free printable guides to make coloring more fun for
            kids and adults alike.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">✍️</div>
            <h2 className="text-2xl font-black text-gray-600 mb-2">No posts yet</h2>
            <p className="text-gray-500">Check back soon for tips and guides!</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <article className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-purple-300 h-full flex flex-col">
                  {/* Cover emoji banner */}
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center py-10 text-7xl">
                    {post.coverEmoji}
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(post.tags || []).slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h2 className="text-xl font-black text-gray-800 mb-3 leading-tight line-clamp-3">
                      {post.title}
                    </h2>

                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                      {post.description}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium border-t border-gray-100 pt-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </div>
                      <span>{formatDate(post.updatedAt || post.publishedAt)}</span>
                    </div>

                    <div className="mt-4 flex items-center gap-1 text-purple-600 font-bold text-sm">
                      Read Guide
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-10 text-white">
            <h2 className="text-3xl font-black mb-3">Ready to Start Coloring?</h2>
            <p className="text-lg font-medium opacity-90 mb-6">
              Browse thousands of free printable coloring pages — download and
              print instantly, no signup required.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white text-purple-700 font-black px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              Browse Free Coloring Pages
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
