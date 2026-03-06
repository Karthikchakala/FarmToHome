import React from 'react';
import { Map, Trash2, Power, Navigation2 } from 'lucide-react';

const DeliveryZoneCard = ({ zone, onToggleStatus, onDelete }) => {
    const { id, zone_name, is_active, polygon, farm_name } = zone;

    const getPointsCount = () => {
        if (!polygon || !polygon.length) return 0;
        return polygon.length;
    };

    return (
        <div className={`bg-white rounded-2xl border transition-all ${is_active ? 'border-green-200 shadow-md' : 'border-gray-200 shadow-sm opacity-75'}`}>
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{zone_name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Assigned to: <span className="font-semibold text-gray-700">{farm_name}</span></p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl mb-6">
                    <Map size={16} className="text-indigo-500" />
                    <span>Defined by a custom polygon with <strong>{getPointsCount()} boundary points</strong>.</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button
                        onClick={() => onToggleStatus(id, !is_active)}
                        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${is_active ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'}`}
                    >
                        <Power size={16} /> {is_active ? 'Deactivate Zone' : 'Activate Zone'}
                    </button>

                    <button
                        onClick={() => { if (window.confirm('Delete this delivery zone?')) onDelete(id); }}
                        className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                    >
                        <Trash2 size={16} /> Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeliveryZoneCard;
