import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CloudUpload, File, X } from "lucide-react";

interface FileUploadProps {
  projectId: string;
  shareToken?: string;
}

export function FileUpload({ projectId, shareToken }: FileUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; title: string; description: string }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('title', data.title);
      formData.append('description', data.description);

      // Use client endpoint if shareToken is provided, otherwise use freelancer endpoint
      const endpoint = shareToken 
        ? `/api/client/${shareToken}/deliverables`
        : `/api/projects/${projectId}/deliverables`;

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate appropriate cache based on context
      if (shareToken) {
        queryClient.invalidateQueries({ queryKey: ["/api/client", shareToken] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      }
      setFiles([]);
      setTitle("");
      setDescription("");
      toast({
        title: "File uploaded!",
        description: shareToken 
          ? "Your file has been shared with the freelancer."
          : "Your file has been shared with the client.",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file.",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/zip': ['.zip'],
    },
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (files.length === 0 || !title.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a file and provide a title.",
        variant: "destructive",
      });
      return;
    }

    // Upload first file for now (could be extended to handle multiple files)
    uploadMutation.mutate({
      file: files[0],
      title: title.trim(),
      description: description.trim(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Files</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Zone */}
        <div
          {...getRootProps()}
          className={`file-upload-zone ${isDragActive ? 'dragover' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
            <CloudUpload className="text-muted-foreground text-xl" />
          </div>
          <p className="text-sm font-medium text-foreground mb-2">
            {isDragActive ? 'Drop files here' : 'Drop files here or click to upload'}
          </p>
          <p className="text-xs text-muted-foreground">PDF, PNG, JPG up to 10MB</p>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Files</h4>
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* File Details */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Logo Design - Final Version"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this deliverable..."
              rows={3}
              className="mt-1"
            />
          </div>
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || !title.trim() || uploadMutation.isPending}
          className="w-full"
        >
          {uploadMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <CloudUpload className="mr-2 h-4 w-4" />
              Upload File
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
