import React from 'react';
import './OrderTimeline.css';

const STAGES = [
    { key: 'PLACED', label: 'Order Placed' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PACKED', label: 'Packed' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' }
];

const OrderTimeline = ({ currentStatus }) => {
    // If cancelled, failed, disputed, we might not want to show the full happy timeline
    if (['CANCELLED', 'FAILED', 'DISPUTED'].includes(currentStatus)) {
        return (
            <div className="order-timeline error-timeline">
                <div className="timeline-error-message">
                    Order is currently marked as: <strong>{currentStatus.replace(/_/g, ' ')}</strong>
                </div>
            </div>
        );
    }

    // Determine current index in the happy path
    let currentIndex = STAGES.findIndex(s => s.key === currentStatus);
    if (currentStatus === 'COMPLETED') {
        currentIndex = STAGES.length; // all done
    }

    return (
        <div className="order-timeline">
            {STAGES.map((stage, index) => {
                const isCompleted = index <= currentIndex;
                const isCurrent = index === currentIndex;

                return (
                    <div
                        key={stage.key}
                        className={`timeline-stage ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                        <div className="stage-marker">
                            {isCompleted ? '✓' : ''}
                        </div>
                        <div className="stage-label">{stage.label}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default OrderTimeline;
