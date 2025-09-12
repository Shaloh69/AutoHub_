"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { DeleteIcon } from "@/components/icons";
import { apiService, Notification } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getNotifications();
      
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
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
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
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
    router.push('/auth/login');
    return null;
  }

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Notifications</h1>
          <p className="text-lg text-default-600">
            {unreadNotifications.length} unread, {notifications.length} total
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button color="primary" variant="bordered" onPress={markAllAsRead}>
            Mark All Read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-danger text-lg mb-4">Error: {error}</p>
          <Button color="primary" onPress={fetchNotifications}>
            Try Again
          </Button>
        </div>
      ) : (
        <Tabs aria-label="Notification tabs" color="primary">
          <Tab 
            key="unread" 
            title={`Unread (${unreadNotifications.length})`}
          >
            <div className="space-y-3">
              {unreadNotifications.length === 0 ? (
                <Card>
                  <CardBody className="text-center py-8">
                    <p className="text-default-600">No unread notifications</p>
                  </CardBody>
                </Card>
              ) : (
                unreadNotifications.map((notification) => (
                  <Card key={notification.id} className="bg-primary-50 dark:bg-primary-950">
                    <CardBody>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{notification.title}</h3>
                            <Chip 
                              size="sm" 
                              color={getNotificationColor(notification.type)}
                              variant="dot"
                            />
                          </div>
                          <p className="text-default-700 mb-2">{notification.message}</p>
                          <p className="text-xs text-default-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-4">
                          <Button
                            size="sm"
                            color="primary"
                            variant="light"
                            onPress={() => markAsRead(notification.id)}
                          >
                            Mark Read
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            isIconOnly
                            onPress={() => deleteNotification(notification.id)}
                          >
                            <DeleteIcon />
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          </Tab>
          
          <Tab 
            key="all" 
            title={`All (${notifications.length})`}
          >
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <Card>
                  <CardBody className="text-center py-8">
                    <p className="text-default-600">No notifications</p>
                  </CardBody>
                </Card>
              ) : (
                notifications.map((notification) => (
                  <Card 
                    key={notification.id}
                    className={!notification.isRead ? "bg-primary-50 dark:bg-primary-950" : ""}
                  >
                    <CardBody>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{notification.title}</h3>
                            <Chip 
                              size="sm" 
                              color={getNotificationColor(notification.type)}
                              variant="dot"
                            />
                            {!notification.isRead && (
                              <Chip size="sm" color="primary">Unread</Chip>
                            )}
                          </div>
                          <p className="text-default-700 mb-2">{notification.message}</p>
                          <p className="text-xs text-default-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-4">
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              color="primary"
                              variant="light"
                              onPress={() => markAsRead(notification.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            isIconOnly
                            onPress={() => deleteNotification(notification.id)}
                          >
                            <DeleteIcon />
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          </Tab>
        </Tabs>
      )}
    </div>
  );
}