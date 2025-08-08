"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  ChevronDown,
  MessageSquare,
  Phone,
  Mail,
  Share,
  Printer,
  Edit,
  Plus,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import Loader from "@/components/Loader";
import { OverviewTab } from "./OverviewTab";
import { ResponseTab } from "./ResponseTab";
import { ActivityTab } from "./ActivityTab";
import DocumentsTab from "./DocumentsTab";

export type TLeadData = Awaited<
  ReturnType<typeof useQuery<typeof api.lead_service.getLeadById>>
>;

export type TFormData = Awaited<
  ReturnType<
    typeof useQuery<typeof api.form_service.getFormByLeadIdAndCompanyId>
  >
>;

const LeadView = ({
  company_id,
  lead_id,
}: {
  company_id: string;
  lead_id: string;
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isStarred, setIsStarred] = useState(false);

  // Fetch lead data from Convex
  const leadData = useQuery(api.lead_service.getLeadById, {
    lead_id: lead_id as Id<"lead">,
    company_id: company_id as Id<"company">,
    with_status_history: true,
    with_team: true,
    with_source: true,
    with_notes: true,
  });

  //get the form data
  const formData = useQuery(api.form_service.getFormByLeadIdAndCompanyId, {
    lead_id: lead_id as Id<"lead">,
    company_id: company_id as Id<"company">,
  });

  // Fetch team members from Convex
  const teamMembers = useQuery(api.team_service.getLeadTeamMembers, {
    lead_id: lead_id as Id<"lead">,
    company_id: company_id as Id<"company">,
  });

  // Loading state
  if (leadData === undefined || formData === undefined) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  console.log(leadData);

  // Error state
  if (leadData === null) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">
          Error loading lead data. Please try again.
        </div>
      </div>
    );
  }

  // Data transformation utilities

  const LeadHeader = () => (
    <div className="border-b bg-background p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src="/company-logo.png" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {leadData.lead.name.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {leadData.lead.name}
            </h1>
            <p className="text-muted-foreground">
              Created on{" "}
              {new Date(leadData.lead._creationTime).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsStarred(!isStarred)}
          >
            <Star
              className={`h-5 w-5 ${isStarred ? "fill-yellow-400 text-yellow-400" : ""}`}
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                All actions
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Phone className="mr-2 h-4 w-4" />
                Call Lead
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Email Lead
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                Add Note
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Share className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  const LeadSidebar = ({ leadData }: { leadData: TLeadData }) => {
    if (!leadData)
      return (
        <div className="flex justify-center items-center h-full">
          <Loader />
        </div>
      );

    return (
      <div className="space-y-8">
        {/* Current Status */}
        <div className="border-l-4 border-l-blue-500 pl-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Current Activity
            </span>
          </div>
          <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
            {leadData.status_history?.[0]?.status
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ") || "UNKNOWN"}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            Currently being performed
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <div className="space-y-2">
            <Button className="w-full" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add task
            </Button>
            <Button className="w-full" variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Assign
            </Button>
          </div>
        </div>

        {/* Team */}

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Team Members</h3>
            <Button variant="outline" size="sm">
              <UserPlus className="mr-1 h-4 w-4" />
              Assign
            </Button>
          </div>
          <div className="space-y-2">
            {teamMembers === undefined ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            ) : teamMembers === null ? (
              <div className="text-center py-6 px-4 border border-dashed rounded-lg bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  Failed to load team members.
                </p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-6 px-4 border border-dashed rounded-lg bg-muted/20">
                <UserPlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No team members assigned yet.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click &ldquo;Assign&rdquo; to add team members
                </p>
              </div>
            ) : (
              teamMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.user?.image} />
                    <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                      {member.user?.name?.substring(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.user?.name || "Unknown User"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {member.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <LeadHeader />

      <div className="container mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="estimates">Estimates</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <OverviewTab
                  leadData={leadData}
                  formData={formData}
                  company_id={company_id}
                  lead_id={lead_id}
                />
              </TabsContent>

              <TabsContent value="response" className="mt-6">
                <ResponseTab formData={formData} />
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <DocumentsTab formData={formData} />
              </TabsContent>

              <TabsContent value="estimates" className="mt-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Estimates</h2>
                  <Separator />
                  <p className="text-center text-muted-foreground py-8">
                    Estimates content coming soon...
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <ActivityTab
                  leadData={leadData}
                  teamMembers={teamMembers || []}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="w-80 shrink-0 border-l pl-6">
            <LeadSidebar leadData={leadData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadView;
