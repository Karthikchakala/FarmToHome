import React from 'react';

const STATUS_MAP = {
    active: { label: 'Active', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    paused: { label: 'Paused', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

const SubscriptionStatusBadge = ({ status }) => {
    const s = STATUS_MAP[status] || STATUS_MAP.paused;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
            {s.label}
        </span>
    );
};

export default SubscriptionStatusBadge;
