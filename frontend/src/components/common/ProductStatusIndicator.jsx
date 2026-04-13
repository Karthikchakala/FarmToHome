import React from 'react';

const Icon = ({ children, className = '' }) => (
  <span className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
    {children}
  </span>
);

const ProductStatusIndicator = ({ product, isFarmer = false }) => {
  const isExpired = product.shelf_life_expiry && new Date(product.shelf_life_expiry) < new Date();
  const isNearExpiry = product.shelf_life_expiry && !isExpired;
  
  if (isNearExpiry) {
    const daysUntilExpiry = Math.ceil((new Date(product.shelf_life_expiry) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 2) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
          <Icon className="w-3.5 h-3.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
              <path d="M10.3 4.3 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </Icon>
          <span>Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</span>
        </div>
      );
    }
    
    if (daysUntilExpiry <= 7) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
          <Icon className="w-3.5 h-3.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </Icon>
          <span>Expires in {daysUntilExpiry} days</span>
        </div>
      );
    }
  }

  if (isExpired) {
    if (isFarmer) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
          <Icon className="w-3.5 h-3.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
              <path d="M9.9 5.1A10.9 10.9 0 0 1 12 5c5.5 0 9.5 5 10 7-.3.6-1 1.8-2.1 3.1" />
              <path d="M6.1 6.1C3.8 7.7 2.5 9.8 2 12c.5 2.2 3.2 7 10 7 1 0 2-.1 3-.4" />
            </svg>
          </Icon>
          <span>Hidden from customers</span>
        </div>
      );
    } else {
      // This shouldn't be shown to customers as expired products are filtered out
      return null;
    }
  }

  if (!product.isavailable) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
        <Icon className="w-3.5 h-3.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
            <path d="M9.9 5.1A10.9 10.9 0 0 1 12 5c5.5 0 9.5 5 10 7-.3.6-1 1.8-2.1 3.1" />
            <path d="M6.1 6.1C3.8 7.7 2.5 9.8 2 12c.5 2.2 3.2 7 10 7 1 0 2-.1 3-.4" />
          </svg>
        </Icon>
        <span>Unavailable</span>
      </div>
    );
  }

  if (product.stockquantity <= 0) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
        <Icon className="w-3.5 h-3.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
            <path d="M10.3 4.3 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </Icon>
        <span>Out of Stock</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
      <Icon className="w-3.5 h-3.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5 11 15l4.5-5" />
        </svg>
      </Icon>
      <span>Available</span>
    </div>
  );
};

export default ProductStatusIndicator;
