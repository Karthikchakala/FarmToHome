import React, { useState, useEffect } from 'react';

const ProductPricingGuide = ({ vegetableName, onPriceChange, currentPrice }) => {
  const [pricingInfo, setPricingInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  // Fetch pricing info when vegetable name changes
  useEffect(() => {
    if (vegetableName) {
      fetchPricingInfo();
    } else {
      setPricingInfo(null);
    }
  }, [vegetableName]);

  const fetchPricingInfo = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/cost-chart/pricing/${encodeURIComponent(vegetableName)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setPricingInfo(data.data.pricing);
      } else {
        setError(data.message || 'No pricing information available');
        setPricingInfo(null);
      }
    } catch (error) {
      setError('Error fetching pricing information');
      setPricingInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Validate price against range
  const validatePrice = (price) => {
    if (!pricingInfo) return { valid: true, message: '' };
    
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return { valid: true, message: '' };

    if (numPrice < pricingInfo.min_price) {
      return { 
        valid: false, 
        message: `Price cannot be less than ₹${pricingInfo.min_price} (10% below base price)` 
      };
    }

    if (numPrice > pricingInfo.max_price) {
      return { 
        valid: false, 
        message: `Price cannot be more than ₹${pricingInfo.max_price} (10% above base price)` 
      };
    }

    return { valid: true, message: 'Price is within allowed range' };
  };

  const priceValidation = currentPrice ? validatePrice(currentPrice) : { valid: true, message: '' };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-blue-700">Loading pricing information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-yellow-600 mt-0.5 mr-2">⚠️</span>
          <div>
            <p className="text-yellow-800 text-sm font-medium">No Pricing Constraints</p>
            <p className="text-yellow-700 text-xs mt-1">{error}</p>
            <p className="text-yellow-600 text-xs mt-2">You can set any price for this product.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pricingInfo) {
    return null;
  }

  // Calculate price percentage
  const getPricePercentage = () => {
    if (!currentPrice) return 0;
    const percentage = ((parseFloat(currentPrice) - pricingInfo.base_price) / pricingInfo.base_price) * 100;
    return Math.round(percentage);
  };

  const pricePercentage = getPricePercentage();
  const isAboveBase = pricePercentage > 0;
  const isBelowBase = pricePercentage < 0;

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          💰 Real-time Pricing Guide
        </h3>
        <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border">
          {vegetableName || 'Enter vegetable name'}
        </span>
      </div>

      {/* Base Price Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Base Price</p>
          <p className="text-lg font-bold text-gray-900">₹{pricingInfo.base_price}</p>
          <p className="text-xs text-gray-500">per {pricingInfo.unit}</p>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Minimum Price</p>
          <p className="text-lg font-bold text-green-600">₹{pricingInfo.min_price}</p>
          <p className="text-xs text-gray-500">(-10%)</p>
        </div>
        
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Maximum Price</p>
          <p className="text-lg font-bold text-red-600">₹{pricingInfo.max_price}</p>
          <p className="text-xs text-gray-500">(+10%)</p>
        </div>
      </div>

      {/* Current Price Status */}
      {currentPrice && (
        <div className={`p-3 rounded-lg mb-4 ${
          priceValidation.valid 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {priceValidation.valid ? (
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              ) : (
                <AlertCircle className="text-red-600 mr-2" size={16} />
              )}
              <div>
                <p className="text-sm font-medium">
                  Your Price: ₹{parseFloat(currentPrice).toFixed(2)}
                </p>
                <p className={`text-xs ${
                  priceValidation.valid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {priceValidation.message}
                </p>
              </div>
            </div>
            
            {priceValidation.valid && (
              <div className="flex items-center">
                {isAboveBase && (
                  <div className="flex items-center text-orange-600 text-sm">
                    <span className="mr-1">📈</span>
                    {Math.abs(pricePercentage)}% above base price
                  </div>
                )}
                {isBelowBase && (
                  <div className="flex items-center text-blue-600 text-sm">
                    <span className="mr-1">📉</span>
                    {Math.abs(pricePercentage)}% below base price
                  </div>
                )}
              </div>
            )}
            {pricePercentage === 0 && (
              <span className="text-sm text-gray-600">At base price</span>
            )}
          </div>
        </div>
      )}

      {/* Price Range Slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price Range Indicator
        </label>
        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-gradient-to-r from-red-400 via-green-400 to-red-400 rounded-full"
              style={{
                background: `linear-gradient(to right, 
                  #ef4444 0%, 
                  #ef4444 10%, 
                  #22c55e 10%, 
                  #22c55e 90%, 
                  #ef4444 90%, 
                  #ef4444 100%)`
              }}
            ></div>
          </div>
          
          {currentPrice && priceValidation.valid && (
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"
              style={{
                left: `${((parseFloat(currentPrice) - pricingInfo.min_price) / (pricingInfo.max_price - pricingInfo.min_price)) * 100}%`
              }}
            ></div>
          )}
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>₹{pricingInfo.min_price}</span>
          <span>₹{pricingInfo.base_price}</span>
          <span>₹{pricingInfo.max_price}</span>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Recommendation:</strong> Set your price competitively within the allowed range. 
          Consider factors like quality, freshness, and market demand when pricing your products.
        </p>
      </div>

      {/* Vegetable Info */}
      <div className="mt-3 text-xs text-gray-500">
        <p>Category: {pricingInfo.category || 'Uncategorized'}</p>
        <p>Unit: {pricingInfo.unit}</p>
      </div>
    </div>
  );
};

export default ProductPricingGuide;
