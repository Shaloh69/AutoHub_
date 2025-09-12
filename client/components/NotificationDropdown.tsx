"use client";

import { useState, useEffect } from 'react';
import { Button } from "@heroui/button";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Badge } from "@heroui/badge";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { apiService, Notification } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationDropdown() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadNotifications();
    }
  }, [isAuthenticated]);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await apiService.getUnreadNotifications();
      if (response.success && response.data) {
        setNotifications(response.data);
        setUnreadCount(response.data.length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchAllNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      if (!notifications.find(n => n.id === notificationId)?.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleDropdownChange = (open: boolean) => {
    setIsOpen(open);
    if (open && notifications.length === 0) {
      fetchAllNotifications();
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'SUCCESS': return 'success';
      case 'WARNING': return 'warning';
      case 'ERROR': return 'danger';
      default: return 'primary';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dropdown 
      isOpen={isOpen} 
      onOpenChange={handleDropdownChange}
      placement="bottom-end"
    >
      <DropdownTrigger>
        <Button isIconOnly variant="light" size="sm">
          <Badge 
            color="danger" 
            content={unreadCount > 0 ? unreadCount : ""} 
            isInvisible={unreadCount === 0}
            shape="circle"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </Badge>
        </Button>
      </DropdownTrigger>
      <DropdownMenu 
        aria-label="Notifications"
        className="w-80 max-h-96 overflow-y-auto"
        closeOnSelect={false}
      >
        <DropdownItem key="header" className="cursor-default" textValue="header">
          <div className="flex justify-between items-center py-2">
            <h4 className="font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Button size="sm" variant="light" onPress={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
        </DropdownItem>
        
        {loading ? (
          <DropdownItem key="loading" className="cursor-default" textValue="loading">
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          </DropdownItem>
        ) : notifications.length === 0 ? (
          <DropdownItem key="empty" className="cursor-default" textValue="empty">
            <div className="text-center py-4 text-default-500">
              No notifications
            </div>
          </DropdownItem>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <DropdownItem 
              key={notification.id} 
              className="cursor-default p-3"
              textValue={notification.title}
            >
              <div 
                className={`relative p-2 rounded-lg transition-colors ${
                  !notification.isRead ? 'bg-primary-50 dark:bg-primary-950' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h5 className="font-medium text-sm">{notification.title}</h5>
                  <div className="flex items-center gap-1 ml-2">
                    <Chip 
                      size="sm" 
                      color={getNotificationColor(notification.type)}
                      variant="dot"
                    />
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        isIconOnly
                        variant="light"
                        onPress={() => markAsRead(notification.id)}
                        className="w-6 h-6 min-w-6"
                      >
                        ✓
                      </Button>
                    )}
                    <Button
                      size="sm"
                      isIconOnly
                      variant="light"
                      color="danger"
                      onPress={() => deleteNotification(notification.id)}
                      className="w-6 h-6 min-w-6"
                    >
                      ×
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-default-600 line-clamp-2">
                  {notification.message}
                </p>
                <p className="text-xs text-default-500 mt-1">
                  {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </DropdownItem>
          ))
        )}
        
        {notifications.length > 10 && (
          <DropdownItem key="viewAll" textValue="View all">
            <Button 
              variant="light" 
              size="sm" 
              className="w-full"
              onPress={() => window.location.href = '/notifications'}
            >
              View All Notifications
            </Button>
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}