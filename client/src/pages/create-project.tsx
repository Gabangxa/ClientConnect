import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { insertProjectSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Briefcase, FileText, Check, Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { z } from "zod";

interface TemplateDeliverable {
  id?: string;
  title: string;
  description?: string;
  type: string;
  sortOrder: number;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  defaultStatus: string;
  category?: string;
  deliverables: TemplateDeliverable[];
}

type ProjectFormData = z.infer<typeof insertProjectSchema>;

export default function CreateProject() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const { data: templates = [] } = useQuery<ProjectTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      clientName: "",
      clientEmail: "",
      freelancerId: "",
      status: "active",
      progress: 0,
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === "none") {
      setSelectedTemplateId(null);
      form.setValue("name", "");
      form.setValue("description", "");
      return;
    }
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      if (!form.getValues("name")) {
        form.setValue("name", template.name);
      }
      if (!form.getValues("description") && template.description) {
        form.setValue("description", template.description);
      }
    }
  };

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project created!",
        description: "Your client project has been created successfully.",
      });
      const shareUrl = `${window.location.origin}/client/${project.shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Share link copied!",
        description: "The client portal link has been copied to your clipboard.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const applyTemplateMutation = useMutation({
    mutationFn: async ({ templateId, clientName, clientEmail, projectName }: { 
      templateId: string; 
      clientName: string; 
      clientEmail?: string;
      projectName?: string;
    }) => {
      const response = await apiRequest("POST", `/api/templates/${templateId}/apply`, {
        clientName,
        clientEmail,
        projectName,
      });
      return response.json();
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project created from template!",
        description: `${selectedTemplate?.deliverables.length || 0} deliverables were added automatically.`,
      });
      const shareUrl = `${window.location.origin}/client/${project.shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Share link copied!",
        description: "The client portal link has been copied to your clipboard.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project from template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    if (!data.name || !data.clientName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedTemplateId) {
      applyTemplateMutation.mutate({
        templateId: selectedTemplateId,
        clientName: data.clientName,
        clientEmail: data.clientEmail || undefined,
        projectName: data.name,
      });
    } else {
      createProjectMutation.mutate(data);
    }
  };

  const isPending = createProjectMutation.isPending || applyTemplateMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setLocation("/")} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Create New Project</h1>
            <p className="text-slate-600">Set up a new client portal</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>
                  Enter the information for your new client project
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {templates.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start from Template</label>
                    <Select
                      value={selectedTemplateId || "none"}
                      onValueChange={handleTemplateSelect}
                    >
                      <SelectTrigger data-testid="select-template">
                        <SelectValue placeholder="Select a template (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No template - Start fresh</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              {template.name}
                              {template.deliverables.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ({template.deliverables.length} deliverables)
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Templates pre-populate project details and deliverables
                    </p>
                  </div>
                )}

                {selectedTemplate && selectedTemplate.deliverables.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium text-green-900">
                        Template: {selectedTemplate.name}
                      </h4>
                    </div>
                    <p className="text-sm text-green-800 mb-2">
                      The following deliverables will be added automatically:
                    </p>
                    <ul className="text-sm text-green-700 space-y-1">
                      {selectedTemplate.deliverables
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((d, i) => (
                          <li key={d.id || i} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-green-200 text-green-800 text-xs flex items-center justify-center">
                              {i + 1}
                            </span>
                            {d.title}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Brand Identity Design" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the project scope and deliverables..."
                          rows={3}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Sarah Johnson" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="sarah@company.com" 
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• A unique client portal will be created</li>
                    <li>• You'll get a shareable link to send to your client</li>
                    <li>• Your client can access the portal without signing up</li>
                    <li>• You can start uploading deliverables and invoices immediately</li>
                  </ul>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-1"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : selectedTemplateId ? (
                      "Create from Template"
                    ) : (
                      "Create Project"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
