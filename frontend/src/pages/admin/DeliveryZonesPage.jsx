import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDeliveryZones, createDeliveryZone, deleteDeliveryZone } from '../../features/delivery/deliveryZonesSlice';
import DeliveryZoneCard from '../../features/delivery/DeliveryZoneCard';
import LocationPicker from '../../features/delivery/LocationPicker';
import { Plus, Target, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const DeliveryZonesPage = () => {
    const dispatch = useDispatch();
    const { zones, status } = useSelector(s => s.deliveryZones || { zones: [], status: 'idle' });
    const [isCreating, setIsCreating] = useState(false);
    const [apiError, setApiError] = useState(null);

    // Form state
    const [farmers, setFarmers] = useState([]);
    const [zoneName, setZoneName] = useState('');
    const [selectedFarmer, setSelectedFarmer] = useState('');
    const [polygonPoints, setPolygonPoints] = useState([]);

    useEffect(() => {
        dispatch(fetchDeliveryZones());
        // Also fetch farmers for the dropdown
        api.get('/admin/farmers').then(res => setFarmers(res.data.data)).catch(console.error);
    }, [dispatch]);

    const handleToggleStatus = async (id, isActive) => {
        try {
            await api.put(`/admin/delivery-zones/${id}`, { isActive });
            dispatch(fetchDeliveryZones());
        } catch (_err) {
            alert('Failed to update zone status');
        }
    };

    const handleDelete = async (id) => {
        try {
            await dispatch(deleteDeliveryZone(id)).unwrap();
        } catch (_err) {
            alert('Failed to delete zone');
        }
    };

    const handleAddPoint = (coords) => {
        setPolygonPoints(prev => [...prev, coords]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (polygonPoints.length < 3) {
            setApiError('A zone polygon must have at least 3 points to form a boundary.');
            return;
        }

        setApiError(null);
        try {
            await dispatch(createDeliveryZone({
                farmerId: selectedFarmer,
                zoneName,
                zonePolygon: polygonPoints,
                isActive: true
            })).unwrap();

            setIsCreating(false);
            setZoneName('');
            setSelectedFarmer('');
            setPolygonPoints([]);
            dispatch(fetchDeliveryZones());
        } catch (err) {
            setApiError(err.message || 'Failed to create zone');
        }
    };

    return (
        <div className="p-8 w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Delivery Zones</h1>
                    <p className="text-gray-500 mt-1">Manage geographic service areas for farmers.</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
                    >
                        <Plus size={18} /> New Zone
                    </button>
                )}
            </div>

            {apiError && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">{apiError}</div>
            )}

            {isCreating && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Target className="text-indigo-600" /> Define New Service Area
                        </h3>
                        <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600 font-medium text-sm">Cancel</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                                <input
                                    type="text" required placeholder="Downtown Central"
                                    value={zoneName} onChange={e => setZoneName(e.target.value)}
                                    className="w-full border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Farmer</label>
                                <select
                                    required value={selectedFarmer} onChange={e => setSelectedFarmer(e.target.value)}
                                    className="w-full border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                >
                                    <option value="" disabled>Select a Farmer</option>
                                    {farmers.map(f => (
                                        <option key={f.id} value={f.id}>{f.farm_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50">
                            <h4 className="font-semibold text-gray-800 mb-2">Define Boundary Polygon</h4>
                            <p className="text-sm text-gray-500 mb-4">Click "Use Current Location" to add points to the boundary. You need at least 3 points.</p>

                            <LocationPicker onLocationSelect={handleAddPoint} />

                            {polygonPoints.length > 0 && (
                                <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Selected Points ({polygonPoints.length}):</p>
                                    <div className="flex flex-wrap gap-2">
                                        {polygonPoints.map((p, i) => (
                                            <span key={i} className="text-xs bg-indigo-50 text-indigo-700 font-mono px-2 py-1 rounded-md border border-indigo-100">
                                                P{i + 1}: {p.latitude.toFixed(3)}, {p.longitude.toFixed(3)}
                                            </span>
                                        ))}
                                    </div>
                                    {polygonPoints.length >= 3 && (
                                        <p className="text-xs text-green-600 font-medium mt-3 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                            Valid polygon created.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors">
                                Save Zone
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {status === 'loading' && !isCreating ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-green-500 animate-spin" /></div>
            ) : zones.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No delivery zones defined yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {zones.map(zone => (
                        <DeliveryZoneCard
                            key={zone.id}
                            zone={zone}
                            onToggleStatus={handleToggleStatus}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeliveryZonesPage;
