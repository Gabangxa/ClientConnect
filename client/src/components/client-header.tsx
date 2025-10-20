import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Download, ExternalLink, Shield } from "lucide-react";
import { format, isValid } from "date-fns";

// Safe date formatting utility
const formatSafeDate = (dateValue: any, formatStr: string, fallback: string = "Not set"): string => {
  if (!dateValue) return fallback;
  const date = new Date(dateValue);
  if (!isValid(date)) return fallback;
  return format(date, formatStr);
};

interface ClientHeaderProps {
  project: any;
  unreadMessages: number;
  shareToken: string;
  onNavigateToMessages?: () => void;
}

export function ClientHeader({ project, unreadMessages, shareToken, onNavigateToMessages }: ClientHeaderProps) {
  const handleShareLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h2 className="text-2xl font-semibold text-foreground">
              Welcome, {project.clientName.split(' ')[0]}!
            </h2>
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Secure Portal
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Project: <span className="font-medium">{project.name}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Shared on {formatSafeDate(project.createdAt, 'MMMM dd, yyyy')}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNavigateToMessages?.();
              }}
            >
              <Bell className="h-4 w-4" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  {unreadMessages}
                </span>
              )}
            </Button>
          </div>

          {/* Share Link */}
          <Button variant="outline" size="sm" onClick={handleShareLink}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Copy Link
          </Button>

          {/* Download All */}
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download All
          </Button>
        </div>
      </div>
    </header>
  );
}