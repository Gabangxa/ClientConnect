import { useEffect, useRef } from 'react';

interface Message {
  id: string;
  senderType: 'freelancer' | 'client';
  senderName: string;
  content: string;
  createdAt?: string;
}

interface UseMessageNotificationsOptions {
  messages: Message[];
  currentUserType: 'freelancer' | 'client';
  enabled?: boolean;
}

export function useMessageNotifications({
  messages,
  currentUserType,
  enabled = true,
}: UseMessageNotificationsOptions) {
  const previousMessagesRef = useRef<Map<string, Message>>(new Map());
  const permissionRequestedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    if ('Notification' in window && !permissionRequestedRef.current) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
      permissionRequestedRef.current = true;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !messages || messages.length === 0) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const currentMessagesMap = new Map(messages.map(m => [m.id, m]));
    
    messages.forEach(message => {
      const isNewMessage = !previousMessagesRef.current.has(message.id);
      const isFromOtherUser = message.senderType !== currentUserType;
      
      if (isNewMessage && isFromOtherUser) {
        const senderLabel = message.senderType === 'freelancer' ? 'Freelancer' : 'Client';
        const notification = new Notification(`New message from ${message.senderName}`, {
          body: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
          icon: '/favicon.ico',
          tag: `message-${message.id}`,
          requireInteraction: false,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        setTimeout(() => notification.close(), 5000);
      }
    });

    previousMessagesRef.current = currentMessagesMap;
  }, [messages, currentUserType, enabled]);
}
