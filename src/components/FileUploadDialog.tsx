import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

interface FileUploadDialogProps {
  onFilesSelected: (files: File[]) => void;
}

export function FileUploadDialog({ onFilesSelected }: FileUploadDialogProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [submittedFilesCount, setSubmittedFilesCount] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      setFiles((prevFiles) => [...prevFiles, ...Array.from(selectedFiles)]); // Append new files
    }
  };

  // Remove a specific file
  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => {
      const updated = prevFiles.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setSubmittedFilesCount(0);
      }
      return updated;
    });
  };

  // Clear all files
  const handleClearFiles = () => {
    setFiles([]);
    setSubmittedFilesCount(0); // Reset count too
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit selected files
  const handleSubmit = () => {
    if (files.length === 0) return;
  
    onFilesSelected(files); // Send to parent
    setSubmittedFilesCount((prev) => prev + files.length);
    setIsDialogOpen(false); // just close dialog
    // do NOT call handleClearFiles()
  };

  return (
    <div>
      {/* Button to open file upload dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
        <Button variant={"secondary"}>
  {submittedFilesCount > 0 ? `${submittedFilesCount} file(s) uploaded` : "Choose File"}
</Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>Select multiple files to upload.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            {/* File Upload */}
            <input
              type="file"
              accept="application/pdf, image/png, image/jpeg"
              multiple
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="file-input file-input-bordered file-input-sm w-full"
            />

            {/* Display list of selected files */}
            {files.length > 0 && (
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex justify-between items-center text-xs">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      aria-label="Remove file"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Submit and Clear buttons */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearFiles}
                disabled={files.length === 0}
              >
                Clear All
              </Button>
              <Button onClick={handleSubmit} disabled={files.length === 0}>
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
