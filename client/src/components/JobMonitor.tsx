import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '../hooks/use-toast';

// Job queue monitoring component following your pattern
export function JobMonitor() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  // Fetch queue statistics
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['/api/jobs/stats'],
    refetchInterval: autoRefresh ? 5000 : false, // Refresh every 5 seconds if enabled
  });

  const triggerThumbnailJob = async () => {
    try {
      const response = await fetch('/api/jobs/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileKey: 'test-file-' + Date.now(),
          originalFilename: 'test-image.jpg',
          projectId: 'test-project',
          mimeType: 'image/jpeg'
        })
      });
      
      if (response.ok) {
        toast({ title: "Thumbnail job queued successfully" });
        refetch();
      } else {
        throw new Error('Failed to queue job');
      }
    } catch (error) {
      toast({ 
        title: "Failed to queue thumbnail job", 
        variant: "destructive" 
      });
    }
  };

  const triggerEmailJob = async () => {
    try {
      const response = await fetch('/api/jobs/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new-message',
          recipientEmail: 'test@example.com',
          projectId: 'test-project',
          data: { message: 'Test notification' }
        })
      });
      
      if (response.ok) {
        toast({ title: "Email job queued successfully" });
        refetch();
      } else {
        throw new Error('Failed to queue job');
      }
    } catch (error) {
      toast({ 
        title: "Failed to queue email job", 
        variant: "destructive" 
      });
    }
  };

  const triggerCleanupJob = async () => {
    try {
      const response = await fetch('/api/jobs/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'expire-tokens'
        })
      });
      
      if (response.ok) {
        toast({ title: "Cleanup job queued successfully" });
        refetch();
      } else {
        throw new Error('Failed to queue job');
      }
    } catch (error) {
      toast({ 
        title: "Failed to queue cleanup job", 
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            <span>Loading job statistics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Background Job Monitor</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="thumbnails">Thumbnails</TabsTrigger>
              <TabsTrigger value="emails">Emails</TabsTrigger>
              <TabsTrigger value="cleanup">Cleanup</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.total?.waiting || 0}
                  </div>
                  <div className="text-sm text-blue-800">Waiting</div>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats?.total?.active || 0}
                  </div>
                  <div className="text-sm text-yellow-800">Active</div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.total?.completed || 0}
                  </div>
                  <div className="text-sm text-green-800">Completed</div>
                </div>
                
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {stats?.total?.failed || 0}
                  </div>
                  <div className="text-sm text-red-800">Failed</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Test Background Jobs</h4>
                <div className="flex gap-2">
                  <Button onClick={triggerThumbnailJob} size="sm">
                    Test Thumbnail Job
                  </Button>
                  <Button onClick={triggerEmailJob} size="sm">
                    Test Email Job
                  </Button>
                  <Button onClick={triggerCleanupJob} size="sm">
                    Test Cleanup Job
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="thumbnails" className="space-y-4">
              <QueueStats title="Thumbnail Generation" stats={stats?.thumbnails} />
            </TabsContent>
            
            <TabsContent value="emails" className="space-y-4">
              <QueueStats title="Email Notifications" stats={stats?.emails} />
            </TabsContent>
            
            <TabsContent value="cleanup" className="space-y-4">
              <QueueStats title="Cleanup Tasks" stats={stats?.cleanup} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function QueueStats({ title, stats }: { title: string; stats?: any }) {
  if (!stats) {
    return <div>No data available</div>;
  }

  const total = stats.waiting + stats.active + stats.completed + stats.failed;
  const successRate = total > 0 ? ((stats.completed / total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{title}</h3>
        <Badge variant="outline">
          {successRate}% Success Rate
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.waiting}</div>
          <div className="text-sm text-gray-500">Waiting</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.active}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-sm text-gray-500">Failed</div>
        </div>
      </div>
      
      {total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{stats.completed}/{total} completed</span>
          </div>
          <Progress value={(stats.completed / total) * 100} className="w-full" />
        </div>
      )}
    </div>
  );
}