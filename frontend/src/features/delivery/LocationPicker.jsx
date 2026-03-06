import React, { useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

const LocationPicker = ({ onLocationSelect, initialLocation }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [coords, setCoords] = useState(initialLocation || null);

    const handleAutoDetect = () => {
        setLoading(true);
        setError(null);
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const payload = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    isAutoDetected: true
                };
                setCoords(payload);
                if (onLocationSelect) onLocationSelect(payload);
                setLoading(false);
            },
            (_err) => {
                setError('Failed to detect location. Please try manually or check permissions.');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="text-green-600" size={20} />
                        Delivery Location
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Determine where you want your fresh farm goods delivered.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Auto Detect Button */}
                <button
                    onClick={handleAutoDetect}
                    disabled={loading}
                    className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-green-200 rounded-xl bg-green-50/50 hover:bg-green-50 transition-colors group cursor-pointer"
                >
                    {loading ? (
                        <Loader2 className="animate-spin text-green-600 mb-2" size={32} />
                    ) : (
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Navigation className="text-green-600" size={24} />
                        </div>
                    )}
                    <span className="font-semibold text-green-800">
                        {loading ? 'Detecting Location...' : 'Use Current Location'}
                    </span>
                    <span className="text-xs text-green-600/70 mt-1">Faster & more accurate</span>
                </button>

                {/* Manual Info display */}
                <div className="flex flex-col justify-center p-6 border border-gray-100 rounded-xl bg-gray-50">
                    {coords ? (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 mb-3">
                                <MapPin size={20} />
                            </div>
                            <p className="font-semibold text-gray-900 mb-1">Location Locked</p>
                            <div className="text-xs font-mono text-gray-500 bg-white border border-gray-200 py-1.5 px-3 rounded-lg inline-block">
                                {coords.latitude.toFixed(4)}°, {coords.longitude.toFixed(4)}°
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <MapPin className="mx-auto mb-2 opacity-50" size={24} />
                            <p className="text-sm">Location not set yet</p>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                    {error}
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
