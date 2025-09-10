'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  File,
  Folder,
  ChevronRight,
  ChevronUp,
  FileText,
  Coffee,
  Search,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import {
  listSandboxFiles,
  getSandboxFileContent,
  type FileInfo,
} from '@/lib/api';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';

interface FileBrowserProps {
  sandboxId: string;
  onSelectFile?: (path: string, content: string) => void;
  trigger?: React.ReactNode;
}

export function FileBrowser({
  sandboxId,
  onSelectFile,
  trigger,
}: FileBrowserProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadFiles('');
    } else {
      setFileContent(null);
      setSelectedFile(null);
    }
  }, [isOpen, sandboxId]);

  // Load files from the current path
  const loadFiles = async (path: string) => {
    setIsLoading(true);
    try {
      const files = await listSandboxFiles(sandboxId, path);
      setFiles(files);
      setCurrentPath(path);

      // Update breadcrumbs
      if (path === '') {
        setBreadcrumbs([]);
      } else {
        const parts = path.split('/').filter(Boolean);
        setBreadcrumbs(parts);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        toast.error('Unauthorized access to files');
      } else {
        toast.error(t('fileBrowser.failedToLoadFiles'));
      }
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load file content
  const loadFileContent = async (path: string) => {
    setIsLoading(true);
    setSelectedFile(path);
    try {
      const content = await getSandboxFileContent(sandboxId, path);
      if (typeof content === 'string') {
        setFileContent(content);
      } else {
        // For binary files, show a message
        setFileContent(t('fileBrowser.binaryFile'));
      }
    } catch (error) {
      toast.error(t('fileBrowser.failedToLoadFileContent'));
      console.error('Failed to load file content:', error);
      setFileContent(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file or folder click
  const handleItemClick = (file: FileInfo) => {
    if (file.is_dir) {
      loadFiles(file.path);
    } else {
      loadFileContent(file.path);
    }
  };

  // Navigate to a specific breadcrumb
  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      // Root directory
      loadFiles('');
    } else {
      const path = breadcrumbs.slice(0, index + 1).join('/');
      loadFiles(path);
    }
  };

  // Handle select button click
  const handleSelectFile = () => {
    if (selectedFile && fileContent && onSelectFile) {
      onSelectFile(selectedFile, fileContent);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">{t('fileBrowser.browseFiles')}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('fileBrowser.sandboxFiles')}</DialogTitle>
        </DialogHeader>

        {/* Breadcrumbs */}
        <div className="flex items-center space-x-1 text-sm py-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={() => navigateToBreadcrumb(-1)}
          >
            <Folder className="h-4 w-4 mr-1" />
            root
          </Button>
          {breadcrumbs.map((part, index) => (
            <div key={index} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => navigateToBreadcrumb(index)}
              >
                {part}
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* File list */}
          <div className="border rounded-md overflow-y-auto h-[400px]">
            {isLoading && !files.length ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Coffee className="h-8 w-8 mb-2" />
                <p>{t('fileBrowser.noFilesFound')}</p>
              </div>
            ) : (
              <div className="p-2">
                {currentPath !== '' && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm mb-1"
                    onClick={() => {
                      const parentPath = currentPath
                        .split('/')
                        .slice(0, -1)
                        .join('/');
                      loadFiles(parentPath);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    ..
                  </Button>
                )}
                {files.map((file) => (
                  <Button
                    key={file.path}
                    variant={selectedFile === file.path ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-sm mb-1"
                    onClick={() => handleItemClick(file)}
                  >
                    {file.is_dir ? (
                      <Folder className="h-4 w-4 mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    {file.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* File preview */}
          <div className="border rounded-md overflow-hidden">
            {!selectedFile ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileText className="h-8 w-8 mb-2" />
                <p>{t('fileBrowser.selectFile')}</p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-4">
                  <h3 className="font-medium mb-2 break-all">{selectedFile}</h3>
                  {fileContent ? (
                    <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap break-words">
                      {fileContent}
                    </pre>
                  ) : (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {selectedFile && fileContent && onSelectFile && (
          <div className="flex justify-end pt-2">
            <Button onClick={handleSelectFile}>Select File</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
