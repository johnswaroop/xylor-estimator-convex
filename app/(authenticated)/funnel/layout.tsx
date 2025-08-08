"use client";
import { AppSidebar } from "@/components/app-sidebar";

import { useQueryState } from "nuqs";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Separator } from "@/components/ui/separator";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Loader from "@/components/Loader";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";

export default function Page({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const params = useParams();
  const [companyId, setCompanyId] = useQueryState("companyId");

  // Extract leadId from URL params if available
  const leadId = params?.lead_id as string;

  // Generate breadcrumbs
  const breadcrumbs = useBreadcrumbs({
    companyId: companyId || undefined,
    leadId: leadId || undefined,
  });

  //fetch all user companies
  const memberships = useQuery(api.company_service.getUserCompaniesList, {});

  useEffect(() => {
    if (memberships && memberships.length > 0) {
      setCompanyId(memberships[0].company_id);
    } else if (memberships && memberships.length === 0) {
      router.push("/team");
    }
  }, [memberships, setCompanyId, router]);

  if (!memberships)
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader />
      </div>
    );

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        memberships={memberships || []}
        companyId={companyId || ""}
        setCompanyId={(companyId: string) => {
          setCompanyId(companyId);
        }}
      />
      <SidebarInset>
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
          <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {crumb.isCurrentPage ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={crumb.href}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <Button
            onClick={() => {
              router.push(`/bd/actions/${companyId}/new-lead`);
            }}
          >
            <IconPlus />
            New Lead
          </Button>
        </header>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
