import "./globals.css";

// Brand-neutral root. Brand-specific markup lives in app/[brand]/layout.js
// (public site) and app/admin/layout.js (admin), so pages can be cached per brand.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
