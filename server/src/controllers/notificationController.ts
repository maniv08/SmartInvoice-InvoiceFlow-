import { Response } from 'express';
import { Notification } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const notifications = await Notification.find({ user: req.userId })
    .sort({ createdAt: -1 })
    .limit(40);

  const unreadCount = await Notification.countDocuments({
    user: req.userId,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    notifications,
    unreadCount,
  });
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  await Notification.updateOne(
    { _id: id, user: req.userId },
    { isRead: true }
  );

  res.status(200).json({ success: true, message: 'Notification marked as read' });
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await Notification.updateMany(
    { user: req.userId, isRead: false },
    { isRead: true }
  );

  res.status(200).json({ success: true, message: 'All notifications marked as read' });
};

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  await Notification.deleteOne({ _id: id, user: req.userId });

  res.status(200).json({ success: true, message: 'Notification removed' });
};
