import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, MessageSquare, CreditCard, Download, Reply } from "lucide-react";
import { format, isValid } from "date-fns";

// Safe date formatting utility
const formatSafeDate = (dateValue: any, formatStr: string, fallback: string = "Unknown date"): string => {
  if (!dateValue) return fallback;
  const date = new Date(dateValue);
  if (!isValid(date)) return fallback;
  return format(date, formatStr);
};

interface Activity {
  id: string;
  type: 'deliverable' | 'message' | 'invoice';
  title: string;
  description: string | null;
  createdAt: string;
  data: any;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deliverable':
        return <Upload className="text-green-600" />;
      case 'message':
        return <MessageSquare className="text-primary" />;
      case 'invoice':
        return <CreditCard className="text-amber-600" />;
      default:
        return <Upload className="text-slate-600" />;
    }
  };

  const getActivityBadge = (activity: Activity) => {
    switch (activity.type) {
      case 'deliverable':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {activity.data.status === 'completed' ? 'Completed' : activity.data.status}
          </Badge>
        );
      case 'invoice':
        return (
          <Badge variant={
            activity.data.status === 'paid' ? 'default' :
            activity.data.status === 'overdue' ? 'destructive' : 'secondary'
          }>
            {activity.data.status}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getActivityActions = (activity: Activity) => {
    switch (activity.type) {
      case 'deliverable':
        return activity.data.filePath ? (
          <Button size="sm" variant="outline">
            <Download className="mr-1 h-3 w-3" />
            Download
          </Button>
        ) : null;
      case 'message':
        return (
          <Button size="sm" variant="outline">
            <Reply className="mr-1 h-3 w-3" />
            Reply
          </Button>
        );
      case 'invoice':
        return activity.data.status === 'pending' ? (
          <Button size="sm" variant="outline">
            <CreditCard className="mr-1 h-3 w-3" />
            Pay Now
          </Button>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        {getActivityBadge(activity)}
                        {getActivityActions(activity)}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                      {formatSafeDate(activity.createdAt, 'MMM dd, h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
