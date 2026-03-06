import React, { useState } from 'react';
import api from '../../../utils/api';
import { Plus, Trash2, ChevronDown } from 'lucide-react';

const FREQUENCIES = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Every 2 Weeks' },
    { value: 'monthly', label: 'Monthly' },
];

const SubscriptionForm = ({ onSubmit, isLoading, error }) => {
    const [farmerId, setFarmerId] = useState('');
    const [farmers, setFarmers] = useState([]);
    const [products, setProducts] = useState([]);
    const [items, setItems] = useState([{ productId: '', quantity: 1 }]);
    const [frequency, setFrequency] = useState('weekly');
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [loadingFarmers, setLoadingFarmers] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Fetch farmers when component mounts
    React.useEffect(() => {
        setLoadingFarmers(true);
        api.get('/home/farmers').then(r => setFarmers(r.data.data || [])).catch(() => { }).finally(() => setLoadingFarmers(false));
    }, []);

    // Fetch products when farmer changes
    React.useEffect(() => {
        if (!farmerId) { setProducts([]); return; }
        setLoadingProducts(true);
        api.get(`/products?farmerId=${farmerId}`).then(r => setProducts(r.data.data || r.data.products || [])).catch(() => { }).finally(() => setLoadingProducts(false));
    }, [farmerId]);

    const addItem = () => setItems([...items, { productId: '', quantity: 1 }]);
    const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
    const updateItem = (idx, field, value) => {
        const updated = [...items];
        updated[idx] = { ...updated[idx], [field]: value };
        setItems(updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validItems = items.filter(i => i.productId && i.quantity > 0);
        if (!farmerId || validItems.length === 0) return;
        onSubmit({ farmerId, products: validItems.map(i => ({ productId: i.productId, quantity: Number(i.quantity) })), frequency, startDate });
    };

    const minDate = new Date().toISOString().split('T')[0];

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Farmer Selection */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Farmer</label>
                <div className="relative">
                    <select
                        value={farmerId} onChange={e => setFarmerId(e.target.value)} required
                        className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 pr-10 bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                    >
                        <option value="">{loadingFarmers ? 'Loading farmers...' : '— Select a farmer —'}</option>
                        {farmers.map(f => (
                            <option key={f.id} value={f.id}>{f.farm_name} ({f.full_name})</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Products */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-semibold text-gray-700">Products</label>
                    <button type="button" onClick={addItem} className="flex items-center gap-1 text-green-600 text-sm font-medium hover:text-green-800">
                        <Plus size={16} /> Add product
                    </button>
                </div>
                <div className="space-y-3">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                            <div className="relative flex-1">
                                <select
                                    value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} required
                                    className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 pr-10 bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    disabled={!farmerId}
                                >
                                    <option value="">{!farmerId ? 'Select a farmer first' : loadingProducts ? 'Loading...' : '— Choose product —'}</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.unit}) — ₹{p.price}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                            <input
                                type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                placeholder="Qty" required
                                className="w-20 border border-gray-300 rounded-xl px-3 py-3 text-center focus:ring-2 focus:ring-green-500 focus:outline-none"
                            />
                            {items.length > 1 && (
                                <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Frequency & Start Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Frequency</label>
                    <div className="grid grid-cols-2 gap-2">
                        {FREQUENCIES.map(f => (
                            <button key={f.value} type="button"
                                onClick={() => setFrequency(f.value)}
                                className={`border rounded-xl py-3 text-sm font-medium transition-all ${frequency === f.value
                                        ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                                        : 'border-gray-200 text-gray-600 hover:border-green-300'
                                    }`}>{f.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                    <input
                        type="date" value={startDate} min={minDate} onChange={e => setStartDate(e.target.value)} required
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Preview box */}
            {farmerId && items.some(i => i.productId) && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                    📦 Starting <strong>{startDate}</strong>, you'll receive your delivery <strong>{FREQUENCIES.find(f => f.value === frequency)?.label}</strong>.
                </div>
            )}

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button type="submit" disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.01] active:scale-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {isLoading ? 'Creating subscription...' : 'Confirm Subscription'}
            </button>
        </form>
    );
};

export default SubscriptionForm;
