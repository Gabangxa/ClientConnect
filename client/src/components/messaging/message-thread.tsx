/**
 * Message Thread Component
 * 
 * Unified messaging interface supporting threaded conversations
 * between freelancers and clients. Provides modern chat-like experience
 * with reply functionality, read status, and message management.
 * 
 * Features:
 * - Threaded message display with proper nesting
 * - Reply functionality with context
 * - Message status indicators (sent, delivered, read)
 * - Priority and type-based styling
 * - Inline message composer for replies
 * - Real-time read status updates
 * 
 * @module MessageThread
 */

import { useState } from "react";
import { format } from "date-fns";
import { Reply, MoreVertical, Clock, Check, CheckCheck, Paperclip, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MessageComposer } from "./message-composer";

interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  mimeType: string;
}

interface Message {
  id: string;
  content: string;
  senderName: string;
  senderType: 'freelancer' | 'client';
  messageType?: string;
  priority?: string;
  status?: string;
  parentMessageId?: string;
  threadId?: string;
  isRead?: boolean;
  createdAt: string;
  readAt?: string;
  editedAt?: string;
  attachments?: MessageAttachment[];
}

interface MessageThreadProps {
  messages: Message[];
  currentUserType: 'freelancer' | 'client';
  currentUserName?: string;
  onSendMessage: (data: {
    content: string;
    parentMessageId?: string;
    threadId?: string;
    messageType?: string;
    priority?: string;
    attachments?: File[];
  }) => void;
  onMarkAsRead?: (messageId: string) => void;
  isLoading?: boolean;
  shareToken?: string; // For client portal access
}

export function MessageThread({ 
  messages, 
  currentUserType, 
  currentUserName,
  onSendMessage, 
  onMarkAsRead,
  isLoading = false,
  shareToken
}: MessageThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAttachmentDownload = async (attachment: MessageAttachment) => {
    try {
      const downloadUrl = shareToken 
        ? `/api/client/${shareToken}/messages/attachments/${attachment.id}/download`
        : `/api/messages/attachments/${attachment.id}/download`;
      
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };
  
  const getMessageStatusIcon = (message: Message) => {
    if (message.senderType === currentUserType) {
      // Only show status for messages we sent
      switch (message.status) {
        case 'sent':
          return <Check className="h-3 w-3 text-muted-foreground" />;
        case 'delivered':
          return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
        case 'read':
          return <CheckCheck className="h-3 w-3 text-blue-500" />;
        default:
          return <Clock className="h-3 w-3 text-muted-foreground" />;
      }
    }
    return null;
  };

  const getRepliesForMessage = (messageId: string) => {
    return messages.filter(msg => msg.parentMessageId === messageId);
  };

  const getTopLevelMessages = () => {
    return messages.filter(msg => !msg.parentMessageId);
  };

  const renderMessage = (message: Message, isReply = false) => {
    const isFromCurrentUser = message.senderType === currentUserType;
    const replies = getRepliesForMessage(message.id);
    const priorityColor = message.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900' :
                         message.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900' : '';

    return (
      <div key={message.id} className={`${isReply ? 'ml-6 mt-2' : ''}`}>
        <div className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} space-x-3 mb-2`}>
          {!isFromCurrentUser && (
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">
              {message.senderName[0].toUpperCase()}
            </div>
          )}
          
          <div className={`max-w-[75%] ${isFromCurrentUser ? 'order-2' : ''}`}>
            <div className={`flex items-center space-x-2 mb-1 text-xs ${isFromCurrentUser ? 'justify-end' : ''}`}>
              <span className="font-medium">{message.senderName}</span>
              <Badge variant={isFromCurrentUser ? "default" : "secondary"} className="text-xs">
                {message.senderType === 'freelancer' ? 'Provider' : 'Client'}
              </Badge>
              <span className="text-muted-foreground">
                {format(new Date(message.createdAt), 'MMM dd, h:mm a')}
              </span>
              {message.editedAt && (
                <span className="text-muted-foreground italic">edited</span>
              )}
            </div>
            
            <div className={`rounded-2xl p-3 relative ${priorityColor} ${
              isFromCurrentUser 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-foreground'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* Message Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.attachments.map((attachment, index) => (
                    <div
                      key={attachment.id}
                      className={`flex items-center justify-between p-2 rounded border ${
                        isFromCurrentUser 
                          ? 'bg-primary-foreground/10 border-primary-foreground/20' 
                          : 'bg-background/50 border-border/50'
                      }`}
                      data-testid={`message-attachment-${index}`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <Paperclip className={`h-4 w-4 flex-shrink-0 ${
                          isFromCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`} />
                        <div className="min-w-0">
                          <div className={`text-sm font-medium truncate ${
                            isFromCurrentUser ? 'text-primary-foreground' : 'text-foreground'
                          }`}>
                            {attachment.fileName}
                          </div>
                          <div className={`text-xs ${
                            isFromCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {formatFileSize(attachment.fileSize)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAttachmentDownload(attachment)}
                        className={`h-8 w-8 p-0 flex-shrink-0 ${
                          isFromCurrentUser 
                            ? 'hover:bg-primary-foreground/10 text-primary-foreground/70 hover:text-primary-foreground' 
                            : 'hover:bg-background/50 text-muted-foreground hover:text-foreground'
                        }`}
                        data-testid={`button-download-attachment-${index}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className={`flex items-center justify-between mt-2 ${isFromCurrentUser ? 'flex-row-reverse' : ''}`}>
                <div className="flex items-center space-x-1">
                  {getMessageStatusIcon(message)}
                  {message.priority !== 'normal' && (
                    <Badge variant="outline" className="text-xs">
                      {message.priority}
                    </Badge>
                  )}
                </div>
                
                {!isFromCurrentUser && (
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReplyingTo(replyingTo === message.id ? null : message.id)}
                      className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-70 hover:opacity-100">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onMarkAsRead && !message.isRead && (
                          <DropdownMenuItem onClick={() => onMarkAsRead(message.id)}>
                            Mark as Read
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>Copy</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>
            
            {/* Reply Form */}
            {replyingTo === message.id && (
              <div className="mt-3">
                <MessageComposer
                  onSend={(content: string, priority?: string, attachments?: File[]) => {
                    onSendMessage({
                      content,
                      parentMessageId: message.id,
                      threadId: message.threadId,
                      priority: priority || 'normal',
                      attachments
                    });
                    setReplyingTo(null);
                  }}
                  onCancel={() => setReplyingTo(null)}
                  placeholder={`Reply to ${message.senderName}...`}
                  isReply={true}
                  isLoading={isLoading}
                  allowAttachments={true}
                  maxAttachments={3}
                />
              </div>
            )}
          </div>
          
          {isFromCurrentUser && (
            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0 text-sm font-medium">
              {message.senderName[0].toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Render Replies */}
        {replies.length > 0 && (
          <div className="space-y-2">
            {replies.map(reply => renderMessage(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {getTopLevelMessages().length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground mt-1">Start the conversation below</p>
        </div>
      ) : (
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {getTopLevelMessages().map(message => renderMessage(message))}
        </div>
      )}
      
      {/* Main Message Composer */}
      <MessageComposer
        onSend={(content: string, priority?: string, attachments?: File[]) => {
          onSendMessage({
            content,
            priority: priority || 'normal',
            attachments
          });
        }}
        placeholder="Type your message..."
        isLoading={isLoading}
        allowAttachments={true}
        maxAttachments={5}
      />
    </div>
  );
}