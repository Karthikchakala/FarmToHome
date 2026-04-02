import React from 'react';
import { Clock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

const ProductStatusIndicator = ({ product, isFarmer = false }) => {
  const isExpired = product.shelf_life_expiry && new Date(product.shelf_life_expiry) < new Date();
  const isNearExpiry = product.shelf_life_expiry && !isExpired;
  
  if (isNearExpiry) {
    const daysUntilExpiry = Math.ceil((new Date(product.shelf_life_expiry) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 2) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
          <AlertTriangle size={14} />
          <span>Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</span>
        </div>
      );
    }
    
    if (daysUntilExpiry <= 7) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
          <Clock size={14} />
          <span>Expires in {daysUntilExpiry} days</span>
        </div>
      );
    }
  }

  if (isExpired) {
    if (isFarmer) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
          <EyeOff size={14} />
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
        <EyeOff size={14} />
        <span>Unavailable</span>
      </div>
    );
  }

  if (product.stockquantity <= 0) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
        <AlertTriangle size={14} />
        <span>Out of Stock</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
      <CheckCircle size={14} />
      <span>Available</span>
    </div>
  );
};

export default ProductStatusIndicator;
