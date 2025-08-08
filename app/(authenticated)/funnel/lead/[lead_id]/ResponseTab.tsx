import { Skeleton } from "@/components/ui/skeleton";
import { TFormData } from "./LeadView";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FormResponse {
  name: string;
  phone: string;
  role: string;
  companyName: string;
  projectTitle: string;
  location: string;
  projectDescription: string;
  projectType: "houses" | "flats" | "mixed" | "mixed-commercial" | "commercial";
  fundingSecured:
    | "applied-for"
    | "indicative-terms-issued"
    | "approved"
    | "other";
  lenderName?: string;
  planningGranted: "yes" | "no";
  planningGrantedDate?: string;
  approvalStatus:
    | "pre-planning"
    | "application-submitted"
    | "planning-granted"
    | "conditions-discharged";
  architecturePlans:
    | "none"
    | "planning-drawings"
    | "floor-plans-elevations"
    | "full-construction-drawings";
  timeline:
    | "asap"
    | "1-3months"
    | "3-6months"
    | "6-12months"
    | "over-12months"
    | "flexible";
  additionalInfo?: string;
  services: Array<
    | "panel-supply-install"
    | "project-management"
    | "main-contracting"
    | "funding"
    | "other"
  >;
  services_other?: string;
  files?: Array<{
    name: string;
    link: string;
    size?: number;
    type?: string;
  }>;
}

const transformProjectType = (type: string): string => {
  const typeMap: Record<string, string> = {
    houses: "Houses",
    flats: "Flats",
    mixed: "Mixed",
    "mixed-commercial": "Mixed Commercial",
    commercial: "Commercial",
  };
  return typeMap[type] || type;
};

const transformFundingStatus = (
  status: string,
): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} => {
  const statusMap: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    "applied-for": { label: "Applied For", variant: "outline" },
    "indicative-terms-issued": {
      label: "Terms Issued",
      variant: "secondary",
    },
    approved: { label: "Approved", variant: "default" },
    other: { label: "Other", variant: "outline" },
  };
  return statusMap[status] || { label: status, variant: "outline" };
};

const transformPlanningStatus = (
  granted: string,
): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} => {
  return granted === "yes"
    ? { label: "Granted", variant: "default" }
    : { label: "Pending", variant: "outline" };
};

const transformServices = (
  services: string[],
  servicesOther?: string,
): string[] => {
  const serviceMap: Record<string, string> = {
    "panel-supply-install": "Panel Supply & Install",
    "project-management": "Project Management",
    "main-contracting": "Main Contracting",
    funding: "Funding",
    other: "Other",
  };

  const transformedServices = services.map(
    (service) => serviceMap[service] || service,
  );
  if (servicesOther && services.includes("other")) {
    const index = transformedServices.indexOf("Other");
    if (index !== -1) {
      transformedServices[index] = servicesOther;
    }
  }
  return transformedServices;
};

const transformTimeline = (timeline: string): string => {
  const timelineMap: Record<string, string> = {
    asap: "ASAP",
    "1-3months": "1-3 months",
    "3-6months": "3-6 months",
    "6-12months": "6-12 months",
    "over-12months": "Over 12 months",
    flexible: "Flexible",
  };
  return timelineMap[timeline] || timeline;
};

export const ResponseTab = ({ formData }: { formData: TFormData }) => {
  // Loading state
  if (formData === undefined) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Separator />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No form exists
  if (formData === null) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold">Qualification Form Response</h2>
          <p className="text-sm text-muted-foreground">
            No qualification form has been created for this lead yet.
          </p>
        </div>
        <Separator />
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No Form Available</p>
          <p className="text-sm text-muted-foreground">
            A qualification form needs to be created and sent to the client
            first.
          </p>
        </div>
      </div>
    );
  }

  // Form exists but no response received
  if (
    !formData.response_received ||
    !formData.response ||
    Object.keys(formData.response).length === 0
  ) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold">Qualification Form Response</h2>
          <p className="text-sm text-muted-foreground">
            Qualification form was sent on{" "}
            {new Date(formData._creationTime).toLocaleDateString()}
          </p>
        </div>
        <Separator />
        <div className="text-center py-12">
          <Circle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Awaiting Client Response</p>
          <p className="text-sm text-muted-foreground">
            The client has not submitted their qualification form response yet.
          </p>
        </div>
      </div>
    );
  }

  // Extract response data
  const response = formData.response as FormResponse;
  const fundingStatus = transformFundingStatus(response.fundingSecured);
  const planningStatus = transformPlanningStatus(response.planningGranted);
  const services = transformServices(
    response.services,
    response.services_other,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Qualification Form Response</h2>
        <p className="text-sm text-muted-foreground">
          Client submitted qualification form on{" "}
          {new Date(formData._creationTime).toLocaleDateString()}
        </p>
      </div>

      <Separator />

      {/* Personal Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Personal Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <p className="text-sm text-muted-foreground">
              {response.name || "Not provided"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <p className="text-sm text-muted-foreground">
              {response.phone || "Not provided"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <p className="text-sm text-muted-foreground">
              {response.role || "Not provided"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Company</label>
            <p className="text-sm text-muted-foreground">
              {response.companyName || "Not provided"}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Project Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Project Information</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project Title</label>
            <p className="text-sm text-muted-foreground">
              {response.projectTitle || "Not provided"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Location</label>
            <p className="text-sm text-muted-foreground">
              {response.location || "Not provided"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Project Type</label>
            {response.projectType ? (
              <Badge variant="outline">
                {transformProjectType(response.projectType)}
              </Badge>
            ) : (
              <p className="text-sm text-muted-foreground">Not provided</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Project Description</label>
            <p className="text-sm text-muted-foreground">
              {response.projectDescription || "Not provided"}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Funding & Planning */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Funding & Planning</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Funding Secured</label>
            {response.fundingSecured ? (
              <Badge
                variant={fundingStatus.variant}
                className={
                  fundingStatus.variant === "default"
                    ? "bg-green-100 text-green-800"
                    : ""
                }
              >
                {fundingStatus.label}
              </Badge>
            ) : (
              <p className="text-sm text-muted-foreground">Not provided</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Lender</label>
            <p className="text-sm text-muted-foreground">
              {response.lenderName || "Not provided"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Planning Permission</label>
            {response.planningGranted ? (
              <Badge
                variant={planningStatus.variant}
                className={
                  planningStatus.variant === "default"
                    ? "bg-green-100 text-green-800"
                    : ""
                }
              >
                {planningStatus.label}
              </Badge>
            ) : (
              <p className="text-sm text-muted-foreground">Not provided</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Planning Date</label>
            <p className="text-sm text-muted-foreground">
              {response.planningGrantedDate || "Not provided"}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Services Required */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Services Required</h3>
        <div className="flex flex-wrap gap-2">
          {services.length > 0 ? (
            services.map((service, index) => (
              <Badge key={index} variant="outline">
                {service}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No services specified
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Project Timeline</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Preferred Start</label>
          {response.timeline ? (
            <Badge variant="secondary">
              {transformTimeline(response.timeline)}
            </Badge>
          ) : (
            <p className="text-sm text-muted-foreground">Not provided</p>
          )}
        </div>
      </div>

      {/* Additional Information */}
      {response.additionalInfo && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            <p className="text-sm text-muted-foreground">
              {response.additionalInfo}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
