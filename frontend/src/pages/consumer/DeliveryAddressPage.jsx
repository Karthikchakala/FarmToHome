import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { saveAddress } from '../../features/delivery/deliveryAddressSlice';
import LocationPicker from '../../features/delivery/LocationPicker';
import AddressForm from '../../features/delivery/AddressForm';

const DeliveryAddressPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Local state for the point
    const [coords, setCoords] = useState(null);
    const [apiError, setApiError] = useState(null);

    const { status } = useSelector(state => state.deliveryAddress || { status: 'idle' });
    const isSubmitting = status === 'loading';

    const handleAddressSubmit = async (addressData) => {
        if (!coords) {
            setApiError("Please detect or provide your location coordinates first.");
            return;
        }
        setApiError(null);

        const payload = { ...addressData, ...coords };

        try {
            await dispatch(saveAddress(payload)).unwrap();
            navigate('/cart'); // Or wherever they were going next
        } catch (err) {
            setApiError(err.message || 'Failed to save address');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-8">
            <div className="mb-10">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                    Add Delivery Details
                </h1>
                <p className="text-gray-500">
                    First pinpoint your location on the map, then provide the exact street address for the driver.
                </p>
            </div>

            {apiError && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center">
                    <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {apiError}
                </div>
            )}

            <div className="space-y-8">
                <LocationPicker onLocationSelect={setCoords} />

                <div className={`transition-opacity duration-300 ${coords ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Step 2: Details</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    <AddressForm onSubmit={handleAddressSubmit} isSubmitting={isSubmitting} />
                </div>
            </div>
        </div>
    );
};

export default DeliveryAddressPage;
