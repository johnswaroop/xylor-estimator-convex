import React, { useState } from "react";
import { TFormData } from "./LeadView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Eye,
  FileIcon,
  FileImage,
  FileVideo,
  FileCode,
  Archive,
  Loader2,
} from "lucide-react";
import { generateDownloadUrlFromKey } from "@/lib/utils";
import { toast } from "sonner";

const DocumentsTab = ({ formData }: { formData: TFormData }) => {
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});

  // Extract files from form response
  const files =
    formData?.response && "files" in formData.response
      ? formData.response.files || []
      : [];

  // Helper function to get file type icon
  const getFileIcon = (fileName: string, mimeType?: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    const type = mimeType?.toLowerCase();

    // Check by MIME type first
    if (type?.startsWith("image/")) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    if (type?.startsWith("video/")) {
      return <FileVideo className="h-5 w-5 text-purple-500" />;
    }
    if (type?.includes("pdf")) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }

    // Check by file extension
    switch (extension) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
      case "webp":
        return <FileImage className="h-5 w-5 text-blue-500" />;
      case "mp4":
      case "avi":
      case "mov":
      case "wmv":
        return <FileVideo className="h-5 w-5 text-purple-500" />;
      case "zip":
      case "rar":
      case "7z":
        return <Archive className="h-5 w-5 text-orange-500" />;
      case "js":
      case "ts":
      case "html":
      case "css":
      case "json":
        return <FileCode className="h-5 w-5 text-green-500" />;
      default:
        return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Helper function to get file type badge
  const getFileTypeBadge = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toUpperCase();
    return extension || "FILE";
  };

  // Handle file download with S3 key
  const handleDownload = async (
    s3Key: string,
    fileName: string,
    index: number,
  ) => {
    const loadingKey = `download-${index}`;
    setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

    try {
      const downloadUrl = await generateDownloadUrlFromKey(s3Key);

      if (!downloadUrl) {
        toast.error("Failed to generate download link");
        return;
      }

      // Create a temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle file preview with S3 key
  const handlePreview = async (s3Key: string, index: number) => {
    const loadingKey = `preview-${index}`;
    setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

    try {
      const previewUrl = await generateDownloadUrlFromKey(s3Key);

      if (!previewUrl) {
        toast.error("Failed to generate preview link");
        return;
      }

      window.open(previewUrl, "_blank");
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Failed to preview file");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12 px-4 border border-dashed rounded-lg bg-muted/20">
      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        No documents attached
      </h3>
      <p className="text-sm text-muted-foreground">
        Documents uploaded by the lead will appear here once they submit their
        qualification form.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Documents</h2>
        {files.length > 0 && (
          <Badge variant="secondary" className="text-sm">
            {files.length} file{files.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {files.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-20">Type</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  <TableCell className="py-3">
                    {getFileIcon(file.name, file.type)}
                  </TableCell>
                  <TableCell className="py-3">
                    <div
                      className="font-medium truncate max-w-xs"
                      title={file.name}
                    >
                      {file.name}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="text-xs">
                      {getFileTypeBadge(file.name)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePreview(file.link, index)}
                        disabled={loadingStates[`preview-${index}`]}
                        className="h-8 w-8 p-0"
                      >
                        {loadingStates[`preview-${index}`] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleDownload(file.link, file.name, index)
                        }
                        disabled={loadingStates[`download-${index}`]}
                        className="h-8 w-8 p-0"
                      >
                        {loadingStates[`download-${index}`] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;
