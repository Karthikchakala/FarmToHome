import React, { useState } from 'react';
import api from '../../utils/api';
import { DollarSign, ShieldCheck } from 'lucide-react';

const PriceControlPage = () => {
  const [category, setCategory] = useState('Vegetables');
  const [minPrice, setMinPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleApply = async (e) => {
    e.preventDefault();
    if (!minPrice || Number(minPrice) < 0) return;

    setIsLoading(true);
    setMessage('');
    try {
      const res = await api.put('/admin/products/min-price', { category, minPrice: Number(minPrice) });
      setMessage(`Success: Enforced minimum price of ₹${minPrice} for ${category}. ${res.data.data.affectedProducts} products updated.`);
      setMinPrice('');
    } catch (_err) {
      setMessage('Error updating minimum price.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 w-full max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Price Control</h1>
        <p className="text-gray-500 mt-1">Set minimum prices per category to prevent unfair market practices.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6 text-blue-800 bg-blue-50 p-4 rounded-lg">
          <ShieldCheck className="w-6 h-6 flex-shrink-0" />
          <p className="text-sm">
            Applying a minimum price rule will immediately update any existing active products in the selected category that are listed below the new minimum threshold.
          </p>
        </div>

        <form onSubmit={handleApply} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Dairy">Dairy</option>
                <option value="Grains">Grains & Cereals</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Price (₹)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="e.g. 50.00"
                  required
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-green-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className={`text-sm font-medium ${message.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </span>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors font-semibold flex items-center gap-2 disabled:opacity-70"
            >
              {isLoading ? 'Processing...' : 'Enforce Minimum Price'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PriceControlPage;
