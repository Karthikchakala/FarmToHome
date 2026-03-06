import React from 'react';
import { Bell, Package, AlertCircle, CalendarClock } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { markAsRead } from '../notificationsSlice';

const NotificationCard = ({ notification }) => {
  const dispatch = useDispatch();

  const handleMarkRead = () => {
    if (!notification.is_read) {
      dispatch(markAsRead(notification.id));
    }
  };

  const getIcon = () => {
    switch (notification.title) {
      case 'Order Placed':
      case 'Order Status Update':
      case 'New Order':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'Low Stock':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div
      onClick={handleMarkRead}
      className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${notification.is_read
        ? 'bg-white border-gray-100 opacity-70'
        : 'bg-blue-50/50 border-blue-100 shadow-sm shadow-blue-50'
        }`}
    >
      <div className={`p-2 rounded-full ${notification.is_read ? 'bg-gray-100' : 'bg-blue-100'}`}>
        {getIcon()}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-1">
          <h4 className={`text-sm font-semibold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
            {notification.title}
          </h4>
          <div className="flex items-center text-xs text-gray-400 gap-1">
            <CalendarClock size={12} />
            <span>{new Date(notification.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <p className={`text-sm ${notification.is_read ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
          {notification.message}
        </p>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
      )}
    </div>
  );
};

export default NotificationCard;
