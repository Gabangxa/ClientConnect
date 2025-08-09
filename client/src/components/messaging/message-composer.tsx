import { useState } from "react";
import { Send, AlertCircle, Flag, Zap } from "lucide-react";
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
  onSend: (content: string, priority?: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  isReply?: boolean;
  isLoading?: boolean;
  showPrioritySelector?: boolean;
}

export function MessageComposer({ 
  onSend, 
  onCancel,
  placeholder = "Type your message...",
  isReply = false,
  isLoading = false,
  showPrioritySelector = true
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<string>("normal");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    onSend(content.trim(), priority);
    setContent("");
    setPriority("normal");
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
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          rows={isReply ? 2 : 3}
          className="resize-none focus-visible:ring-1"
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
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
              disabled={!content.trim() || isLoading}
              className="h-8"
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