import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { Separator } from "@radix-ui/react-select";
import {
  CheckCircle,
  AlertCircle,
  Circle,
  XCircle,
  Loader,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TLeadData } from "./LeadView";

// Activity timeline interfaces
interface ActivityItem {
  id: string;
  status: string;
  name: string;
  description: string;
  completed: boolean;
  inProgress?: boolean;
  pending?: boolean;
  completedAt?: string;
  completedBy?: {
    name: string;
    role: string;
    avatar: string;
  };
  startedAt?: string;
  assignedTo?: {
    name: string;
    role: string;
    avatar: string;
  };
  duration?: string;
}

interface StatusHistoryItem {
  _id: string;
  _creationTime: number;
  name: string;
  lead_id: string;
  status: string;
  invalid_detail?: string;
}

interface TeamMember {
  _id: string;
  type: string;
  user: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    image?: string;
    emailVerificationTime?: number;
    phoneVerificationTime?: number;
    isAnonymous?: boolean;
    _creationTime: number;
  } | null;
}

// Status mapping for human-readable names and descriptions
const statusMapping = {
  CREATE_LEAD: {
    name: "Lead Creation",
    description: "Setting up lead profile and initial information",
    icon: "create",
  },
  BUILD_TEAM: {
    name: "Team Assignment",
    description: "Assigning team members to handle this lead",
    icon: "team",
  },
  ATTATCH_QUALIFIER: {
    name: "Qualifier Preparation",
    description: "Preparing and attaching qualification forms",
    icon: "attach",
  },
  SEND_QUALIFIER: {
    name: "Sending Qualifier",
    description: "Sending qualification form to the client",
    icon: "send",
  },
  AWAIT_RESPONSE: {
    name: "Awaiting Client Response",
    description: "Waiting for client to complete and return qualification form",
    icon: "wait",
  },
  QUALIFIER_RECEIVED: {
    name: "Processing Qualifier",
    description: "Processing received qualification form from client",
    icon: "received",
  },
  QUALIFIER_IN_REVIEW: {
    name: "Reviewing Qualifier",
    description: "Team is currently reviewing the submitted qualification",
    icon: "review",
  },
  QUALIFIER_APPROVED: {
    name: "Finalizing Approval",
    description: "Processing qualification approval and preparing next steps",
    icon: "approved",
  },
  QUALIFIER_REJECTED: {
    name: "Processing Rejection",
    description: "Handling qualification rejection and next steps",
    icon: "rejected",
  },
  SENT_FOR_ESTIMATE: {
    name: "Routing for Estimation",
    description: "Transferring project to estimation team",
    icon: "estimate",
  },
  ESTIMATE_RECEIVED: {
    name: "Processing Estimate",
    description: "Reviewing and processing completed estimate",
    icon: "completed",
  },
  ESTIMATE_IN_REVIEW: {
    name: "Reviewing Estimate",
    description: "Team is currently reviewing the prepared estimate",
    icon: "review",
  },
  ESTIMATE_APPROVED: {
    name: "Finalizing Estimate",
    description: "Processing estimate approval and preparing for client",
    icon: "approved",
  },
  ESTIMATE_REJECTED: {
    name: "Handling Rejection",
    description: "Processing estimate rejection and revision requirements",
    icon: "rejected",
  },
  SEND_ESTIMATE: {
    name: "Sending Estimate",
    description: "Delivering estimate to client for review",
    icon: "send",
  },
  AWAIT_ESTIMATE_RESPONSE: {
    name: "Awaiting Client Decision",
    description: "Waiting for client response and feedback on estimate",
    icon: "wait",
  },
  ESTIMATE_RESPONSE_RECEIVED: {
    name: "Processing Client Response",
    description: "Reviewing and processing client feedback on estimate",
    icon: "received",
  },
  ESTIMATE_RESPONSE_IN_REVIEW: {
    name: "Reviewing Client Feedback",
    description: "Team is analyzing client response and determining next steps",
    icon: "review",
  },
  ESTIMATE_RESPONSE_REJECTED: {
    name: "Handling Response Rejection",
    description:
      "Processing rejection of client response and planning alternatives",
    icon: "rejected",
  },
} as const;

