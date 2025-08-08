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
  Send,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Calculator,
  Clock,
  ArrowRight,
  Eye,
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
import { useRouter } from "next/navigation";

export type TLeadData = Awaited<
  ReturnType<typeof useQuery<typeof api.lead_service.getLeadById>>
>;

export type TFormData = Awaited<
  ReturnType<
    typeof useQuery<typeof api.form_service.getFormByLeadIdAndCompanyId>
  >
>;

type QuickAction = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant: "default" | "outline" | "secondary" | "destructive" | "ghost";
  onClick: () => void;
  description: string;
  disabled?: boolean;
};

// Status-based quick actions mapping
// Status indicates the CURRENT process being performed, not completion
const getQuickActionsForStatus = (
  status: string,
  company_id: string,
  lead_id: string,
  router: ReturnType<typeof useRouter>,
): QuickAction[] => {
  const actions: QuickAction[] = [];

  switch (status) {
    case "CREATE_LEAD":
      // Currently: Lead has been created, ready for next steps
      actions.push({
        icon: Users,
        label: "Build Team",
        variant: "default" as const,
        onClick: () =>
          router.push(`/bd/actions/${company_id}/build-team/${lead_id}`),
        description: "Start team assignment process",
      });
      break;

    case "BUILD_TEAM":
      // Currently: Team building process is active
      actions.push({
        icon: Users,
        label: "Continue Team Building",
        variant: "default" as const,
        onClick: () =>
          router.push(`/bd/actions/${company_id}/build-team/${lead_id}`),
        description: "Continue assigning team members",
      });
      actions.push({
        icon: MessageSquare,
        label: "Add Team Notes",
        variant: "outline" as const,
        onClick: () => {},
        description: "Add notes about team requirements",
      });
      break;

    case "ATTATCH_QUALIFIER":
      // Currently: Qualifier attachment process is active
      actions.push({
        icon: FileText,
        label: "Continue Qualifier Setup",
        variant: "default" as const,
        onClick: () =>
          router.push(`/bd/actions/${company_id}/attach-qualifier/${lead_id}`),
        description: "Continue setting up qualification form",
      });
      actions.push({
        icon: Eye,
        label: "Preview Qualifier",
        variant: "outline" as const,
        onClick: () => {},
        description: "Preview the qualification form",
      });
      break;

    case "SEND_QUALIFIER":
      // Currently: Qualifier sending process is active
      actions.push({
        icon: Send,
        label: "Continue Email Setup",
        variant: "default" as const,
        onClick: () =>
          router.push(`/bd/actions/${company_id}/send-qualifier/${lead_id}`),
        description: "Continue setting up qualifier email",
      });
      actions.push({
        icon: Eye,
        label: "Preview Email",
        variant: "outline" as const,
        onClick: () => {},
        description: "Preview the email content",
      });
      break;

    case "AWAIT_RESPONSE":
      // Currently: Waiting for client response (passive state)
      actions.push({
        icon: Phone,
        label: "Follow Up Client",
        variant: "default" as const,
        onClick: () => {},
        description: "Contact client for follow-up",
      });
      actions.push({
        icon: Send,
        label: "Resend Qualifier",
        variant: "outline" as const,
        onClick: () =>
          router.push(`/bd/actions/${company_id}/send-qualifier/${lead_id}`),
        description: "Send qualifier email again",
      });
      actions.push({
        icon: Clock,
        label: "Set Reminder",
        variant: "outline" as const,
        onClick: () => {},
        description: "Set a follow-up reminder",
      });
      break;

    case "QUALIFIER_RECEIVED":
      // Currently: Processing received qualifier
      actions.push({
        icon: Eye,
        label: "Review Qualifier Response",
        variant: "default" as const,
        onClick: () => {},
        description: "Review the submitted qualification",
      });
      break;

    case "QUALIFIER_IN_REVIEW":
      // Currently: Internal review process is active
      actions.push({
        icon: CheckCircle,
        label: "Approve Qualifier",
        variant: "default" as const,
        onClick: () => {},
        description: "Approve qualification for estimation",
      });
      actions.push({
        icon: XCircle,
        label: "Reject Qualifier",
        variant: "destructive" as const,
        onClick: () => {},
        description: "Reject the qualification",
      });
      actions.push({
        icon: MessageSquare,
        label: "Add Review Notes",
        variant: "outline" as const,
        onClick: () => {},
        description: "Add notes to the review",
      });
      break;

    case "QUALIFIER_APPROVED":
      // Currently: Processing approved qualifier for next steps
      actions.push({
        icon: Calculator,
        label: "Send for Estimate",
        variant: "default" as const,
        onClick: () => {},
        description: "Forward to estimation team",
      });
      actions.push({
        icon: Users,
        label: "Assign Estimator",
        variant: "outline" as const,
        onClick: () => {},
        description: "Assign specific estimator",
      });
      break;

    case "QUALIFIER_REJECTED":
      // Currently: Processing rejected qualifier
      actions.push({
        icon: MessageSquare,
        label: "Document Rejection",
        variant: "default" as const,
        onClick: () => {},
        description: "Document rejection reasons",
      });
      actions.push({
        icon: Mail,
        label: "Notify Client",
        variant: "outline" as const,
        onClick: () => {},
        description: "Send rejection notification",
      });
      actions.push({
        icon: ArrowRight,
        label: "Restart Process",
        variant: "outline" as const,
        onClick: () =>
          router.push(`/bd/actions/${company_id}/attach-qualifier/${lead_id}`),
        description: "Start new qualification process",
      });
      break;

    case "SENT_FOR_ESTIMATE":
      // Currently: Estimate request is in progress
      actions.push({
        icon: Users,
        label: "Contact Estimator",
        variant: "default" as const,
        onClick: () => {},
        description: "Follow up with estimation team",
      });
      actions.push({
        icon: Clock,
        label: "Set Estimate Deadline",
        variant: "outline" as const,
        onClick: () => {},
        description: "Set deadline for estimate",
      });
      actions.push({
        icon: Eye,
        label: "Track Progress",
        variant: "outline" as const,
        onClick: () => {},
        description: "Monitor estimation progress",
      });
      break;

    case "ESTIMATE_RECEIVED":
      // Currently: Processing received estimate
      actions.push({
        icon: Eye,
        label: "Review Estimate",
        variant: "default" as const,
        onClick: () => {},
        description: "Review the prepared estimate",
      });
      actions.push({
        icon: ArrowRight,
        label: "Start Review Process",
        variant: "outline" as const,
        onClick: () => {},
        description: "Begin formal estimate review",
      });
      break;

    case "ESTIMATE_IN_REVIEW":
      // Currently: Estimate review process is active
      actions.push({
        icon: CheckCircle,
        label: "Approve Estimate",
        variant: "default" as const,
        onClick: () => {},
        description: "Approve estimate for client",
      });
      actions.push({
        icon: XCircle,
        label: "Request Changes",
        variant: "outline" as const,
        onClick: () => {},
        description: "Request estimate modifications",
      });
      actions.push({
        icon: MessageSquare,
        label: "Add Review Comments",
        variant: "outline" as const,
        onClick: () => {},
        description: "Add comments to the review",
      });
      break;

    case "ESTIMATE_APPROVED":
      // Currently: Processing approved estimate for client
      actions.push({
        icon: Send,
        label: "Prepare Client Email",
        variant: "default" as const,
        onClick: () => {},
        description: "Prepare estimate email for client",
      });
      actions.push({
        icon: Eye,
        label: "Review Final Estimate",
        variant: "outline" as const,
        onClick: () => {},
        description: "Final review before sending",
      });
      break;

    case "SEND_ESTIMATE":
      // Currently: Estimate sending process is active
      actions.push({
        icon: Send,
        label: "Send to Client",
        variant: "default" as const,
        onClick: () => {},
        description: "Send estimate to client",
      });
      actions.push({
        icon: Eye,
        label: "Preview Email",
        variant: "outline" as const,
        onClick: () => {},
        description: "Preview estimate email",
      });
      break;

    case "AWAIT_ESTIMATE_RESPONSE":
      // Currently: Waiting for client estimate response
      actions.push({
        icon: Phone,
        label: "Follow Up Client",
        variant: "default" as const,
        onClick: () => {},
        description: "Contact client about estimate",
      });
      actions.push({
        icon: Clock,
        label: "Set Follow-up Reminder",
        variant: "outline" as const,
        onClick: () => {},
        description: "Schedule follow-up reminder",
      });
      break;

    default:
      // Default actions for unknown/future statuses
      actions.push({
        icon: MessageSquare,
        label: "Add Status Note",
        variant: "outline" as const,
        onClick: () => {},
        description: "Add note about current status",
      });
      break;
  }

  // Always add these universal actions
  actions.push({
    icon: MessageSquare,
    label: "Add Note",
    variant: "ghost" as const,
    onClick: () => {},
    description: "Add a general note to this lead",
  });

  return actions;
};

