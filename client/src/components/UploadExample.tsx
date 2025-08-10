import { useState } from 'react';
import { uploadFileToS3, useS3Upload } from '../lib/uploadHelpers';
import { useAuthStore, useProjectStore } from '../lib/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { useToast } from '../hooks/use-toast';

// Example component showing S3 upload integration with simplified stores
export function UploadExample() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const { user } = useAuthStore();
  const { currentProject } = useProjectStore();
  const { toast } = useToast();
  const { uploadFile } = useS3Upload();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
    setProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentProject || !user) {
      toast({
        title: "Upload Error",
        description: "Please select a file and ensure you're logged in with a project selected.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Use the S3 upload helper with progress tracking
      const result = await uploadFile(selectedFile, currentProject.id, setProgress);
      
      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} has been uploaded successfully.`
      });
      
      // Reset form
      setSelectedFile(null);
      setProgress(0);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Upload failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">S3 Direct Upload</h3>
      
      <div className="space-y-2">
        <Input
          id="file-input"
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
        />
        
        {selectedFile && (
          <div className="text-sm text-gray-600">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <div className="text-sm text-center">{progress}% uploaded</div>
        </div>
      )}

      <div className="flex gap-2">
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploading || !currentProject}
          className="flex-1"
        >
          {uploading ? 'Uploading...' : 'Upload to S3'}
        </Button>
        
        {selectedFile && (
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedFile(null);
              setProgress(0);
            }}
            disabled={uploading}
          >
            Clear
          </Button>
        )}
      </div>

      {!user && (
        <div className="text-sm text-amber-600">
          Please log in to upload files.
        </div>
      )}
      
      {!currentProject && user && (
        <div className="text-sm text-amber-600">
          Please select a project to upload files.
        </div>
      )}
    </div>
  );
}

// Example of using the simplified stores
export function StoreExample() {
  const { user, setUser, clearUser } = useAuthStore();
  const { currentProject, setCurrentProject, clearProjects } = useProjectStore();

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Store Usage Example</h3>
      
      <div className="space-y-2">
        <div className="text-sm">
          <strong>Auth State:</strong> {user ? `Logged in as ${user.name || user.email}` : 'Not logged in'}
        </div>
        
        <div className="text-sm">
          <strong>Current Project:</strong> {currentProject ? currentProject.name : 'None selected'}
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => setUser({ name: 'Test User', email: 'test@example.com' })}
        >
          Mock Login
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => setCurrentProject({ id: '1', name: 'Test Project' })}
        >
          Set Project
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => {
            clearUser();
            clearProjects();
          }}
        >
          Clear All
        </Button>
      </div>
    </div>
  );
}