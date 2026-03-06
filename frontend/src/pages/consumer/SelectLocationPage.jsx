import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLocation } from '../../features/delivery/userLocationSlice';
import LocationPicker from '../../features/delivery/LocationPicker';
import api from '../../utils/api';
import { Tractor, MapPin, ChevronRight, Loader2 } from 'lucide-react';

const SelectLocationPage = () => {
    const dispatch = useDispatch();
    const { latitude, longitude } = useSelector(s => s.userLocation || {});

    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLocationSelect = (coords) => {
        dispatch(setLocation(coords));
    };

    useEffect(() => {
        if (!latitude || !longitude) return;

        const fetchNearby = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get('/farmers/nearby', {
                    params: { latitude, longitude, radius: 20 }
                });
                setFarmers(res.data.data || []);
            } catch (_err) {
                setError('Failed to load nearby farms. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchNearby();
    }, [latitude, longitude]);

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
                    Fresh Food Near You
                </h1>
                <p className="text-lg text-gray-500">
                    Set your delivery location to discover local farmers delivering organically grown produce directly to your doorstep.
                </p>
            </div>

            <LocationPicker onLocationSelect={handleLocationSelect} initialLocation={latitude ? { latitude, longitude } : null} />

            {latitude && longitude && (
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Tractor className="text-green-600" /> Farmers Servicing Your Area
                        </h2>
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            {farmers.length} Found
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                            <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Scouting local farms...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 text-center">
                            {error}
                        </div>
                    ) : farmers.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="text-gray-400" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No farms nearby... yet!</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                We couldn't find any farmers delivering to your exact location radius. Try expanding your search area or check back soon as we grow!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {farmers.map((farm) => (
                                <div key={farm.id} className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all cursor-pointer flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-700 transition-colors">{farm.farm_name}</h3>
                                                <p className="text-sm text-gray-500">{farm.full_name}</p>
                                            </div>
                                            <span className="bg-gray-50 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg border border-gray-100">
                                                {farm.distance_km} km away
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4">{farm.bio || 'A local farm providing fresh goods.'}</p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex -space-x-1">
                                            <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-md">Fresh Veg</span>
                                            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md ml-2">Fruits</span>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-300 group-hover:text-green-600 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SelectLocationPage;
