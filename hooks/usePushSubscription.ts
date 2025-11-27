import { useState, useEffect } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function usePushSubscription() {
  const [permission, setPermission] = useState<PushPermissionStatus>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PushPermissionStatus);
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    if (!VAPID_PUBLIC_KEY) {
      console.error('VAPID_PUBLIC_KEY is missing');
      return false;
    }

    if (!('serviceWorker' in navigator)) return false;

    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      // Request permission if not granted
      let currentPermission = Notification.permission;
      if (currentPermission === 'default') {
          currentPermission = await Notification.requestPermission();
          setPermission(currentPermission as PushPermissionStatus);
      }

      if (currentPermission !== 'granted') {
          setIsSubscribing(false);
          return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Detect if PWA is installed (simple heuristic)
      const isPwaInstalled = window.matchMedia('(display-mode: standalone)').matches;

      // Send to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          isPwaInstalled
        }),
      });

      setIsSubscribing(false);
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      setIsSubscribing(false);
      return false;
    }
  };

  return {
    permission,
    subscribe,
    isSubscribing
  };
}
