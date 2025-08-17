import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMessageSchema, insertFeedbackSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ClientSidebar } from "@/components/client-sidebar";
import { ClientHeader } from "@/components/client-header";
import { ClientStatusCards } from "@/components/client-status-cards";
import { ActivityTimeline } from "@/components/activity-timeline";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bell, Download, Send, Star, FileText, Clock, MessageSquare, CreditCard, Reply, Trash2 } from "lucide-react";
import { MessageThread } from "@/components/messaging/message-thread";
import { format } from "date-fns";
import type { z } from "zod";

type MessageFormData = z.infer<typeof insertMessageSchema>;
type FeedbackFormData = z.infer<typeof insertFeedbackSchema>;

export default function ClientPortal() {
  const { shareToken } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [feedbackRating, setFeedbackRating] = useState(0);
  // Removed replyingToMessage state - now handled by MessageThread component

  const { data: portalData, isLoading } = useQuery<any>({
    queryKey: ["/api/client", shareToken],
    enabled: !!shareToken,
    refetchInterval: 30000, // Auto-refresh every 30 seconds for new messages
    refetchOnWindowFocus: true, // Refresh when window regains focus
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const feedbackForm = useForm<FeedbackFormData>({
    resolver: zodResolver(insertFeedbackSchema.omit({ projectId: true })),
    defaultValues: {
      clientName: "",
      comment: "",
    },
  });

  const markMessagesAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/client/${shareToken}/messages/mark-read`, {
        senderType: 'freelancer'
      });
      return response.json();
    },
    onSuccess: () => {
      // Refresh the portal data to update unread counts
      queryClient.invalidateQueries({ queryKey: ["/api/client", shareToken] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      const response = await apiRequest("POST", `/api/client/${shareToken}/messages`, {
        ...data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client", shareToken] });
      toast({
        title: "Message sent!",
        description: "Your message has been sent to the freelancer.",
      });
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      const response = await apiRequest("POST", `/api/client/${shareToken}/feedback`, {
        ...data,
        rating: feedbackRating,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client", shareToken] });
      feedbackForm.reset();
      setFeedbackRating(0);
      toast({
        title: "Feedback submitted!",
        description: "Thank you for your feedback!",
      });
    },
  });

  // Delete deliverable mutation for client uploads
  const deleteDeliverableMutation = useMutation({
    mutationFn: async (deliverableId: string) => {
      const response = await apiRequest("DELETE", `/api/client/${shareToken}/deliverables/${deliverableId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client", shareToken] });
      toast({
        title: "File deleted!",
        description: "Your uploaded file has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Could not delete the file. You can only delete files you uploaded.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project portal...</p>
        </div>
      </div>
    );
  }

  if (!portalData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground mb-2">Project Not Found</h1>
            <p className="text-muted-foreground">
              The project portal you're looking for doesn't exist or has been moved.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { project, deliverables, messages, invoices, feedback } = portalData;
  
  // Calculate stats
  const filesShared = deliverables.length;
  const unreadMessages = messages.filter((m: any) => !m.isRead && m.senderType === 'freelancer').length;
  const pendingInvoices = invoices.filter((i: any) => i.status === 'pending');
  const nextPayment = pendingInvoices.length > 0 ? pendingInvoices[0] : null;

  // Combine activities for timeline
  const activities = [
    ...deliverables.map((d: any) => ({
      id: d.id,
      type: 'deliverable' as const,
      title: d.title,
      description: d.description,
      createdAt: d.createdAt,
      data: d,
    })),
    ...messages.map((m: any) => ({
      id: m.id,
      type: 'message' as const,
      title: `Message from ${m.senderName}`,
      description: m.content,
      createdAt: m.createdAt,
      data: m,
    })),
    ...invoices.map((i: any) => ({
      id: i.id,
      type: 'invoice' as const,
      title: `Invoice ${i.invoiceNumber}`,
      description: i.description,
      createdAt: i.createdAt,
      data: i,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex min-h-screen bg-background">
      <ClientSidebar 
        project={project}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          // Mark messages as read when switching to messages tab
          if (tab === 'messages' && unreadMessages > 0) {
            markMessagesAsReadMutation.mutate();
          }
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ClientHeader 
          project={project}
          unreadMessages={unreadMessages}
          shareToken={shareToken || ''}
          onNavigateToMessages={() => {
            console.log('Navigating to messages tab');
            setActiveTab('messages');
            // Mark messages as read when opening the messages tab
            if (unreadMessages > 0) {
              markMessagesAsReadMutation.mutate();
            }
          }}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "dashboard" && (
            <>
              <ClientStatusCards 
                project={project}
                filesShared={filesShared}
                unreadMessages={unreadMessages}
                nextPayment={nextPayment}
                onNavigateToMessages={() => {
                  console.log('Navigating to messages tab from status card');
                  setActiveTab('messages');
                  // Mark messages as read when opening the messages tab
                  if (unreadMessages > 0) {
                    markMessagesAsReadMutation.mutate();
                  }
                }}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-2">
                  <ActivityTimeline activities={activities} />
                </div>

                <div className="space-y-6">
                  {/* Quick Message Navigation */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Messages</CardTitle>
                      <CardDescription>Communicate with your service provider</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground mb-4">
                          {messages.length > 0 
                            ? `${messages.length} message${messages.length === 1 ? '' : 's'}`
                            : 'No messages yet'
                          }
                        </p>
                        <Button 
                          onClick={() => {
                            setActiveTab('messages');
                            // Mark messages as read when opening the messages tab
                            if (unreadMessages > 0) {
                              markMessagesAsReadMutation.mutate();
                            }
                          }}
                          className="w-full"
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          {messages.length > 0 ? 'View Messages' : 'Start Conversation'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Project Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Status</CardTitle>
                      <CardDescription>Current progress and timeline</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{project.name}</span>
                        <span className="text-sm text-muted-foreground">{project.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Started: {format(new Date(project.createdAt), 'MMM dd')}
                        </span>
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </div>
                      {project.timeline && (
                        <div className="text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Expected: {project.timeline}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Your Deliverables */}
              <Card className="mt-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Your Deliverables</CardTitle>
                      <CardDescription>Files and documents shared with you</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("files")}>
                      View All Files
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {deliverables.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No files shared yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Your service provider will share files here as they become available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {deliverables.slice(0, 6).map((file: any) => (
                        <div key={file.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {file.fileName || file.title}
                              </p>
                              {file.fileSize && (
                                <p className="text-xs text-muted-foreground">
                                  {(file.fileSize / 1024 / 1024).toFixed(1)} MB
                                </p>
                              )}
                              <div className="flex items-center mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {file.uploaderType === 'freelancer' ? 'From provider' : 'Your upload'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{format(new Date(file.createdAt), 'MMM dd')}</span>
                            {file.filePath && (
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Download className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "timeline" && <ActivityTimeline activities={activities} />}
          {activeTab === "files" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Files & Deliverables</CardTitle>
                  <CardDescription>Download files from your service provider and share your own</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Files from Provider */}
                    <div>
                      <h3 className="font-medium mb-4">Files Shared With You</h3>
                      {deliverables.filter((d: any) => d.uploaderType === 'freelancer').length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No files shared yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {deliverables.filter((d: any) => d.uploaderType === 'freelancer').map((file: any) => (
                            <div key={file.id} className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{file.fileName || file.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {file.fileSize && `${(file.fileSize / 1024 / 1024).toFixed(1)} MB • `}
                                      {format(new Date(file.createdAt), 'MMM dd')}
                                    </p>
                                  </div>
                                </div>
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Your Uploads */}
                    <div>
                      <h3 className="font-medium mb-4">Your Uploads</h3>
                      {deliverables.filter((d: any) => d.uploaderType === 'client').length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No uploads yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {deliverables.filter((d: any) => d.uploaderType === 'client').map((file: any) => (
                            <div key={file.id} className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-secondary-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{file.fileName || file.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {file.fileSize && `${(file.fileSize / 1024 / 1024).toFixed(1)} MB • `}
                                      {format(new Date(file.createdAt), 'MMM dd')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button size="sm" variant="ghost" className="text-muted-foreground">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      if (window.confirm(`Delete "${file.fileName || file.title}"? This action cannot be undone.`)) {
                                        deleteDeliverableMutation.mutate(file.id);
                                      }
                                    }}
                                    disabled={deleteDeliverableMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upload Section */}
              <FileUpload projectId={project.id} shareToken={shareToken} />
            </div>
          )}
          {activeTab === "messages" && (
            <Card>
              <CardHeader>
                <CardTitle>Communication</CardTitle>
                <CardDescription>Stay in touch with your service provider</CardDescription>
              </CardHeader>
              <CardContent>
                <MessageThread
                  messages={messages}
                  currentUserType="client"
                  currentUserName={project.clientName}
                  onSendMessage={(data) => {
                    sendMessageMutation.mutate({
                      projectId: project.id,
                      senderName: project.clientName || 'Client',
                      senderType: 'client',
                      content: data.content,
                      parentMessageId: data.parentMessageId,
                      threadId: data.threadId,
                      messageType: data.messageType || 'text',
                      priority: data.priority || 'normal',
                      status: 'sent'
                    });
                  }}
                  isLoading={sendMessageMutation.isPending}
                />
              </CardContent>
            </Card>
          )}
          {activeTab === "invoices" && (
            <Card>
              <CardHeader>
                <CardTitle>Billing & Payments</CardTitle>
                <CardDescription>View invoices and payment information</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No invoices yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Invoices will appear here when issued</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice: any) => (
                      <div key={invoice.id} className="border border-border rounded-lg p-6 bg-card">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-lg">Invoice #{invoice.invoiceNumber}</h3>
                              <Badge variant={
                                invoice.status === 'paid' ? 'default' :
                                invoice.status === 'overdue' ? 'destructive' : 'secondary'
                              }>
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{invoice.description}</p>
                            <div className="text-3xl font-bold text-foreground">
                              ${(invoice.amount / 100).toFixed(2)}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                              <span>Issued: {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</span>
                              {invoice.dueDate && (
                                <span>Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            {invoice.filePath && (
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            )}
                            {invoice.status === 'pending' && (
                              <Button size="sm" className="w-full">
                                Pay Now
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {activeTab === "feedback" && (
            <Card>
              <CardHeader>
                <CardTitle>Share Your Experience</CardTitle>
                <CardDescription>Help improve the service by sharing your thoughts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="lg">
                        <Star className="mr-2 h-4 w-4" />
                        Rate This Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rate Your Experience</DialogTitle>
                        <DialogDescription>
                          Your feedback helps improve the quality of service for future projects.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...feedbackForm}>
                        <form onSubmit={feedbackForm.handleSubmit((data) => submitFeedbackMutation.mutate(data))} className="space-y-6">
                          <FormField
                            control={feedbackForm.control}
                            name="clientName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Your Name</FormLabel>
                                <FormControl>
                                  <input 
                                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                                    placeholder="Enter your name"
                                    {...field} 
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <div>
                            <FormLabel>Overall Rating</FormLabel>
                            <div className="flex space-x-1 mt-3 justify-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-8 w-8 cursor-pointer transition-colors ${
                                    star <= feedbackRating 
                                      ? 'text-amber-400 fill-amber-400' 
                                      : 'text-muted-foreground hover:text-amber-300'
                                  }`}
                                  onClick={() => setFeedbackRating(star)}
                                />
                              ))}
                            </div>
                            <p className="text-center text-sm text-muted-foreground mt-2">
                              {feedbackRating === 0 ? 'Click to rate' :
                               feedbackRating === 1 ? 'Poor' :
                               feedbackRating === 2 ? 'Fair' :
                               feedbackRating === 3 ? 'Good' :
                               feedbackRating === 4 ? 'Very Good' : 'Excellent'}
                            </p>
                          </div>
                          <FormField
                            control={feedbackForm.control}
                            name="comment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Your Comments</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    rows={4}
                                    placeholder="What did you think of the project? Any suggestions for improvement?"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button type="submit" disabled={submitFeedbackMutation.isPending} className="w-full">
                            <Star className="mr-2 h-4 w-4" />
                            Submit Feedback
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                {feedback.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground">Your Previous Feedback</h3>
                    {feedback.map((item: any) => (
                      <div key={item.id} className="border border-border rounded-lg p-4 bg-secondary/20">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-foreground">{item.clientName}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= (item.rating || 0)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-foreground mb-2">{item.comment}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted on {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                
                {feedback.length === 0 && (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No feedback submitted yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Share your experience using the button above</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
