import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Clock, CheckCircle2, AlertTriangle, FileText, CreditCard, Trash2 } from 'lucide-react';
import { Notification } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s poll
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      try {
        await api.put(`/notifications/${n._id}/read`);
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        // silent
      }
    }
    if (n.link) {
      setIsOpen(false);
      navigate(n.link);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success('Notification dismissed');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'APPROVAL_PENDING':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'APPROVED':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'REJECTED':
      case 'PAYMENT_OVERDUE':
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      case 'PAYMENT_COMPLETED':
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-indigo-500" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-extrabold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h4>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <Bell className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 opacity-50" />
              You're all caught up! No notifications.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3.5 flex items-start justify-between gap-3 text-xs cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  !n.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    {getIcon(n.type)}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-semibold text-slate-900 dark:text-white ${!n.isRead ? 'font-bold' : ''}`}>
                      {n.title}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(n._id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-600 text-slate-400 transition-opacity p-1"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
