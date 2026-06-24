'use client';

import { createContext, useContext } from 'react';

// Default brand values to prevent errors during hydration
const defaultBrand = {
  domain: '',
  name: 'Creative Coloring Pages',
  shortName: 'CCP',
  tagline: 'Fun for Kids & Families!',
  description: '',
  logo: '',
  favicon: '',
  colors: {
    primary: 'purple',
    secondary: 'pink',
    accent: 'blue',
    headerBorder: 'yellow-400',
    gradient: 'from-blue-50 via-purple-50 to-pink-50'
  },
  contact: { email: '', supportEmail: '' },
  socialLinks: {},
  seo: { titleTemplate: '', defaultTitle: '', ogImage: '' }
};

// Create brand context with default value
const BrandContext = createContext(defaultBrand);

// Provider component
function BrandProvider({ brand, children }) {
  // Merge with defaults to ensure all properties exist
  const safeBrand = brand ? { ...defaultBrand, ...brand } : defaultBrand;
  
  return (
    <BrandContext.Provider value={safeBrand}>
      {children}
    </BrandContext.Provider>
  );
}

// Hook to use brand in client components
function useBrand() {
  const brand = useContext(BrandContext);
  // Return default brand if context is not available (during SSR/hydration)
  return brand || defaultBrand;
}

export { BrandProvider, useBrand };
export default BrandProvider;
