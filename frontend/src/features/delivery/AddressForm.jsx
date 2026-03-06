import React, { useState } from 'react';
import { Home } from 'lucide-react';

const AddressForm = ({ initialData, onSubmit, isSubmitting }) => {
    const [formData, setFormData] = useState({
        street: initialData?.street || '',
        city: initialData?.city || '',
        state: initialData?.state || '',
        postalCode: initialData?.postalCode || '',
    });

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Home size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Delivery Address</h3>
                    <p className="text-sm text-gray-500">Provide exact details for dropping off your order.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                        type="text"
                        name="street"
                        required
                        placeholder="123 Farm House Lane, Apt 4"
                        value={formData.street}
                        onChange={handleChange}
                        className="w-full border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-sm px-4 py-2.5"
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                            type="text"
                            name="city"
                            required
                            placeholder="Springfield"
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-sm px-4 py-2.5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                        <input
                            type="text"
                            name="state"
                            required
                            placeholder="IL"
                            value={formData.state}
                            onChange={handleChange}
                            className="w-full border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-sm px-4 py-2.5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                        <input
                            type="text"
                            name="postalCode"
                            required
                            placeholder="62704"
                            value={formData.postalCode}
                            onChange={handleChange}
                            className="w-full border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-sm px-4 py-2.5"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 focus:ring-4 focus:ring-gray-200 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                    {isSubmitting ? 'Saving...' : 'Save Address'}
                </button>
            </div>
        </form>
    );
};

export default AddressForm;
