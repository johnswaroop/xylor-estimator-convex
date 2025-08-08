import { useState, useCallback } from "react";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

export interface UseUploadToS3Return {
  upload: (file: File, customFilename?: string) => Promise<UploadResult>;
  generateDownloadUrl: (key: string) => Promise<string | null>;
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  error: string | null;
}

export const useUploadToS3 = (): UseUploadToS3Return => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const generatePresignedUrl = useCallback(
    async (
      operation: "upload" | "download",
      filename?: string,
      filetype?: string,
      key?: string,
    ): Promise<{ url: string; key?: string } | null> => {
      try {
        const params = new URLSearchParams();
        params.append("operation", operation);

        if (filename) params.append("filename", filename);
        if (filetype) params.append("filetype", filetype);
        if (key) params.append("key", key);

        const response = await fetch(
          `/api/generate-presigned-s3-url?${params.toString()}`,
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to generate presigned URL",
          );
        }

        return await response.json();
      } catch (err) {
        console.error("Error generating presigned URL:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [],
  );

  const uploadFileToS3 = useCallback(
    async (presignedUrl: string, file: File): Promise<boolean> => {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            };
            setUploadProgress(progress);
          }
        });

        // Handle completion
        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            setUploadProgress({
              loaded: file.size,
              total: file.size,
              percentage: 100,
            });
            resolve(true);
          } else {
            setError(`Upload failed with status: ${xhr.status}`);
            resolve(false);
          }
        });

        // Handle errors
        xhr.addEventListener("error", () => {
          setError("Network error during upload");
          resolve(false);
        });

        // Handle abort
        xhr.addEventListener("abort", () => {
          setError("Upload was aborted");
          resolve(false);
        });

        // Start the upload
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
    },
    [],
  );

  const upload = useCallback(
    async (file: File, customFilename?: string): Promise<UploadResult> => {
      setIsUploading(true);
      setError(null);
      setUploadProgress(null);

      try {
        // Generate filename if not provided
        const filename = customFilename || `${Date.now()}-${file.name}`;

        // Generate presigned URL
        const presignedData = await generatePresignedUrl(
          "upload",
          filename,
          file.type,
        );

        if (!presignedData) {
          return {
            success: false,
            error: "Failed to generate presigned URL",
          };
        }

        // Upload file to S3
        const uploadSuccess = await uploadFileToS3(presignedData.url, file);

        if (uploadSuccess) {
          return {
            success: true,
            key: presignedData.key,
            url: presignedData.url,
          };
        } else {
          return {
            success: false,
            error: error || "Upload failed",
          };
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error during upload";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsUploading(false);
      }
    },
    [generatePresignedUrl, uploadFileToS3, error],
  );

  const generateDownloadUrl = useCallback(
    async (key: string): Promise<string | null> => {
      setError(null);

      try {
        const presignedData = await generatePresignedUrl(
          "download",
          undefined,
          undefined,
          key,
        );
        return presignedData?.url || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to generate download URL";
        setError(errorMessage);
        return null;
      }
    },
    [generatePresignedUrl],
  );

  return {
    upload,
    generateDownloadUrl,
    isUploading,
    uploadProgress,
    error,
  };
};
