import { useState, useRef } from "react";
import { Send, AlertCircle, Flag, Zap, Paperclip, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MessageComposerProps {
  onSend: (content: string, priority?: string, attachments?: File[]) => void;
  onCancel?: () => void;
  placeholder?: string;
  isReply?: boolean;
  isLoading?: boolean;
  showPrioritySelector?: boolean;
  allowAttachments?: boolean;
  maxAttachments?: number;
}

export function MessageComposer({ 
  onSend, 
  onCancel,
  placeholder = "Type your message...",
  isReply = false,
  isLoading = false,
  showPrioritySelector = true,
  allowAttachments = true,
  maxAttachments = 5
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<string>("normal");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && attachments.length === 0) return;
    
    onSend(content.trim(), priority, attachments);
    setContent("");
    setPriority("normal");
    setAttachments([]);
  };

  const handleFileSelect = (files: FileList) => {
    const newFiles = Array.from(files);
    const filteredFiles = newFiles.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
    const totalFiles = attachments.length + filteredFiles.length;
    
    if (totalFiles > maxAttachments) {
      alert(`Maximum ${maxAttachments} files allowed`);
      return;
    }
    
    setAttachments(prev => [...prev, ...filteredFiles.slice(0, maxAttachments - prev.length)]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getPriorityIcon = (priorityLevel: string) => {
    switch (priorityLevel) {
      case 'low':
        return null;
      case 'normal':
        return null;
      case 'high':
        return <Flag className="h-4 w-4 text-orange-500" />;
      case 'urgent':
        return <Zap className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getPriorityLabel = (priorityLevel: string) => {
    switch (priorityLevel) {
      case 'low':
        return 'Low Priority';
      case 'normal':
        return 'Normal';
      case 'high':
        return 'High Priority';
      case 'urgent':
        return 'Urgent';
      default:
        return 'Normal';
    }
  };

  return (
    <div className={`border rounded-lg p-3 bg-background ${isReply ? 'bg-muted/50' : ''}`}>
      {isReply && (
        <div className="flex items-center space-x-2 mb-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Replying to message</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div
          className={`relative ${isDragOver ? 'bg-muted/50 border-dashed border-2 border-primary' : ''}`}
          onDragOver={allowAttachments ? handleDragOver : undefined}
          onDragLeave={allowAttachments ? handleDragLeave : undefined}
          onDrop={allowAttachments ? handleDrop : undefined}
        >
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            rows={isReply ? 2 : 3}
            className="resize-none focus-visible:ring-1"
            data-testid="textarea-message"
          />
          {isDragOver && allowAttachments && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Upload className="h-5 w-5" />
                <span>Drop files here</span>
              </div>
            </div>
          )}
        </div>

        {/* File attachments list */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Attachments ({attachments.length}/{maxAttachments})
            </div>
            <div className="space-y-1">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded border"
                  data-testid={`attachment-${index}`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{file.name}</div>
                      <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(index)}
                    className="h-6 w-6 p-0 flex-shrink-0"
                    data-testid={`button-remove-attachment-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden file input */}
        {allowAttachments && (
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
            data-testid="input-file-attachments"
          />
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {allowAttachments && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8"
                      data-testid="button-attach-file"
                    >
                      <Paperclip className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Attach files (max {maxAttachments})</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {showPrioritySelector && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="w-32 h-8">
                        <div className="flex items-center space-x-2">
                          {getPriorityIcon(priority)}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center space-x-2">
                            <Flag className="h-4 w-4 text-orange-500" />
                            <span>High Priority</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <div className="flex items-center space-x-2">
                            <Zap className="h-4 w-4 text-red-500" />
                            <span>Urgent</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Set message priority</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <span className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="h-8"
              >
                Cancel
              </Button>
            )}
            
            <Button
              type="submit"
              size="sm"
              disabled={(!content.trim() && attachments.length === 0) || isLoading}
              className="h-8"
              data-testid="button-send-message"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-3 w-3 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}