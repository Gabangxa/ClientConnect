/**
 * Dashboard Component
 * 
 * Main freelancer dashboard displaying project overview, statistics,
 * and recent activity. Provides quick access to project management,
 * messaging, and key metrics with real-time updates.
 * 
 * Features:
 * - Project statistics and overview cards
 * - Recent message notifications with unread tracking
 * - Quick project creation and navigation
 * - Real-time data refresh for messages
 * - Responsive design with smooth animations
 * 
 * @module Dashboard
 */

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Briefcase, Users, FileText, MessageSquare, RefreshCw, AlertTriangle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import type { Project } from "@shared/schema";

/**
 * Dashboard component for authenticated freelancers
 * Shows project overview, statistics, and recent activity
 */
export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // All hooks must be declared before any conditional returns
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
  });

  // Fetch recent messages from all projects with auto-refresh
  const { data: recentMessages = [], isLoading: messagesLoading } = useQuery<any[]>({
    queryKey: ["/api/messages/recent"],
    enabled: isAuthenticated && projects.length > 0,
    refetchInterval: 30000, // Auto-refresh every 30 seconds for new messages
    refetchOnWindowFocus: true, // Refresh when window regains focus
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Mark individual message as read mutation
  const markMessageAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest("POST", `/api/messages/${messageId}/mark-read`, {});
      return response.json();
    },
    onSuccess: () => {
      // Refresh the recent messages to update unread counts
      queryClient.invalidateQueries({ queryKey: ["/api/messages/recent"] });
    },
  });

  // Regenerate share token mutation
  const regenerateTokenMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/regenerate-token`, {});
      return response.json();
    },
    onSuccess: async (data) => {
      // Refresh projects list to get new token
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      // Try to copy new link to clipboard
      const url = `${window.location.origin}/client/${data.shareToken}`;
      
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Token Regenerated!",
          description: "New share link has been generated and copied to clipboard. Valid for 90 days.",
        });
      } catch (clipboardError) {
        // Clipboard failed, show the URL for manual copy
        toast({
          title: "Token Regenerated - Copy Failed",
          description: `Link generated but couldn't copy. Use 'Copy Link' button or copy manually: ${url}`,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to regenerate share token. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  // Helper function to check if token is expired or expiring soon
  const getTokenStatus = (tokenExpiry: Date | null | undefined) => {
    if (!tokenExpiry) return { expired: true, expiringSoon: false, daysLeft: 0 };
    
    const now = new Date();
    const expiry = new Date(tokenExpiry);
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      expired: now > expiry,
      expiringSoon: daysLeft <= 7 && daysLeft > 0,
      daysLeft: Math.max(0, daysLeft)
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Welcome back, {(user as any)?.firstName || (user as any)?.email || 'Freelancer'}!
            </h1>
            <p className="text-muted-foreground mt-1">Manage your client projects and grow your business</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => window.location.href = "/api/logout"} variant="outline">
              Sign Out
            </Button>
            <Button onClick={() => setLocation("/create-project")}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Client Communication Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Messages Card */}
          <Card className="lg:col-span-2 glass rounded-xl2 soft-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5 text-blue-600" />
                    Client Messages
                    {recentMessages.filter(m => !m.isRead).length > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {recentMessages.filter(m => !m.isRead).length}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Latest messages from your clients across all projects
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {recentMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No messages yet</h3>
                  <p className="text-muted-foreground">Client messages will appear here when they contact you</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentMessages.map((message: any) => (
                    <div 
                      key={message.id} 
                      className={`p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer ${!message.isRead ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-muted/30 border-border hover:bg-muted/50'}`}
                      onClick={() => {
                        if (!message.isRead) {
                          markMessageAsReadMutation.mutate(message.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-sm">{message.senderName}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs font-medium text-primary">{message.projectName}</span>
                            {!message.isRead && (
                              <span className="flex items-center text-xs text-blue-600 font-medium">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground mb-2 leading-relaxed">{message.content}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/project/${message.projectId}/client-view`)}
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="glass rounded-xl2 soft-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Manage your client work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setLocation("/create-project")} 
                className="w-full justify-start"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
              {projects.length > 0 && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => setLocation(`/project/${projects[0]?.id}/client-view`)}
                    className="w-full justify-start"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    View Latest Project
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const url = `${window.location.origin}/client/${projects[0]?.shareToken}`;
                      navigator.clipboard.writeText(url);
                      toast({ title: "Link copied!", description: "Project portal link copied to clipboard" });
                    }}
                    className="w-full justify-start"
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    Copy Project Link
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards with Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card className="glass rounded-xl2 soft-shadow transform transition-transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProjects}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }}>
            <Card className="glass rounded-xl2 soft-shadow transform transition-transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-500">{activeProjects}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }}>
            <Card className="glass rounded-xl2 soft-shadow transform transition-transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-700">{completedProjects}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }}>
            <Card className="glass rounded-xl2 soft-shadow transform transition-transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.length > 0 
                    ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Projects List */}
        <Card className="glass rounded-xl2 soft-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Projects</CardTitle>
                <CardDescription>Manage and track your client projects</CardDescription>
              </div>
              <Button onClick={() => setLocation("/create-project")}>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No projects yet</h3>
                <p className="text-slate-600 mb-6">Create your first client project to get started</p>
                <Button onClick={() => setLocation("/create-project")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Project
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => {
                  const tokenStatus = getTokenStatus(project.tokenExpiry);
                  
                  return (
                    <div key={project.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow" data-testid={`project-card-${project.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900" data-testid={`project-name-${project.id}`}>{project.name}</h3>
                          <p className="text-sm text-slate-600 mt-1" data-testid={`project-client-${project.id}`}>Client: {project.clientName}</p>
                          {project.description && (
                            <p className="text-sm text-slate-500 mt-1">{project.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              project.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : project.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`} data-testid={`project-status-${project.id}`}>
                              {project.status}
                            </span>
                            <span className="text-sm text-slate-500">Progress: {project.progress || 0}%</span>
                            
                            {/* Token expiry status */}
                            {tokenStatus.expired ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" data-testid={`token-status-expired-${project.id}`}>
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Link Expired
                              </span>
                            ) : tokenStatus.expiringSoon ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800" data-testid={`token-status-expiring-${project.id}`}>
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Expires in {tokenStatus.daysLeft} days
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500" data-testid={`token-status-valid-${project.id}`}>
                                Link valid for {tokenStatus.daysLeft} days
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {tokenStatus.expired ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => regenerateTokenMutation.mutate(project.id)}
                              disabled={regenerateTokenMutation.isPending}
                              data-testid={`button-regenerate-${project.id}`}
                            >
                              {regenerateTokenMutation.isPending ? (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  Regenerating...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Regenerate Link
                                </>
                              )}
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  const url = `${window.location.origin}/client/${project.shareToken}`;
                                  try {
                                    await navigator.clipboard.writeText(url);
                                    toast({
                                      title: "Link copied!",
                                      description: "Client portal link copied to clipboard",
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Copy failed",
                                      description: "Unable to copy to clipboard. Please copy manually: " + url,
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                data-testid={`button-copy-link-${project.id}`}
                              >
                                Copy Link
                              </Button>
                              {tokenStatus.expiringSoon && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => regenerateTokenMutation.mutate(project.id)}
                                  disabled={regenerateTokenMutation.isPending}
                                  data-testid={`button-regenerate-${project.id}`}
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Regenerate
                                </Button>
                              )}
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/project/${project.id}/client-view`)}
                            data-testid={`button-view-portal-${project.id}`}
                          >
                            View Portal
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
