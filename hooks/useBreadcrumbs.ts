"use client";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface UseBreadcrumbsOptions {
  companyId?: string;
  leadId?: string;
}

export function useBreadcrumbs(
  options?: UseBreadcrumbsOptions,
): BreadcrumbItem[] {
  const pathname = usePathname();
  const { companyId, leadId } = options || {};

  // Extract leadId from pathname if not provided in options
  const segments = pathname.split("/").filter(Boolean);
  const extractedLeadId =
    leadId ||
    (segments.includes("lead")
      ? segments[segments.indexOf("lead") + 1]
      : undefined) ||
    (segments.includes("build-team")
      ? segments[segments.indexOf("build-team") + 1]
      : undefined) ||
    (segments.includes("attach-qualifier")
      ? segments[segments.indexOf("attach-qualifier") + 1]
      : undefined) ||
    (segments.includes("send-qualifier")
      ? segments[segments.indexOf("send-qualifier") + 1]
      : undefined);

  // Fetch dynamic data
  const leadData = useQuery(
    api.lead_service.getLeadById,
    extractedLeadId && companyId
      ? {
          lead_id: extractedLeadId as Id<"lead">,
          company_id: companyId as Id<"company">,
        }
      : "skip",
  );

  // Future use for company-specific breadcrumbs
  // const company = useQuery(
  //   api.company_service.getCompanyById,
  //   companyId ? { company_id: companyId as Id<"company"> } : "skip"
  // );

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Base breadcrumb - always include Dashboard
    breadcrumbs.push({
      label: "Dashboard",
      href: companyId ? `/dashboard?companyId=${companyId}` : "/dashboard",
    });

    // Handle different route patterns
    if (segments.includes("dashboard")) {
      const dashboardIndex = segments.indexOf("dashboard");

      // Dashboard lead detail: /dashboard/lead/[lead_id]
      if (
        segments[dashboardIndex + 1] === "lead" &&
        segments[dashboardIndex + 2]
      ) {
        breadcrumbs.push({
          label: "Leads",
          href: companyId ? `/dashboard?companyId=${companyId}` : "/dashboard",
        });

        const leadName = leadData?.lead?.name || "Lead Details";
        breadcrumbs.push({
          label: leadName,
          isCurrentPage: true,
        });
      }
    }

    // Handle BD actions routes: /bd/actions/[company_id]/...
    if (segments.includes("bd") && segments.includes("actions")) {
      const actionsIndex = segments.indexOf("actions");
      const actionType = segments[actionsIndex + 2]; // The action after company_id
      const targetLeadId = segments[actionsIndex + 3]; // Lead ID if present

      breadcrumbs.push({
        label: "Actions",
        href: companyId ? `/dashboard?companyId=${companyId}` : "/dashboard",
      });

      switch (actionType) {
        case "new-lead":
          breadcrumbs.push({
            label: "New Lead",
            isCurrentPage: true,
          });
          break;

        case "build-team":
          if (targetLeadId) {
            const leadName = leadData?.lead?.name || "Lead";
            breadcrumbs.push({
              label: leadName,
              href:
                companyId && extractedLeadId
                  ? `/dashboard/lead/${extractedLeadId}?companyId=${companyId}`
                  : undefined,
            });
            breadcrumbs.push({
              label: "Build Team",
              isCurrentPage: true,
            });
          }
          break;

        case "attach-qualifier":
          if (targetLeadId) {
            const leadName = leadData?.lead?.name || "Lead";
            breadcrumbs.push({
              label: leadName,
              href:
                companyId && extractedLeadId
                  ? `/dashboard/lead/${extractedLeadId}?companyId=${companyId}`
                  : undefined,
            });
            breadcrumbs.push({
              label: "Attach Qualifier",
              isCurrentPage: true,
            });
          }
          break;

        case "send-qualifier":
          if (targetLeadId) {
            const leadName = leadData?.lead?.name || "Lead";
            breadcrumbs.push({
              label: leadName,
              href:
                companyId && extractedLeadId
                  ? `/dashboard/lead/${extractedLeadId}?companyId=${companyId}`
                  : undefined,
            });
            breadcrumbs.push({
              label: "Send Qualifier",
              isCurrentPage: true,
            });
          }
          break;

        default:
          // Generic action
          breadcrumbs.push({
            label:
              actionType
                ?.replace("-", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase()) || "Action",
            isCurrentPage: true,
          });
      }
    }

    // Handle team page
    if (segments.includes("team")) {
      breadcrumbs.push({
        label: "Team Management",
        isCurrentPage: true,
      });
    }

    // Handle forms
    if (segments.includes("forms")) {
      breadcrumbs.push({
        label: "Forms",
        isCurrentPage: true,
      });
    }

    return breadcrumbs;
  };

  return generateBreadcrumbs();
}
