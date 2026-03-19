'use client';

import { createContext, useContext } from 'react';

// Create brand context
const BrandContext = createContext(null);

// Provider component
export function BrandProvider({ brand, children }) {
  return (
    <BrandContext.Provider value={brand}>
      {children}
    </BrandContext.Provider>
  );
}

// Hook to use brand in client components
export function useBrand() {
  const brand = useContext(BrandContext);
  if (!brand) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return brand;
}

export default BrandProvider;
