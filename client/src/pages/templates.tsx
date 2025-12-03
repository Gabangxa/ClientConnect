import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, FileText, Trash2, Edit, Copy, GripVertical,
  ChevronDown, ChevronUp, ArrowLeft, Loader2, FolderOpen
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

interface TemplateDeliverable {
  id?: string;
  title: string;
  description?: string;
  type: string;
  sortOrder: number;
  dueDaysOffset?: number;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  defaultStatus: string;
  category?: string;
  createdAt: string;
  deliverables: TemplateDeliverable[];
}

function TemplateCard({ 
  template, 
  onEdit, 
  onDelete,
  onDuplicate 
}: { 
  template: ProjectTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="overflow-hidden" data-testid={`card-template-${template.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {template.name}
              </CardTitle>
              {template.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {template.description}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                data-testid={`button-edit-template-${template.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDuplicate}
                data-testid={`button-duplicate-template-${template.id}`}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="text-destructive hover:text-destructive"
                data-testid={`button-delete-template-${template.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-4">
              {template.category && (
                <span className="bg-muted px-2 py-1 rounded text-xs">
                  {template.category}
                </span>
              )}
              <span>{template.deliverables.length} deliverable{template.deliverables.length !== 1 ? 's' : ''}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid={`button-expand-template-${template.id}`}
            >
              {isExpanded ? (
                <>Hide <ChevronUp className="ml-1 h-4 w-4" /></>
              ) : (
                <>Show <ChevronDown className="ml-1 h-4 w-4" /></>
              )}
            </Button>
          </div>
          
          <AnimatePresence>
            {isExpanded && template.deliverables.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t pt-3 space-y-2">
                  {template.deliverables
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((d, index) => (
                      <div key={d.id || index} className="flex items-center gap-3 text-sm p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground w-6">{index + 1}.</span>
                        <div className="flex-1">
                          <p className="font-medium">{d.title}</p>
                          {d.description && (
                            <p className="text-muted-foreground text-xs line-clamp-1">{d.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">{d.type}</span>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TemplateForm({ 
  template, 
  onSave, 
  onCancel,
  isLoading 
}: { 
  template?: ProjectTemplate | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [category, setCategory] = useState(template?.category || "");
  const [defaultStatus, setDefaultStatus] = useState(template?.defaultStatus || "active");
  const [deliverables, setDeliverables] = useState<TemplateDeliverable[]>(
    template?.deliverables || []
  );

  const addDeliverable = () => {
    setDeliverables([
      ...deliverables,
      { title: "", type: "deliverable", sortOrder: deliverables.length }
    ]);
  };

  const updateDeliverable = (index: number, updates: Partial<TemplateDeliverable>) => {
    const updated = [...deliverables];
    updated[index] = { ...updated[index], ...updates };
    setDeliverables(updated);
  };

  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const moveDeliverable = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= deliverables.length) return;
    
    const updated = [...deliverables];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setDeliverables(updated.map((d, i) => ({ ...d, sortOrder: i })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description: description || undefined,
      category: category || undefined,
      defaultStatus,
      deliverables: deliverables.filter(d => d.title.trim()).map((d, i) => ({
        ...d,
        sortOrder: i
      }))
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Website Development"
            required
            data-testid="input-template-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Web Design"
            data-testid="input-template-category"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this template is for..."
          rows={3}
          data-testid="input-template-description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultStatus">Default Project Status</Label>
        <Select value={defaultStatus} onValueChange={setDefaultStatus}>
          <SelectTrigger data-testid="select-default-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Template Deliverables</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDeliverable}
            data-testid="button-add-deliverable"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Deliverable
          </Button>
        </div>

        {deliverables.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
            No deliverables yet. Add some to include them when creating projects from this template.
          </p>
        ) : (
          <div className="space-y-3">
            {deliverables.map((d, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex flex-col gap-1 mt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveDeliverable(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveDeliverable(index, 'down')}
                    disabled={index === deliverables.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex-1 grid gap-2 md:grid-cols-3">
                  <Input
                    value={d.title}
                    onChange={(e) => updateDeliverable(index, { title: e.target.value })}
                    placeholder="Deliverable title"
                    data-testid={`input-deliverable-title-${index}`}
                  />
                  <Input
                    value={d.description || ""}
                    onChange={(e) => updateDeliverable(index, { description: e.target.value })}
                    placeholder="Description (optional)"
                    data-testid={`input-deliverable-description-${index}`}
                  />
                  <Select
                    value={d.type}
                    onValueChange={(value) => updateDeliverable(index, { type: value })}
                  >
                    <SelectTrigger data-testid={`select-deliverable-type-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deliverable">Deliverable</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDeliverable(index)}
                  className="text-destructive hover:text-destructive"
                  data-testid={`button-remove-deliverable-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-template">
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim() || isLoading} data-testid="button-save-template">
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {template ? "Update Template" : "Create Template"}
        </Button>
      </div>
    </form>
  );
}

export default function Templates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery<ProjectTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsFormOpen(false);
      toast({ title: "Template created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PUT", `/api/templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setEditingTemplate(null);
      setIsFormOpen(false);
      toast({ title: "Template updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update template", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/templates/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setDeleteConfirmId(null);
      toast({ title: "Template deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete template", variant: "destructive" });
    },
  });

  const handleSave = (data: any) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDuplicate = (template: ProjectTemplate) => {
    createMutation.mutate({
      name: `${template.name} (Copy)`,
      description: template.description,
      category: template.category,
      defaultStatus: template.defaultStatus,
      deliverables: template.deliverables.map(d => ({
        title: d.title,
        description: d.description,
        type: d.type,
        sortOrder: d.sortOrder,
        dueDaysOffset: d.dueDaysOffset,
      })),
    });
  };

  const handleEdit = (template: ProjectTemplate) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setIsFormOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back-dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Project Templates</h1>
            <p className="text-muted-foreground">
              Create reusable templates for faster project setup
            </p>
          </div>
        </div>
        <Button onClick={handleCreateNew} data-testid="button-create-template">
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {templates.length === 0 && !isFormOpen ? (
        <Card className="p-12">
          <div className="text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No templates yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create project templates to speed up your workflow. Templates include preset deliverables 
              that automatically get added when you create a new project.
            </p>
            <Button onClick={handleCreateNew} data-testid="button-create-first-template">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </div>
        </Card>
      ) : isFormOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</CardTitle>
            <CardDescription>
              {editingTemplate 
                ? "Update your template settings and deliverables"
                : "Set up a reusable template for new projects"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TemplateForm
              template={editingTemplate}
              onSave={handleSave}
              onCancel={handleCancel}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => handleEdit(template)}
                onDelete={() => setDeleteConfirmId(template.id)}
                onDuplicate={() => handleDuplicate(template)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-template"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
