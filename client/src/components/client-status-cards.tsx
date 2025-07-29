import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, Clock, CreditCard, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface ClientStatusCardsProps {
  project: any;
  filesShared: number;
  unreadMessages: number;
  nextPayment: any;
}

export function ClientStatusCards({ project, filesShared, unreadMessages, nextPayment }: ClientStatusCardsProps) {
  const progress = project.progress || 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Project Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Project Progress</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progress}%</div>
          <div className="w-full bg-secondary rounded-full h-2 mt-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {progress >= 100 ? 'Completed!' : progress >= 75 ? 'Almost done' : progress >= 50 ? 'Great progress' : 'Getting started'}
          </p>
        </CardContent>
      </Card>

      {/* Files Shared */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Files Available</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{filesShared}</div>
          <p className="text-xs text-muted-foreground">
            {filesShared === 0 ? 'No files yet' : `${filesShared} file${filesShared === 1 ? '' : 's'} ready for download`}
          </p>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Messages</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{unreadMessages}</div>
          <p className="text-xs text-muted-foreground">
            {unreadMessages === 0 ? 'All caught up!' : `${unreadMessages} unread message${unreadMessages === 1 ? '' : 's'}`}
          </p>
        </CardContent>
      </Card>

      {/* Next Payment */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {nextPayment ? (
            <>
              <div className="text-2xl font-bold">${(nextPayment.amount / 100).toFixed(2)}</div>
              <div className="flex items-center justify-between mt-1">
                <Badge variant={nextPayment.status === 'overdue' ? 'destructive' : 'secondary'}>
                  {nextPayment.status}
                </Badge>
                {nextPayment.dueDate && (
                  <p className="text-xs text-muted-foreground">
                    Due {format(new Date(nextPayment.dueDate), 'MMM dd')}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">No pending invoices</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}