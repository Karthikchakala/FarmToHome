import * as notificationService from './notifications.service.js';

export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await notificationService.getUserNotifications(userId);
        res.json({ success: true, data: notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const markNotificationRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        const updated = await notificationService.markAsRead(notificationId, userId);
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
