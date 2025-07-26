import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Folder, MessageSquare, CreditCard } from "lucide-react";
import { format } from "date-fns";
import type { Project, Invoice } from "@shared/schema";

interface StatusCardsProps {
  project: Project;
  filesShared: number;
  unreadMessages: number;
  nextPayment: Invoice | null;
}

export function StatusCards({ project, filesShared, unreadMessages, nextPayment }: StatusCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="status-card">
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Project Progress</p>
              <p className="text-3xl font-bold text-foreground mt-2">{project.progress || 0}%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-primary text-xl" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${project.progress || 0}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="status-card">
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Files Shared</p>
              <p className="text-3xl font-bold text-foreground mt-2">{filesShared}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Folder className="text-green-600 text-xl" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Available for download</p>
        </CardContent>
      </Card>

      <Card className="status-card">
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Messages</p>
              <p className="text-3xl font-bold text-foreground mt-2">{unreadMessages}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-purple-600 text-xl" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {unreadMessages > 0 ? "unread messages" : "all caught up"}
          </p>
        </CardContent>
      </Card>

      <Card className="status-card">
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Next Payment</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {nextPayment ? `$${(nextPayment.amount / 100).toFixed(0)}` : "None"}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <CreditCard className="text-amber-600 text-xl" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {nextPayment && nextPayment.dueDate
              ? `Due ${format(new Date(nextPayment.dueDate), 'MMM dd')}`
              : "No pending payments"
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
