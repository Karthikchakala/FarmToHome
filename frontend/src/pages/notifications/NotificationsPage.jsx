import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications } from '../../features/notifications/notificationsSlice';
import NotificationCard from '../../features/notifications/components/NotificationCard';
import { BellRing } from 'lucide-react';

const NotificationsPage = () => {
    const dispatch = useDispatch();
    const { items, status, unreadCount } = useSelector((state) => state.notifications || { items: [] });

    useEffect(() => {
        dispatch(fetchNotifications());
    }, [dispatch]);

    return (
        <div className="p-8 w-full max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <BellRing className="text-blue-500" /> Notifications
                    </h1>
                    <p className="text-gray-500 mt-1">Stay updated on your orders and alerts.</p>
                </div>
                {unreadCount > 0 && (
                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                        {unreadCount} Unread
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {status === 'loading' ? (
                    <div className="text-center p-8 text-gray-500">Loading your notifications...</div>
                ) : items.length > 0 ? (
                    items.map(notification => (
                        <NotificationCard key={notification.id} notification={notification} />
                    ))
                ) : (
                    <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <BellRing className="mx-auto text-gray-400 mb-3 w-8 h-8" />
                        <h3 className="text-gray-900 font-medium mb-1">No Notifications Yet</h3>
                        <p className="text-gray-500 text-sm">When you receive updates on orders or alerts, they'll show up here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
