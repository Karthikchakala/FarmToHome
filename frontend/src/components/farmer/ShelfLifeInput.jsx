import React, { useState } from 'react';

const ShelfLifeInput = ({ value, onChange, disabled = false }) => {
  const [inputValue, setInputValue] = useState(value || '');

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const getShelfLifeInfo = () => {
    if (!inputValue || inputValue <= 0) return null;
    
    const days = parseInt(inputValue);
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + days);
    
    return {
      days,
      expiryDate,
      expiryDateFormatted: expiryDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    };
  };

  const shelfLifeInfo = getShelfLifeInfo();

  const getShelfLifeCategory = (days) => {
    if (days <= 3) return { label: 'Very Short', color: 'red' };
    if (days <= 7) return { label: 'Short', color: 'orange' };
    if (days <= 14) return { label: 'Medium', color: 'yellow' };
    if (days <= 30) return { label: 'Long', color: 'green' };
    return { label: 'Very Long', color: 'blue' };
  };

  const category = shelfLifeInfo ? getShelfLifeCategory(shelfLifeInfo.days) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-gray-500">⏰</span>
        <label className="block text-sm font-medium text-gray-700">
          Shelf Life (days)
        </label>
        <span className="text-xs text-gray-500">(Optional)</span>
      </div>

      <div className="relative">
        <input
          type="number"
          min="1"
          max="365"
          value={inputValue}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Enter number of days (e.g., 7)"
        />
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
          days
        </span>
      </div>

      {/* Shelf Life Information */}
      {shelfLifeInfo && (
        <div className={`p-3 rounded-lg border ${
          category.color === 'red' ? 'bg-red-50 border-red-200' :
          category.color === 'orange' ? 'bg-orange-50 border-orange-200' :
          category.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
          category.color === 'green' ? 'bg-green-50 border-green-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 ${
              category.color === 'red' ? 'text-red-600' :
              category.color === 'orange' ? 'text-orange-600' :
              category.color === 'yellow' ? 'text-yellow-600' :
              category.color === 'green' ? 'text-green-600' :
              'text-blue-600'
            }`}>📅</span>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${
                  category.color === 'red' ? 'text-red-800' :
                  category.color === 'orange' ? 'text-orange-800' :
                  category.color === 'yellow' ? 'text-yellow-800' :
                  category.color === 'green' ? 'text-green-800' :
                  'text-blue-800'
                }`}>
                  {category.label} Shelf Life
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  category.color === 'red' ? 'bg-red-100 text-red-700' :
                  category.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                  category.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                  category.color === 'green' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {shelfLifeInfo.days} days
                </span>
              </div>
              
              <p className={`text-xs ${
                category.color === 'red' ? 'text-red-700' :
                category.color === 'orange' ? 'text-orange-700' :
                category.color === 'yellow' ? 'text-yellow-700' :
                category.color === 'green' ? 'text-green-700' :
                'text-blue-700'
              }`}>
                Product will expire on: <strong>{shelfLifeInfo.expiryDateFormatted}</strong>
              </p>
              
              {category.color === 'red' && (
                <div className="flex items-start gap-1 mt-2">
                  <span className="text-red-600 mt-0.5">⚠️</span>
                  <p className="text-xs text-red-700">
                    Very short shelf life! Customers won't see this product after {shelfLifeInfo.days} days.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Shelf Life Guidelines:</h4>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>1-3 days: Leafy greens, fresh herbs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>4-7 days: Most vegetables, berries</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>8-14 days: Root vegetables, fruits</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>15-30 days: Potatoes, onions, apples</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>31+ days: Grains, dried goods</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> After the shelf life expires, this product will be hidden from customers but will remain visible to you in read-only mode.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShelfLifeInput;
