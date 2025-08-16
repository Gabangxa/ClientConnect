import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, FileText, MessageSquare, CreditCard, Star, Clock } from "lucide-react";
import { format, isValid } from "date-fns";

// Safe date formatting utility
const formatSafeDate = (dateValue: any, formatStr: string, fallback: string = "Not set"): string => {
  if (!dateValue) return fallback;
  const date = new Date(dateValue);
  if (!isValid(date)) return fallback;
  return format(date, formatStr);
};

interface ClientSidebarProps {
  project: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ClientSidebar({ project, activeTab, onTabChange }: ClientSidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Overview", icon: Home },
    { id: "files", label: "Files & Deliverables", icon: FileText },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "invoices", label: "Invoices", icon: CreditCard },
    { id: "feedback", label: "Feedback", icon: Star },
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Client Portal Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">Client Portal</h1>
            <p className="text-xs text-muted-foreground">Your Project Dashboard</p>
          </div>
        </div>
        
        {/* Project Info */}
        <div className="space-y-2">
          <h2 className="font-medium text-sm text-foreground truncate">{project.name}</h2>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
              {project.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Started</span>
            <span className="text-muted-foreground">
              {formatSafeDate(project.createdAt, 'MMM dd, yyyy')}
            </span>
          </div>
          {project.timeline && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Timeline</span>
              <span className="text-muted-foreground">{project.timeline}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className="w-full justify-start text-sm"
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Client Info Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Working with:</p>
          <p>{project.freelancerName || 'Your Service Provider'}</p>
          <div className="flex items-center mt-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            Last updated {formatSafeDate(project.lastAccessed || project.updatedAt, 'MMM dd', 'recently')}
          </div>
        </div>
      </div>
    </div>
  );
}