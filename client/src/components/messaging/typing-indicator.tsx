/**
 * Typing Indicator Component
 * 
 * Displays typing indicators for users who are currently typing.
 * Shows animated dots and user names with smooth transitions.
 * 
 * Features:
 * - Animated typing dots with CSS animations
 * - Multiple users typing support
 * - Smooth fade in/out transitions
 * - Responsive design for mobile and desktop
 * 
 * @module TypingIndicator
 */

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

interface TypingUser {
  userId: string;
  userType: 'freelancer' | 'client';
  userName: string;
  isTyping: boolean;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  currentUserType: 'freelancer' | 'client';
  className?: string;
}

export function TypingIndicator({ 
  typingUsers, 
  currentUserType, 
  className = '' 
}: TypingIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Filter out current user and only show others who are typing
  const otherUsersTyping = typingUsers.filter(
    user => user.isTyping && user.userType !== currentUserType
  );

  useEffect(() => {
    if (otherUsersTyping.length > 0) {
      setIsVisible(true);
    } else {
      // Delay hiding to avoid flicker
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [otherUsersTyping.length]);

  if (!isVisible || otherUsersTyping.length === 0) {
    return null;
  }

  const renderTypingMessage = () => {
    if (otherUsersTyping.length === 1) {
      const user = otherUsersTyping[0];
      const roleLabel = user.userType === 'freelancer' ? 'Freelancer' : 'Client';
      return (
        <span className="text-sm text-muted-foreground">
          <strong>{user.userName}</strong> ({roleLabel}) is typing
        </span>
      );
    } else if (otherUsersTyping.length === 2) {
      return (
        <span className="text-sm text-muted-foreground">
          <strong>{otherUsersTyping[0].userName}</strong> and <strong>{otherUsersTyping[1].userName}</strong> are typing
        </span>
      );
    } else {
      return (
        <span className="text-sm text-muted-foreground">
          <strong>{otherUsersTyping[0].userName}</strong> and {otherUsersTyping.length - 1} others are typing
        </span>
      );
    }
  };

  return (
    <div 
      className={`flex items-center space-x-2 py-2 px-3 rounded-lg bg-muted/50 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ${className}`}
      data-testid="typing-indicator"
    >
      <MessageCircle className="h-4 w-4 text-muted-foreground animate-pulse" />
      <div className="flex items-center space-x-1">
        {renderTypingMessage()}
        <div className="flex space-x-1 ml-2">
          <div 
            className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '1.5s' }}
          />
          <div 
            className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
            style={{ animationDelay: '150ms', animationDuration: '1.5s' }}
          />
          <div 
            className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
            style={{ animationDelay: '300ms', animationDuration: '1.5s' }}
          />
        </div>
      </div>
    </div>
  );
}