// Transform status history into activity timeline format
const transformStatusToActivity = (
  statusHistory: StatusHistoryItem[],
  teamMembers: TeamMember[],
): ActivityItem[] => {
  if (!statusHistory || statusHistory.length === 0) return [];

  // Sort status history by creation time (oldest first for timeline)
  const sortedHistory = [...statusHistory].sort(
    (a, b) => a._creationTime - b._creationTime,
  );

  return sortedHistory.map((status, index) => {
    const statusInfo =
      statusMapping[status.status as keyof typeof statusMapping];
    const isLatest = index === sortedHistory.length - 1;
    const nextStatus = sortedHistory[index + 1];

    // Calculate duration - how long this step took until next step started
    let duration = "";
    if (nextStatus) {
      const timeDiff = nextStatus._creationTime - status._creationTime;
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        duration = `${days}d ${hours}h`;
      } else if (hours > 0) {
        duration = `${hours}h ${minutes}m`;
      } else {
        duration = `${minutes}m`;
      }
    }

    // Status logic: Latest status is "in progress", previous ones are "completed"
    const inProgress = isLatest;
    const completed = !isLatest; // Previous statuses are completed when next one started

    // Find relevant team member for this status
    const getAssignedUser = () => {
      // For review statuses, try to find an ESTIMATOR
      if (
        status.status.includes("REVIEW") ||
        status.status.includes("ESTIMATE")
      ) {
        return teamMembers?.find((member) => member.type === "ESTIMATOR")?.user;
      }
      // For qualification and sending statuses, try to find BD
      if (
        status.status.includes("QUALIFIER") ||
        status.status.includes("SEND")
      ) {
        return teamMembers?.find((member) => member.type === "BD")?.user;
      }
      // For team building, find the person who assigned (usually BD)
      if (status.status === "BUILD_TEAM") {
        return teamMembers?.find((member) => member.type === "BD")?.user;
      }
      // Default to first team member
      return teamMembers?.[0]?.user;
    };

    const assignedUser = getAssignedUser();

    return {
      id: status._id,
      status: status.status,
      name: statusInfo?.name || status.name,
      description: statusInfo?.description || `Status: ${status.status}`,
      completed: completed,
      inProgress: inProgress,
      pending: false,
      // For completed statuses, show when they were completed (when next status started)
      completedAt:
        completed && nextStatus
          ? new Date(nextStatus._creationTime).toLocaleString()
          : undefined,
      // For completed statuses, show who was performing this step
      completedBy: completed
        ? {
            name: assignedUser?.name || "System",
            role:
              teamMembers?.find((m) => m.user?._id === assignedUser?._id)
                ?.type || "AUTO",
            avatar: assignedUser?.name?.substring(0, 2).toUpperCase() || "SY",
          }
        : undefined,
      // For in-progress status, show when it started
      startedAt: inProgress
        ? new Date(status._creationTime).toLocaleString()
        : undefined,
      // For in-progress status, show who is currently performing it
      assignedTo: inProgress
        ? {
            name: assignedUser?.name || "Unassigned",
            role:
              teamMembers?.find((m) => m.user?._id === assignedUser?._id)
                ?.type || "UNKNOWN",
            avatar: assignedUser?.name?.substring(0, 2).toUpperCase() || "??",
          }
        : undefined,
      duration: duration || (inProgress ? "In progress..." : "Unknown"),
    };
  });
};

const getStatusIcon = (activity: ActivityItem) => {
  if (activity.completed) {
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  } else if (activity.inProgress) {
    return <AlertCircle className="h-5 w-5 text-blue-600" />;
  } else if (activity.pending) {
    return <Circle className="h-5 w-5 text-gray-400" />;
  }
  return <XCircle className="h-5 w-5 text-red-500" />;
};

const getStatusBadge = (activity: ActivityItem) => {
  if (activity.completed) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Completed
      </Badge>
    );
  } else if (activity.inProgress) {
    return (
      <Badge variant="default" className="bg-blue-100 text-blue-800">
        In Progress
      </Badge>
    );
  } else if (activity.pending) {
    return <Badge variant="secondary">Pending</Badge>;
  }
  return <Badge variant="destructive">Failed</Badge>;
};

export const ActivityTab = ({
  leadData,
  teamMembers,
}: {
  leadData: TLeadData;
  teamMembers: TeamMember[];
}) => {
  if (!leadData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  const activityTimeline = transformStatusToActivity(
    leadData.status_history || [],
    teamMembers || [],
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Lead Activity Timeline</h2>
        <p className="text-sm text-muted-foreground">
          Track the progress and current activities being performed on this lead
        </p>
      </div>

      <Separator />

      {/* Timeline */}
      {activityTimeline.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No Activity Found</p>
          <p className="text-sm text-muted-foreground">
            This lead doesn&apos;t have any recorded activity yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activityTimeline
            .reverse() // Show most recent first
            .map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Timeline line */}
                {index < activityTimeline.length - 1 && (
                  <div className="absolute left-[10px] top-8 h-16 w-0.5 bg-border" />
                )}

                <div className="flex gap-4">
                  {/* Status Icon */}
                  <div className="relative flex-shrink-0">
                    {getStatusIcon(activity)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{activity.name}</h4>
                        {getStatusBadge(activity)}
                      </div>
                      {activity.duration && (
                        <span className="text-sm text-muted-foreground">
                          Duration: {activity.duration}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>

                    {/* Completed info */}
                    {activity.completed && activity.completedBy && (
                      <div className="flex items-center gap-2 text-sm">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {activity.completedBy.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">
                          Performed by{" "}
                          <strong>{activity.completedBy.name}</strong> •
                          Completed on {activity.completedAt}
                        </span>
                      </div>
                    )}

                    {/* In progress info */}
                    {activity.inProgress && activity.assignedTo && (
                      <div className="flex items-center gap-2 text-sm">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {activity.assignedTo.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">
                          Currently being performed by{" "}
                          <strong>{activity.assignedTo.name}</strong> • Started{" "}
                          {activity.startedAt}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      <Separator />
    </div>
  );
};
