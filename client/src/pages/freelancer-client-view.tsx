import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMessageSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, ExternalLink, Eye, FileText, MessageSquare, CreditCard, Star, Send, Reply } from "lucide-react";
import { format } from "date-fns";
import type { z } from "zod";

type MessageFormData = z.infer<typeof insertMessageSchema>;

export default function FreelancerClientView() {
  const { projectId } = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You must be logged in to view this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch project details with freelancer permissions
  const { data: project, isLoading: projectLoading } = useQuery<any>({
    queryKey: ["/api/projects", projectId],
    enabled: isAuthenticated && !!projectId,
  });

  // Fetch project data (deliverables, messages, invoices, feedback)
  const { data: deliverables = [] } = useQuery<any[]>({
    queryKey: ["/api/projects", projectId, "deliverables"],
    enabled: !!project,
  });

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["/api/projects", projectId, "messages"],
    enabled: !!project,
  });

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/projects", projectId, "invoices"],
    enabled: !!project,
  });

  const { data: feedback = [] } = useQuery<any[]>({
    queryKey: ["/api/projects", projectId, "feedback"],
    enabled: !!project,
  });

  // Message form
  const messageForm = useForm<MessageFormData>({
    resolver: zodResolver(insertMessageSchema.omit({ projectId: true })),
    defaultValues: {
      senderName: "",
      senderType: "freelancer",
      content: "",
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/messages`, {
        ...data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "messages"] });
      messageForm.reset();
      setIsMessageDialogOpen(false);
      toast({
        title: "Message sent!",
        description: "Your message has been sent to the client.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || projectLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project view...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground mb-2">Project Not Found</h1>
            <p className="text-muted-foreground">
              This project doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => window.history.back()} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clientPortalUrl = `${window.location.origin}/client/${project.shareToken}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="border-l border-border pl-4">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-semibold text-foreground">
                  Viewing Client Portal: {project.name}
                </h1>
                <Badge variant="outline">
                  <Eye className="mr-1 h-3 w-3" />
                  Freelancer View
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Client: {project.clientName} • {project.clientEmail}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(clientPortalUrl);
                toast({
                  title: "Link copied!",
                  description: "Client portal link copied to clipboard",
                });
              }}
            >
              Copy Client Link
            </Button>
            <Button
              size="sm"
              onClick={() => window.open(clientPortalUrl, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Client View
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Project Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Project Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Created {format(new Date(project.createdAt), 'MMM dd, yyyy')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Share Token Status</CardTitle>
            </CardHeader>
            <CardContent>
              {project.shareTokenExpiry && new Date(project.shareTokenExpiry) > new Date() ? (
                <>
                  <Badge variant="outline" className="text-green-600">Active</Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Expires {format(new Date(project.shareTokenExpiry), 'MMM dd, yyyy')}
                  </p>
                </>
              ) : (
                <>
                  <Badge variant="destructive">Expired</Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Token needs regeneration
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Last Client Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                {project.lastAccessed 
                  ? format(new Date(project.lastAccessed), 'MMM dd, h:mm a')
                  : 'Never accessed'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {project.accessCount || 0} total visits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.progress || 0}%</div>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${project.progress || 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deliverables */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Deliverables
                </CardTitle>
                <Badge variant="secondary">{deliverables.length}</Badge>
              </div>
              <CardDescription>Files shared with the client</CardDescription>
            </CardHeader>
            <CardContent>
              {deliverables.length === 0 ? (
                <p className="text-sm text-muted-foreground">No files uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {deliverables.slice(0, 5).map((file: any) => (
                    <div key={file.id} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{file.fileName || file.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {file.uploaderType}
                      </Badge>
                    </div>
                  ))}
                  {deliverables.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{deliverables.length - 5} more files
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Messages
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{messages.length}</Badge>
                  <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Reply className="mr-2 h-4 w-4" />
                        Reply
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Send Message to Client</DialogTitle>
                        <DialogDescription>
                          Send a message to {project.clientName}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...messageForm}>
                        <form 
                          onSubmit={messageForm.handleSubmit((data) => 
                            sendMessageMutation.mutate({
                              ...data,
                              senderName: (user as any)?.firstName || (user as any)?.email || 'Freelancer',
                            })
                          )} 
                          className="space-y-4"
                        >
                          <FormField
                            control={messageForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Message</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Type your message here..."
                                    className="min-h-[100px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsMessageDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={sendMessageMutation.isPending}
                            >
                              {sendMessageMutation.isPending ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send Message
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <CardDescription>Communication with the client</CardDescription>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">No messages yet</p>
                  <p className="text-xs text-muted-foreground">
                    Start a conversation with your client
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {messages.slice(-5).reverse().map((msg: any) => (
                    <div key={msg.id} className={`p-3 rounded-lg border transition-all ${
                      msg.senderType === 'client' ? 'bg-blue-50 border-blue-200' : 'bg-muted/30 border-border'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{msg.senderName}</span>
                          <Badge variant="outline" className="text-xs">
                            {msg.senderType}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.createdAt), 'MMM dd, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{msg.content}</p>
                    </div>
                  ))}
                  {messages.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{messages.length - 5} more messages
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Invoices
                </CardTitle>
                <Badge variant="secondary">{invoices.length}</Badge>
              </div>
              <CardDescription>Billing and payment status</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices created</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between text-sm">
                      <span>Invoice #{invoice.invoiceNumber}</span>
                      <div className="flex items-center space-x-2">
                        <span>${(invoice.amount / 100).toFixed(2)}</span>
                        <Badge variant={
                          invoice.status === 'paid' ? 'default' :
                          invoice.status === 'overdue' ? 'destructive' : 'secondary'
                        }>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Star className="mr-2 h-5 w-5" />
                  Client Feedback
                </CardTitle>
                <Badge variant="secondary">{feedback.length}</Badge>
              </div>
              <CardDescription>Ratings and reviews from the client</CardDescription>
            </CardHeader>
            <CardContent>
              {feedback.length === 0 ? (
                <p className="text-sm text-muted-foreground">No feedback received</p>
              ) : (
                <div className="space-y-3">
                  {feedback.map((item: any) => (
                    <div key={item.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.clientName}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= (item.rating || 0)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}