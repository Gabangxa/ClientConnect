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
 * - Project search and filtering
 * - Project archiving and deletion
 * - Onboarding wizard for new users
 * - Responsive design with smooth animations
 * 
 * @module Dashboard
 */

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, Briefcase, Users, FileText, MessageSquare, RefreshCw, AlertTriangle, 
  Search, Filter, Archive, Trash2, MoreVertical, ArchiveRestore, X,
  Sparkles, ArrowRight, CheckCircle2, Link2, Upload, Send, BarChart2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Project } from "@shared/schema";

type ProjectStatus = 'all' | 'active' | 'completed' | 'paused' | 'archived';

/**
 * Onboarding Wizard Component
 * Shows a welcome wizard for new users with no projects
 */
function OnboardingWizard({ onDismiss, onCreateProject }: { onDismiss: () => void; onCreateProject: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      icon: Sparkles,
      title: "Welcome to Your Client Portal!",
      description: "Let's get you set up in just a few steps. You'll be sharing professional project updates with your clients in no time.",
      action: "Let's Get Started",
    },
    {
      icon: Briefcase,
      title: "Create Your First Project",
      description: "Start by creating a project for your client. Add their name, a project description, and any initial notes.",
      action: "Next",
    },
    {
      icon: Link2,
      title: "Share Your Portal Link",
      description: "Each project gets a unique, secure link. Share it with your client so they can access their dedicated portal - no sign-up required for them!",
      action: "Next",
    },
    {
      icon: Upload,
      title: "Upload Deliverables",
      description: "Add files, documents, and updates to keep your client informed. They'll see everything organized in their portal.",
      action: "Next",
    },
    {
      icon: Send,
      title: "Communicate Seamlessly",
      description: "Use the built-in messaging system to keep all project communication in one place. No more scattered emails!",
      action: "Create My First Project",
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const IconComponent = currentStepData.icon;

  const handleNext = () => {
    if (isLastStep) {
      onCreateProject();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <Card className="w-full max-w-lg relative overflow-hidden">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
          data-testid="button-dismiss-onboarding"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <CardContent className="pt-12 pb-8 px-8">
          <div className="text-center">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <IconComponent className="h-8 w-8 text-primary" />
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-3">
                {currentStepData.title}
              </h2>
              
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {currentStepData.description}
              </p>
            </motion.div>

            <div className="flex items-center justify-center gap-2 mb-6">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep 
                      ? 'bg-primary w-6' 
                      : index < currentStep 
                        ? 'bg-primary/50' 
                        : 'bg-muted-foreground/30'
                  }`}
                  data-testid={`onboarding-step-${index}`}
                />
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  data-testid="button-onboarding-back"
                >
                  Back
                </Button>
              )}
              <Button onClick={handleNext} data-testid="button-onboarding-next">
                {currentStepData.action}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <button
              onClick={onDismiss}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-skip-onboarding"
            >
              Skip for now
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Dashboard component for authenticated freelancers
 * Shows project overview, statistics, and recent activity
 */
export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus>("all");
  const [showArchived, setShowArchived] = useState(false);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    return localStorage.getItem('hasSeenOnboarding') === 'true';
  });

  // Archive/Delete dialog state
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // All hooks must be declared before any conditional returns
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
  });

  // Fetch recent messages from all projects with auto-refresh
  const { data: recentMessages = [], isLoading: messagesLoading } = useQuery<any[]>({
    queryKey: ["/api/messages/recent"],
    enabled: isAuthenticated && projects.length > 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 10000,
  });

  // Mark individual message as read mutation
  const markMessageAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest("POST", `/api/messages/${messageId}/mark-read`, {});
      return response.json();
    },
    onSuccess: () => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      const url = `${window.location.origin}/client/${data.shareToken}`;
      
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Token Regenerated!",
          description: "New share link has been generated and copied to clipboard. Valid for 90 days.",
        });
      } catch (clipboardError) {
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

  // Archive project mutation
  const archiveProjectMutation = useMutation({
    mutationFn: async ({ projectId, archive }: { projectId: string; archive: boolean }) => {
      const response = await apiRequest("PUT", `/api/projects/${projectId}`, {
        status: archive ? 'archived' : 'active'
      });
      return response.json();
    },
    onSuccess: (_, { archive }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setArchiveDialogOpen(false);
      setSelectedProject(null);
      toast({
        title: archive ? "Project Archived" : "Project Restored",
        description: archive 
          ? "The project has been archived and hidden from your main view." 
          : "The project has been restored to active status.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await apiRequest("DELETE", `/api/projects/${projectId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setDeleteDialogOpen(false);
      setSelectedProject(null);
      toast({
        title: "Project Deleted",
        description: "The project and all its data have been permanently deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Show onboarding for new users
  useEffect(() => {
    if (!projectsLoading && projects.length === 0 && !hasSeenOnboarding && isAuthenticated) {
      setShowOnboarding(true);
    }
  }, [projectsLoading, projects.length, hasSeenOnboarding, isAuthenticated]);

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const handleCreateFromOnboarding = () => {
    handleDismissOnboarding();
    setLocation("/create-project");
  };

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

  // Filtered projects based on search and status
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || 
        project.name.toLowerCase().includes(searchLower) ||
        project.clientName.toLowerCase().includes(searchLower) ||
        (project.description?.toLowerCase().includes(searchLower) ?? false);

      // Status filter
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

      // Archive filter (hide archived by default unless viewing archived)
      const matchesArchiveFilter = showArchived 
        ? project.status === 'archived'
        : project.status !== 'archived';

      return matchesSearch && matchesStatus && matchesArchiveFilter;
    });
  }, [projects, searchQuery, statusFilter, showArchived]);

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

  // Stats exclude archived projects
  const nonArchivedProjects = projects.filter(p => p.status !== 'archived');
  const totalProjects = nonArchivedProjects.length;
  const activeProjects = nonArchivedProjects.filter(p => p.status === 'active').length;
  const completedProjects = nonArchivedProjects.filter(p => p.status === 'completed').length;
  const archivedCount = projects.filter(p => p.status === 'archived').length;

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

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Wizard */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingWizard 
            onDismiss={handleDismissOnboarding}
            onCreateProject={handleCreateFromOnboarding}
          />
        )}
      </AnimatePresence>

      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProject?.status === 'archived' ? 'Restore Project' : 'Archive Project'}
            </DialogTitle>
            <DialogDescription>
              {selectedProject?.status === 'archived' 
                ? `Are you sure you want to restore "${selectedProject?.name}"? It will be moved back to your active projects.`
                : `Are you sure you want to archive "${selectedProject?.name}"? Archived projects are hidden from your main view but can be restored later.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedProject && archiveProjectMutation.mutate({ 
                projectId: selectedProject.id, 
                archive: selectedProject.status !== 'archived' 
              })}
              disabled={archiveProjectMutation.isPending}
              data-testid="button-confirm-archive"
            >
              {archiveProjectMutation.isPending ? 'Processing...' : selectedProject?.status === 'archived' ? 'Restore' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete "{selectedProject?.name}"? This action cannot be undone. All project data including files, messages, and invoices will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedProject && deleteProjectMutation.mutate(selectedProject.id)}
              disabled={deleteProjectMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button onClick={() => setLocation("/create-project")} data-testid="button-new-project-header">
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/project/${message.projectId}/client-view`);
                          }}
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
                data-testid="button-quick-new-project"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/templates")} 
                className="w-full justify-start"
                data-testid="button-quick-templates"
              >
                <FileText className="mr-2 h-4 w-4" />
                Project Templates
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/analytics")} 
                className="w-full justify-start"
                data-testid="button-quick-analytics"
              >
                <BarChart2 className="mr-2 h-4 w-4" />
                Analytics Dashboard
              </Button>
              {projects.filter(p => p.status !== 'archived').length > 0 && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const activeProject = projects.find(p => p.status === 'active');
                      if (activeProject) {
                        setLocation(`/project/${activeProject.id}/client-view`);
                      }
                    }}
                    className="w-full justify-start"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    View Latest Project
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      const activeProject = projects.find(p => p.status === 'active');
                      if (activeProject) {
                        const url = `${window.location.origin}/client/${activeProject.shareToken}`;
                        try {
                          await navigator.clipboard.writeText(url);
                          toast({ title: "Link copied!", description: "Project portal link copied to clipboard" });
                        } catch {
                          toast({ 
                            title: "Copy failed", 
                            description: "Unable to copy to clipboard",
                            variant: "destructive"
                          });
                        }
                      }
                    }}
                    className="w-full justify-start"
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    Copy Project Link
                  </Button>
                </>
              )}
              {archivedCount > 0 && (
                <Button 
                  variant="ghost"
                  onClick={() => {
                    setShowArchived(!showArchived);
                    setStatusFilter('all');
                  }}
                  className="w-full justify-start text-muted-foreground"
                  data-testid="button-toggle-archived"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  {showArchived ? 'Hide Archived' : `View Archived (${archivedCount})`}
                </Button>
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
                  {nonArchivedProjects.length > 0 
                    ? Math.round(nonArchivedProjects.reduce((acc, p) => acc + (p.progress || 0), 0) / nonArchivedProjects.length)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Projects List */}
        <Card className="glass rounded-xl2 soft-shadow">
          <CardHeader>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {showArchived ? 'Archived Projects' : 'Your Projects'}
                  </CardTitle>
                  <CardDescription>
                    {showArchived 
                      ? 'Projects you have archived - restore them anytime'
                      : 'Manage and track your client projects'
                    }
                  </CardDescription>
                </div>
                <Button onClick={() => setLocation("/create-project")} data-testid="button-new-project-list">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </div>

              {/* Search and Filter Bar */}
              {projects.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects by name, client, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-projects"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {!showArchived && (
                    <Select value={statusFilter} onValueChange={(value: ProjectStatus) => setStatusFilter(value)}>
                      <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Active filters indicator */}
              {(searchQuery || (statusFilter !== 'all' && !showArchived)) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Showing {filteredProjects.length} of {showArchived ? archivedCount : totalProjects} projects</span>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                    className="text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No projects yet</h3>
                <p className="text-slate-600 mb-6">Create your first client project to get started</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => setLocation("/create-project")} data-testid="button-create-first-project">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Project
                  </Button>
                  {!hasSeenOnboarding && (
                    <Button variant="outline" onClick={() => setShowOnboarding(true)} data-testid="button-show-tutorial">
                      <Sparkles className="mr-2 h-4 w-4" />
                      View Tutorial
                    </Button>
                  )}
                </div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No matching projects</h3>
                <p className="text-slate-600 mb-4">
                  {showArchived 
                    ? "No archived projects match your search"
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
                <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => {
                  const tokenStatus = getTokenStatus(project.tokenExpiry);
                  
                  return (
                    <motion.div 
                      key={project.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-lg p-4 hover:shadow-md transition-all ${
                        project.status === 'archived' 
                          ? 'border-gray-200 bg-gray-50/50' 
                          : 'border-slate-200'
                      }`} 
                      data-testid={`project-card-${project.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900" data-testid={`project-name-${project.id}`}>
                              {project.name}
                            </h3>
                            {project.status === 'archived' && (
                              <Archive className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1" data-testid={`project-client-${project.id}`}>
                            Client: {project.clientName}
                          </p>
                          {project.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-1">{project.description}</p>
                          )}
                          <div className="flex items-center flex-wrap gap-2 mt-3">
                            <span 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(project.status)}`}
                              data-testid={`project-status-${project.id}`}
                            >
                              {project.status}
                            </span>
                            {project.status !== 'archived' && (
                              <span className="text-sm text-slate-500">Progress: {project.progress || 0}%</span>
                            )}
                            
                            {/* Token expiry status (only for non-archived) */}
                            {project.status !== 'archived' && (
                              tokenStatus.expired ? (
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
                              )
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {project.status === 'archived' ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedProject(project);
                                  setArchiveDialogOpen(true);
                                }}
                                data-testid={`button-restore-${project.id}`}
                              >
                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                Restore
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedProject(project);
                                  setDeleteDialogOpen(true);
                                }}
                                data-testid={`button-delete-${project.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
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

                              {/* Project Actions Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" data-testid={`button-project-menu-${project.id}`}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedProject(project);
                                      setArchiveDialogOpen(true);
                                    }}
                                    data-testid={`menu-archive-${project.id}`}
                                  >
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archive Project
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedProject(project);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="text-destructive focus:text-destructive"
                                    data-testid={`menu-delete-${project.id}`}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Project
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
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
