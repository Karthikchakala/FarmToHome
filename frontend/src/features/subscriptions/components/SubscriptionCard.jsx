import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PauseCircle, PlayCircle, XCircle, Calendar, Package } from 'lucide-react';
import { pauseSubscription, resumeSubscription, cancelSubscription } from '../subscriptionsSlice';
import SubscriptionStatusBadge from './SubscriptionStatusBadge';

const FREQ_LABELS = {
    daily: 'Every day',
    weekly: 'Every week',
    biweekly: 'Every 2 weeks',
    monthly: 'Every month',
};

const SubscriptionCard = ({ subscription }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id, product_name, farm_name, quantity, unit, interval, next_delivery_date, status, image_url } = subscription;

    const handlePause = (e) => { e.stopPropagation(); dispatch(pauseSubscription(id)); };
    const handleResume = (e) => { e.stopPropagation(); dispatch(resumeSubscription(id)); };
    const handleCancel = (e) => {
        e.stopPropagation();
        if (window.confirm('Cancel this recurring subscription?')) dispatch(cancelSubscription(id));
    };

    return (
        <div
            onClick={() => navigate(`/subscriptions/${id}`)}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 cursor-pointer transition-all duration-200 overflow-hidden"
        >
            {/* Top stripe */}
            <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-500"></div>

            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {image_url
                                ? <img src={image_url} alt={product_name} className="w-full h-full object-cover" />
                                : <Package className="w-6 h-6 text-green-500" />
                            }
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-base leading-tight">{product_name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">from {farm_name}</p>
                        </div>
                    </div>
                    <SubscriptionStatusBadge status={status} />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Quantity</p>
                        <p className="text-sm font-semibold text-gray-800">{quantity} {unit}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Frequency</p>
                        <p className="text-sm font-semibold text-gray-800">{FREQ_LABELS[interval]}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 mb-5">
                    <Calendar className="w-3.5 h-3.5 text-green-500" />
                    <span>Next delivery: <strong className="text-gray-800">{new Date(next_delivery_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</strong></span>
                </div>

                {/* Actions */}
                {status !== 'cancelled' && (
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                        {status === 'active' ? (
                            <button onClick={handlePause}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                                <PauseCircle size={16} /> Pause
                            </button>
                        ) : (
                            <button onClick={handleResume}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                                <PlayCircle size={16} /> Resume
                            </button>
                        )}
                        <button onClick={handleCancel}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                            <XCircle size={16} /> Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionCard;
