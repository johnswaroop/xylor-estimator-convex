import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to determine if a link is an S3 key or a URL
export function isS3Key(link: string): boolean {
  // S3 keys for this app start with 'xylo-leads/' and don't contain protocol
  return link.startsWith("xylo-leads/") && !link.includes("://");
}

// Utility function to generate a downloadable URL from an S3 key
export async function generateDownloadUrlFromKey(
  key: string,
): Promise<string | null> {
  try {
    const params = new URLSearchParams();
    params.append("operation", "download");
    params.append("key", key);

    const response = await fetch(
      `/api/generate-presigned-s3-url?${params.toString()}`,
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate download URL");
    }

    const data = await response.json();
    return data.url || null;
  } catch (error) {
    console.error("Error generating download URL:", error);
    return null;
  }
}

// Utility function to get downloadable URL (handles both S3 keys and direct URLs)
export async function getDownloadableUrl(link: string): Promise<string | null> {
  if (isS3Key(link)) {
    return await generateDownloadUrlFromKey(link);
  }
  // If it's already a URL, return it as-is
  return link;
}
