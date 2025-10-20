/**
 * Connection Status Component
 * 
 * Displays real-time connection status and user presence indicators.
 * Shows connection health, reconnection attempts, and online users.
 * 
 * Features:
 * - Real-time connection status with visual indicators
 * - Reconnection progress and attempt counters
 * - Online user presence with last seen timestamps
 * - Compact display with expandable details
 * - Responsive design for all screen sizes
 * 
 * @module ConnectionStatus
 */

import { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  CheckCircle 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { formatDistanceToNow } from 'date-fns';

interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
}

interface UserPresence {
  userId: string;
  userType: 'freelancer' | 'client';
  userName: string;
  projectId: string;
  lastSeen: Date;
  socketId: string;
}

interface ConnectionStatusProps {
  connectionStatus: ConnectionStatus;
  onlineUsers: UserPresence[];
  currentUserId?: string;
  className?: string;
  compact?: boolean;
}

export function ConnectionStatus({ 
  connectionStatus, 
  onlineUsers, 
  currentUserId,
  className = '',
  compact = false
}: ConnectionStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { isConnected, isReconnecting, lastConnected, reconnectAttempts } = connectionStatus;
  
  // Filter out current user from online users
  const otherUsers = onlineUsers.filter(user => user.userId !== currentUserId);
  
  const getStatusIcon = () => {
    if (isReconnecting) {
      return <AlertCircle className="h-4 w-4 text-yellow-500 animate-pulse" />;
    } else if (isConnected) {
      return <Wifi className="h-4 w-4 text-green-500" />;
    } else {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (isReconnecting) {
      return `Reconnecting... (${reconnectAttempts > 0 ? `attempt ${reconnectAttempts}` : 'trying'})`;
    } else if (isConnected) {
      return 'Connected';
    } else {
      return 'Disconnected';
    }
  };

  const getStatusColor = () => {
    if (isReconnecting) return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
    if (isConnected) return 'bg-green-500/10 text-green-700 border-green-500/20';
    return 'bg-red-500/10 text-red-700 border-red-500/20';
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {getStatusText()}
        </span>
        {otherUsers.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {otherUsers.length}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={`border rounded-lg bg-card ${className}`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-3 h-auto hover:bg-transparent"
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="font-medium text-sm">{getStatusText()}</span>
              </div>
              
              <Badge 
                variant="outline" 
                className={`text-xs ${getStatusColor()}`}
              >
                {isConnected ? 'Online' : 'Offline'}
              </Badge>
              
              {otherUsers.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {otherUsers.length} online
                </Badge>
              )}
            </div>
            
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="px-3 pb-3">
          <div className="space-y-3 pt-2 border-t">
            {/* Connection Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <div className="flex items-center space-x-1">
                  {isConnected ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-green-700">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-red-500" />
                      <span className="text-red-700">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
              
              {lastConnected && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last connected:</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-foreground">
                      {formatDistanceToNow(lastConnected, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              )}
              
              {reconnectAttempts > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reconnect attempts:</span>
                  <Badge variant="outline" className="text-xs">
                    {reconnectAttempts}
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Online Users */}
            {otherUsers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">
                  Online Users ({otherUsers.length})
                </h4>
                <div className="space-y-1">
                  {otherUsers.map((user) => (
                    <div
                      key={`${user.userId}-${user.userType}`}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm font-medium">{user.userName}</span>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                        >
                          {user.userType === 'freelancer' ? 'Provider' : 'Client'}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(user.lastSeen, { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* No other users online */}
            {otherUsers.length === 0 && isConnected && (
              <div className="text-center py-2">
                <Users className="h-8 w-8 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">
                  No other users online
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}