const LeadView = ({
  company_id,
  lead_id,
}: {
  company_id: string;
  lead_id: string;
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isStarred, setIsStarred] = useState(false);
  const router = useRouter();

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

    const currentStatus = leadData.status_history?.[0]?.status || "UNKNOWN";
    const quickActions = getQuickActionsForStatus(
      currentStatus,
      company_id,
      lead_id,
      router,
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
            {currentStatus
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            Currently being performed
          </p>
        </div>

        <Separator />

        {/* Dynamic Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.slice(0, 3).map((action, index) => {
              const IconComponent = action.icon;
              return (
                <div key={index} className="space-y-1">
                  <Button
                    className="w-full justify-start"
                    variant={action.variant}
                    onClick={action.onClick}
                    disabled={action.disabled}
                  >
                    <IconComponent className="mr-2 h-4 w-4" />
                    {action.label}
                  </Button>
                  <p className="text-xs text-muted-foreground px-2">
                    {action.description}
                  </p>
                </div>
              );
            })}

            {quickActions.length > 3 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    More Actions ({quickActions.length - 3})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {quickActions.slice(3).map((action, index) => {
                    const IconComponent = action.icon;
                    return (
                      <DropdownMenuItem
                        key={index}
                        onClick={action.onClick}
                        disabled={action.disabled}
                      >
                        <IconComponent className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{action.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {action.description}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Team */}

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Team Members</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/bd/actions/${company_id}/build-team/${lead_id}`)
              }
            >
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
