import React from 'react';
import { Sun, SunDim, Moon } from 'lucide-react';

const PRESET_SLOTS = [
    { id: 'morning', label: 'Morning', time: '6:00 AM - 10:00 AM', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'afternoon', label: 'Afternoon', time: '12:00 PM - 4:00 PM', icon: SunDim, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'evening', label: 'Evening', time: '5:00 PM - 8:00 PM', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50' }
];

const DeliverySlotSelector = ({ selectedSlots = [], onChange, mode = 'single' }) => {
    // mode = 'single' for consumer checkout (pick 1)
    // mode = 'multiple' for farmer setup (pick many)

    const handleToggle = (slotId) => {
        if (mode === 'single') {
            onChange([slotId]);
        } else {
            if (selectedSlots.includes(slotId)) {
                onChange(selectedSlots.filter(id => id !== slotId));
            } else {
                onChange([...selectedSlots, slotId]);
            }
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {PRESET_SLOTS.map((slot) => {
                const Icon = slot.icon;
                const isSelected = selectedSlots.includes(slot.id);

                return (
                    <div
                        key={slot.id}
                        onClick={() => handleToggle(slot.id)}
                        className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer group ${isSelected
                                ? 'border-green-500 bg-green-50/30 shadow-md'
                                : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                            }`}
                    >
                        <div className={`p-2.5 rounded-full inline-flex mb-3 ${slot.bg} ${slot.color} group-hover:scale-110 transition-transform`}>
                            <Icon size={24} />
                        </div>

                        <h4 className="font-bold text-gray-900 mb-0.5">{slot.label}</h4>
                        <p className="text-xs text-gray-500 font-medium">{slot.time}</p>

                        {isSelected && (
                            <div className="absolute top-4 right-4 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default DeliverySlotSelector;
