import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import agriToolsAPI from '../services/agriToolsAPI';

const CropMonetizer = () => {
  const [selectedCrop, setSelectedCrop] = useState('');
  const [quantity, setQuantity] = useState(1000);
  const [storageCostPerDay, setStorageCostPerDay] = useState(1);
  const [cropOptions, setCropOptions] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCrops = async () => {
      try {
        const response = await agriToolsAPI.getMonetizerCrops();
        if (response.data.success) {
          const crops = response.data.data.crops || [];
          setCropOptions(crops);
          if (crops[0]) setSelectedCrop(crops[0].key);
        }
      } catch (error) {
        toast.error('Failed to load crop catalog');
      }
    };

    loadCrops();
  }, []);

  useEffect(() => {
    if (!selectedCrop) return;

    const loadInsights = async () => {
      try {
        const response = await agriToolsAPI.getMarketInsights(selectedCrop);
        if (response.data.success) {
          setInsights(response.data.data);
        }
      } catch (error) {
        setInsights(null);
      }
    };

    loadInsights();
  }, [selectedCrop]);

  const getForecast = async () => {
    if (!selectedCrop) {
      toast.error('Please select a crop');
      return;
    }

    setLoading(true);
    try {
      const response = await agriToolsAPI.getMonetizerForecast({
        cropType: selectedCrop,
        days: 14,
        quantity,
        storageCostPerDay
      });

      if (response.data.success) {
        setForecast(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to get forecast');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to get forecast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showSidebar>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Crop Monetizer</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Crop</label>
              <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)} className="w-full p-3 border rounded-lg">
                {cropOptions.map((crop) => (
                  <option key={crop.key} value={crop.key}>{crop.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (kg)</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full p-3 border rounded-lg" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Storage Cost / kg / day</label>
              <input type="number" value={storageCostPerDay} onChange={(e) => setStorageCostPerDay(Number(e.target.value))} className="w-full p-3 border rounded-lg" min="0" step="0.1" />
            </div>
          </div>

          <button onClick={getForecast} disabled={loading} className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
            {loading ? 'Analyzing...' : 'Analyze Selling Strategy'}
          </button>
        </div>

        {insights && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Market Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 text-sm text-gray-700">
              <div><strong>Trend:</strong> {insights.trend}</div>
              <div><strong>Volatility:</strong> {insights.volatility}</div>
              <div><strong>Active stock:</strong> {insights.activeStock}</div>
            </div>
            <p className="mt-3 text-sm text-gray-600">{insights.recommendation}</p>
          </div>
        )}

        {forecast && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">14-Day Price Forecast</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Current Price</h3>
                <p className="text-3xl font-bold text-green-600">Rs {forecast.current_price.toLocaleString()}</p>
                <p className="text-sm text-gray-600">per ton equivalent</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Projected Price</h3>
                <p className="text-3xl font-bold text-blue-600">Rs {forecast.projected_price.toLocaleString()}</p>
                <p className="text-sm text-gray-600">in 14 days</p>
              </div>
            </div>

            <div className={`p-4 rounded-lg mb-6 ${forecast.recommendation === 'hold' ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="font-semibold text-gray-900">
                Recommendation: {forecast.recommendation === 'hold' ? 'HOLD' : 'SELL'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Current revenue: Rs {forecast.current_revenue.toLocaleString()} | Future revenue after storage: Rs {forecast.future_revenue.toLocaleString()}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Day</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Price</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.forecasts.map((day) => (
                    <tr key={day.day} className="border-t">
                      <td className="px-4 py-2 text-sm text-gray-900">{day.day}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">Rs {day.price.toLocaleString()}</td>
                      <td className={`px-4 py-2 text-sm ${day.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {day.change >= 0 ? '+' : ''}{day.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CropMonetizer;
