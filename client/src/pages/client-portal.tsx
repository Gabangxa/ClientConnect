import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMessageSchema, insertFeedbackSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/sidebar";
import { StatusCards } from "@/components/status-cards";
import { ActivityTimeline } from "@/components/activity-timeline";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bell, Download, Send, Star, FileText, Clock, MessageSquare, CreditCard } from "lucide-react";
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

  const { data: portalData, isLoading } = useQuery<any>({
    queryKey: ["/api/client", shareToken],
    enabled: !!shareToken,
  });

  const messageForm = useForm<MessageFormData>({
    resolver: zodResolver(insertMessageSchema.omit({ projectId: true })),
    defaultValues: {
      senderName: "",
      senderType: "client",
      content: "",
    },
  });

  const feedbackForm = useForm<FeedbackFormData>({
    resolver: zodResolver(insertFeedbackSchema.omit({ projectId: true })),
    defaultValues: {
      clientName: "",
      comment: "",
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
      messageForm.reset();
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
    <div className="flex min-h-screen">
      <Sidebar 
        project={project}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                Welcome back, {project.clientName.split(' ')[0]}!
              </h2>
              <p className="text-muted-foreground mt-1">Here's what's new with your project</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
                  )}
                </Button>
              </div>
              <Button size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download All
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "dashboard" && (
            <>
              <StatusCards 
                project={project}
                filesShared={filesShared}
                unreadMessages={unreadMessages}
                nextPayment={nextPayment}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-2">
                  <ActivityTimeline activities={activities} />
                </div>

                <div className="space-y-6">
                  {/* Quick Message */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Message</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...messageForm}>
                        <form onSubmit={messageForm.handleSubmit((data) => sendMessageMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={messageForm.control}
                            name="senderName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Your Name</FormLabel>
                                <FormControl>
                                  <input 
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Enter your name"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={messageForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Type your message here..." 
                                    rows={3}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={sendMessageMutation.isPending}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send Message
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>

                  {/* Project Milestone */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Milestone</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">{project.name}</span>
                        <span className="text-sm text-slate-500">{project.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">
                          Started: {format(new Date(project.createdAt), 'MMM dd')}
                        </span>
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recent Files */}
              <Card className="mt-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Files</CardTitle>
                    <Button variant="ghost" size="sm">View All Files</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {deliverables.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">No files shared yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {deliverables.slice(0, 4).map((file: any) => (
                        <div key={file.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {file.fileName || file.title}
                              </p>
                              {file.fileSize && (
                                <p className="text-xs text-slate-500">
                                  {(file.fileSize / 1024 / 1024).toFixed(1)} MB
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{format(new Date(file.createdAt), 'MMM dd')}</span>
                            {file.filePath && (
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
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
          {activeTab === "files" && <FileUpload projectId={project.id} shareToken={shareToken} />}
          {activeTab === "messages" && (
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>Communicate with your freelancer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  {messages.map((message: any) => (
                    <div key={message.id} className="flex space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.senderType === 'freelancer' 
                          ? 'bg-primary text-white' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {message.senderName[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{message.senderName}</span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(message.createdAt), 'MMM dd, h:mm a')}
                          </span>
                        </div>
                        <p className="text-slate-700 mt-1">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Form {...messageForm}>
                  <form onSubmit={messageForm.handleSubmit((data) => sendMessageMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={messageForm.control}
                      name="senderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <input 
                              className="w-full p-3 border border-slate-300 rounded-lg"
                              placeholder="Your name"
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={messageForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea placeholder="Type your message..." {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={sendMessageMutation.isPending}>
                      Send Message
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
          {activeTab === "invoices" && (
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>View and manage project invoices</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No invoices yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice: any) => (
                      <div key={invoice.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Invoice #{invoice.invoiceNumber}</h3>
                            <p className="text-sm text-slate-600">{invoice.description}</p>
                            <p className="text-lg font-semibold mt-1">
                              ${(invoice.amount / 100).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              invoice.status === 'paid' ? 'default' :
                              invoice.status === 'overdue' ? 'destructive' : 'secondary'
                            }>
                              {invoice.status}
                            </Badge>
                            {invoice.dueDate && (
                              <p className="text-sm text-slate-500 mt-1">
                                Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                              </p>
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
                <CardTitle>Feedback</CardTitle>
                <CardDescription>Share your thoughts about the project</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="mb-6">
                      <Star className="mr-2 h-4 w-4" />
                      Leave Feedback
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Project Feedback</DialogTitle>
                      <DialogDescription>
                        Share your experience working on this project
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...feedbackForm}>
                      <form onSubmit={feedbackForm.handleSubmit((data) => submitFeedbackMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={feedbackForm.control}
                          name="clientName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Name</FormLabel>
                              <FormControl>
                                <input 
                                  className="w-full p-3 border border-slate-300 rounded-lg"
                                  placeholder="Enter your name"
                                  {...field} 
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div>
                          <FormLabel>Overall Rating</FormLabel>
                          <div className="flex space-x-1 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-6 w-6 cursor-pointer transition-colors ${
                                  star <= feedbackRating 
                                    ? 'text-amber-400 fill-amber-400' 
                                    : 'text-slate-300'
                                }`}
                                onClick={() => setFeedbackRating(star)}
                              />
                            ))}
                          </div>
                        </div>
                        <FormField
                          control={feedbackForm.control}
                          name="comment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Feedback</FormLabel>
                              <FormControl>
                                <Textarea 
                                  rows={4}
                                  placeholder="Share your thoughts about the project..."
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={submitFeedbackMutation.isPending}>
                          Submit Feedback
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                {feedback.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Previous Feedback</h3>
                    {feedback.map((item: any) => (
                      <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{item.clientName}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= (item.rating || 0)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-700">{item.comment}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    ))}
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
