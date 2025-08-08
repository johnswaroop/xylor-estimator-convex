"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, TrashIcon } from "lucide-react";
import { useMutation, useQueries } from "convex/react";
import { api } from "@/convex/_generated/api";
import Loader from "@/components/Loader";
import { Id } from "@/convex/_generated/dataModel";
import { makeUseQueryWithStatus } from "convex-helpers/react";
import { toast } from "sonner";
import { useUploadToS3 } from "@/hooks/useUploadToS3";

// ==========================================
// CONSTANTS AND CONFIGURATION
// ==========================================

const PROJECT_TYPES = [
  { value: "houses", label: "Houses" },
  { value: "flats", label: "Flats" },
  { value: "mixed", label: "Mixed Development" },
  { value: "mixed-commercial", label: "Mixed Commercial" },
  { value: "commercial", label: "Commercial" },
];

const SERVICE_OPTIONS = [
  { value: "panel-supply-install", label: "Panel Supply & Install" },
  { value: "project-management", label: "Project Management" },
  { value: "main-contracting", label: "Main Contracting" },
  { value: "funding", label: "Funding" },
  { value: "other", label: "Other" },
];

const FUNDING_OPTIONS = [
  { value: "applied-for", label: "Applied For" },
  { value: "indicative-terms-issued", label: "Indicative Terms Issued" },
  { value: "approved", label: "Approved" },
  { value: "other", label: "Other" },
];

const APPROVAL_STATUS_OPTIONS = [
  { value: "pre-planning", label: "Pre-Planning" },
  { value: "application-submitted", label: "Application Submitted" },
  { value: "planning-granted", label: "Planning Granted" },
  { value: "conditions-discharged", label: "Conditions Discharged" },
];

const ARCHITECTURE_PLANS_OPTIONS = [
  { value: "none", label: "None" },
  { value: "planning-drawings", label: "Planning Drawings" },
  { value: "floor-plans-elevations", label: "Floor Plans & Elevations" },
  { value: "full-construction-drawings", label: "Full Construction Drawings" },
];

const TIMELINE_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-3months", label: "1-3 months" },
  { value: "3-6months", label: "3-6 months" },
  { value: "6-12months", label: "6-12 months" },
  { value: "over-12months", label: "Over 12 months" },
  { value: "flexible", label: "Flexible" },
];

const FORM_STEPS = [
  {
    title: "Personal Details",
    description: "Tell us about yourself and your company",
  },
  { title: "Project Details", description: "Share your project information" },
  {
    title: "Project Specifications",
    description: "Technical details and requirements",
  },
  {
    title: "Timeline & Budget",
    description: "Financial and timing considerations",
  },
  {
    title: "Services & Files",
    description: "Required services and document uploads",
  },
  {
    title: "Review & Submit",
    description: "Review your information before submitting",
  },
];

// ==========================================
// FORM VALIDATION SCHEMA
// ==========================================

const formSchema = z.object({
  // Personal Details
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  role: z.string().min(2, "Role is required"),
  companyName: z.string().min(2, "Company name is required"),

  // Project Details
  projectTitle: z.string().min(2, "Project title is required"),
  location: z.string().min(2, "Location is required"),
  projectDescription: z
    .string()
    .min(10, "Description must be at least 10 characters"),
  projectType: z.enum([
    "houses",
    "flats",
    "mixed",
    "mixed-commercial",
    "commercial",
  ]),

  // Funding & Permits
  fundingSecured: z.enum([
    "applied-for",
    "indicative-terms-issued",
    "approved",
    "other",
  ]),
  lenderName: z.string().optional(),
  planningGranted: z.enum(["yes", "no"]),
  planningGrantedDate: z.string().optional(),
  approvalStatus: z.enum([
    "pre-planning",
    "application-submitted",
    "planning-granted",
    "conditions-discharged",
  ]),

  // Architecture Plans
  architecturePlans: z.enum([
    "none",
    "planning-drawings",
    "floor-plans-elevations",
    "full-construction-drawings",
  ]),

  // Timeline
  timeline: z.enum([
    "asap",
    "1-3months",
    "3-6months",
    "6-12months",
    "over-12months",
    "flexible",
  ]),

  // Additional Info
  additionalInfo: z.string().optional(),

  // Services
  services: z
    .array(
      z.enum([
        "panel-supply-install",
        "project-management",
        "main-contracting",
        "funding",
        "other",
      ]),
    )
    .min(1, "At least one service must be selected"),
  services_other: z.string().optional(),

  // Files
  files: z
    .array(
      z.object({
        name: z.string(),
        link: z.string(),
        size: z.number().optional(),
        type: z.string().optional(),
      }),
    )
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

// ==========================================
// REUSABLE COMPONENTS
// ==========================================

interface FormStepProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const FormStep = ({ title, description, children }: FormStepProps) => (
  <Card className="w-full max-w-4xl mx-auto">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">{children}</CardContent>
  </Card>
);

// ==========================================
// PROGRESS INDICATOR COMPONENT
// ==========================================

interface ProgressIndicatorProps {
  currentStep: number;
  steps: typeof FORM_STEPS;
  form: ReturnType<typeof useForm<FormData>>;
}

const ProgressIndicator = ({
  currentStep,
  steps,
  form,
}: ProgressIndicatorProps) => {
  const getStepValidationStatus = (stepIndex: number) => {
    if (stepIndex > currentStep) return "future";
    if (stepIndex === currentStep) return "current";

    // Check if previous steps have validation errors
    const stepFields = STEP_FIELDS[stepIndex as keyof typeof STEP_FIELDS];
    const hasErrors = stepFields.some(
      (field) =>
        form.formState.errors[field as keyof typeof form.formState.errors],
    );

    return hasErrors ? "error" : "completed";
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-2 mb-6">
        {steps.map((step, index) => {
          const status = getStepValidationStatus(index);
          return (
            <div key={index} className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full transition-colors ${
                  status === "current"
                    ? "bg-primary"
                    : status === "completed"
                      ? "bg-green-500"
                      : status === "error"
                        ? "bg-red-500"
                        : "bg-gray-300"
                }`}
              />
              {index < steps.length - 1 && (
                <div className="w-4 h-px bg-gray-300" />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-1">
          Step {currentStep + 1} of {steps.length}
        </p>
        <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
        <p className="text-gray-600">{steps[currentStep].description}</p>
      </div>
    </div>
  );
};

// ==========================================
// NAVIGATION BUTTONS COMPONENT
// ==========================================

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => Promise<void>;
  isValidating?: boolean;
}

const NavigationButtons = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  isValidating = false,
}: NavigationButtonsProps) => (
  <div className="flex justify-between max-w-4xl mx-auto">
    <Button
      type="button"
      variant="outline"
      onClick={onPrevious}
      disabled={currentStep === 0 || isValidating}
      className="flex items-center space-x-2"
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Previous</span>
    </Button>

    {currentStep < totalSteps - 1 ? (
      <Button
        type="button"
        onClick={onNext}
        disabled={isValidating}
        className="flex items-center space-x-2"
      >
        <span>{isValidating ? "Validating..." : "Next"}</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    ) : (
      <Button
        key="submit-button"
        type="submit"
        disabled={isValidating}
        className="flex items-center space-x-2"
      >
        <span>{isValidating ? "Submitting..." : "Submit Project Request"}</span>
      </Button>
    )}
  </div>
);

// ==========================================
// FILE UPLOAD COMPONENT
// ==========================================

const FileUploadComponent = ({
  form,
}: {
  form: ReturnType<typeof useForm<FormData>>;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      key: string;
      url: string;
    }[]
  >([]);

  const { upload, isUploading } = useUploadToS3();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newFiles = Array.from(event.target.files || []);
    setFiles([...files, ...newFiles]);
    //generate presigned url for the recent file
    const uploadResult = await upload(newFiles[newFiles.length - 1]);
    setUploadedFiles([
      ...uploadedFiles,
      {
        key: uploadResult.key || "",
        url: uploadResult.url || "",
      },
    ]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const removeAllFiles = () => {
    setFiles([]);
    setUploadedFiles([]);
  };

  useEffect(() => {
    form.setValue(
      "files",
      uploadedFiles.map((file, index) => ({
        name: files[index]?.name || file.key,
        link: file.key, // Store S3 key instead of upload URL
        size: files[index]?.size || 0,
        type: files[index]?.type || file.key.split(".").pop(),
      })),
    );
  }, [uploadedFiles, files, form]);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="relative">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors bg-gray-50/50">
          {!isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  Click to upload files
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG, GIF, DWG, ZIP files up to 10MB
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <Loader />
              </div>
              <p className="text-sm text-gray-700">Uploading files...</p>
            </div>
          )}
        </div>
        <Input
          disabled={isUploading}
          type="file"
          onChange={handleFileChange}
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Uploaded Files ({files.length})
            </h4>
            {files.length > 1 && (
              <Button
                onClick={removeAllFiles}
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleRemoveFile(index)}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0 flex-shrink-0"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// FORM STEP COMPONENTS
// ==========================================

interface StepProps {
  form: ReturnType<typeof useForm<FormData>>;
}

const PersonalDetailsStep = ({ form }: StepProps) => (
  <FormStep
    title="Personal Details"
    description="Tell us about yourself and your company"
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter your full name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number *</FormLabel>
            <FormControl>
              <Input placeholder="Enter your phone number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Your Role *</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Project Manager, Owner, Architect"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="companyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter your company name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </FormStep>
);

const ProjectDetailsStep = ({ form }: StepProps) => (
  <FormStep
    title="Project Details"
    description="Share your project information"
  >
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="projectTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Title/Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter your project title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location *</FormLabel>
              <FormControl>
                <Input placeholder="Enter project location" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="projectDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Description *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Give us a detailed description of your project..."
                rows={5}
                {...field}
              />
            </FormControl>
            <FormDescription>
              Please provide as much detail as possible about your project
              scope, requirements, and objectives.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="projectType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Type *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PROJECT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </FormStep>
);

const ProjectSpecificationsStep = ({ form }: StepProps) => (
  <FormStep
    title="Project Specifications"
    description="Funding, permits, and planning details"
  >
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Funding Details</h3>

        <FormField
          control={form.control}
          name="fundingSecured"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Funding Status *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select funding status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FUNDING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("fundingSecured") !== "applied-for" && (
          <FormField
            control={form.control}
            name="lenderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lender Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter lender name (optional)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Planning Permission</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="planningGranted"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Is planning permission granted? *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("planningGranted") === "yes" && (
            <FormField
              control={form.control}
              name="planningGrantedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planning Granted Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="approvalStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What&apos;s the status of your approvals? *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select approval status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {APPROVAL_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="architecturePlans"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                What&apos;s the status of your architecture plans? *
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ARCHITECTURE_PLANS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  </FormStep>
);

const TimelineBudgetStep = ({ form }: StepProps) => (
  <FormStep
    title="Timeline & Additional Info"
    description="Project timeline and additional considerations"
  >
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="timeline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What&apos;s the preferred timeline? *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred timeline" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {TIMELINE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="additionalInfo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Information</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Are there any additional information that you would like to share with us?"
                rows={4}
                {...field}
              />
            </FormControl>
            <FormDescription>
              Please share any other relevant details, special requirements, or
              considerations for your project.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </FormStep>
);

const ServicesFilesStep = ({ form }: StepProps) => (
  <FormStep
    title="Services & Files"
    description="Required services and document uploads"
  >
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="services"
        render={() => (
          <FormItem>
            <FormLabel>Services Required *</FormLabel>
            <FormDescription>
              Select all services that you would require for your project:
            </FormDescription>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {SERVICE_OPTIONS.map((service) => (
                <FormField
                  key={service.value}
                  control={form.control}
                  name="services"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={service.value}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(
                              service.value as
                                | "panel-supply-install"
                                | "project-management"
                                | "main-contracting"
                                | "funding"
                                | "other",
                            )}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([
                                    ...field.value,
                                    service.value as
                                      | "panel-supply-install"
                                      | "project-management"
                                      | "main-contracting"
                                      | "funding"
                                      | "other",
                                  ])
                                : field.onChange(
                                    field.value?.filter(
                                      (value: string) =>
                                        value !== service.value,
                                    ),
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">
                          {service.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("services")?.includes("other") && (
        <FormField
          control={form.control}
          name="services_other"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Please specify other services</FormLabel>
              <FormControl>
                <Input
                  placeholder="Describe the other services you need..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <Separator />
      <FileUploadComponent form={form} />
    </div>
  </FormStep>
);

const ReviewSubmitStep = ({
  form,
  uploadedFiles,
}: StepProps & { uploadedFiles: File[] }) => {
  const getProjectTypeLabel = (value: string) => {
    return PROJECT_TYPES.find((type) => type.value === value)?.label || value;
  };

  const getFundingLabel = (value: string) => {
    return (
      FUNDING_OPTIONS.find((option) => option.value === value)?.label || value
    );
  };

  const getTimelineLabel = (value: string) => {
    return (
      TIMELINE_OPTIONS.find((option) => option.value === value)?.label || value
    );
  };

  const getServicesLabels = (values: string[]) => {
    return values
      .map(
        (value) =>
          SERVICE_OPTIONS.find((option) => option.value === value)?.label ||
          value,
      )
      .join(", ");
  };

  return (
    <FormStep
      title="Review & Submit"
      description="Review your information before submitting"
    >
      <div className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="font-semibold text-lg">Personal Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Name:</strong> {form.watch("name")}
            </div>
            <div>
              <strong>Phone:</strong> {form.watch("phone")}
            </div>
            <div>
              <strong>Role:</strong> {form.watch("role")}
            </div>
            <div>
              <strong>Company:</strong> {form.watch("companyName")}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="font-semibold text-lg">Project Information</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Title:</strong> {form.watch("projectTitle")}
            </div>
            <div>
              <strong>Location:</strong> {form.watch("location")}
            </div>
            <div>
              <strong>Type:</strong>{" "}
              {getProjectTypeLabel(form.watch("projectType") || "")}
            </div>
            <div>
              <strong>Timeline:</strong>{" "}
              {getTimelineLabel(form.watch("timeline") || "")}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="font-semibold text-lg">Funding & Planning</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Funding Status:</strong>{" "}
              {getFundingLabel(form.watch("fundingSecured") || "")}
            </div>
            {form.watch("lenderName") && (
              <div>
                <strong>Lender:</strong> {form.watch("lenderName")}
              </div>
            )}
            <div>
              <strong>Planning Granted:</strong>{" "}
              {form.watch("planningGranted") === "yes" ? "Yes" : "No"}
            </div>
            {form.watch("planningGrantedDate") && (
              <div>
                <strong>Planning Date:</strong>{" "}
                {form.watch("planningGrantedDate")}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="font-semibold text-lg">Services Required</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Services:</strong>{" "}
              {getServicesLabels(form.watch("services") || [])}
            </div>
            {form.watch("services_other") && (
              <div>
                <strong>Other Services:</strong> {form.watch("services_other")}
              </div>
            )}
          </div>
        </div>

        {form.watch("additionalInfo") && (
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Additional Information</h3>
            <div className="text-sm">{form.watch("additionalInfo")}</div>
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Uploaded Files</h3>
            <div className="space-y-1 text-sm">
              {uploadedFiles.map((file, index) => (
                <div key={index}>• {file.name}</div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center pt-4">
          <p className="text-sm text-gray-600 mb-4">
            Please review all the information above and click &quot;Submit
            Project Request&quot; below to submit your form.
          </p>
        </div>
      </div>
    </FormStep>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export const useQueryWithStatus = makeUseQueryWithStatus(useQueries);

export default function ProjectEstimateForm({ form_id }: { form_id: string }) {
  const { error, isPending } = useQueryWithStatus(api.form_service.getForm, {
    form_id: form_id as Id<"qualification_form">,
  });

  const recordFormResponse = useMutation(api.form_service.recordFormResponse);

  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles] = useState<File[]>([]);

  const [isValidating, setIsValidating] = useState(false);

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      role: "",
      companyName: "",
      projectTitle: "",
      location: "",
      projectDescription: "",
      projectType: undefined,
      fundingSecured: undefined,
      lenderName: "",
      planningGranted: undefined,
      planningGrantedDate: "",
      approvalStatus: undefined,
      architecturePlans: undefined,
      timeline: undefined,
      additionalInfo: "",
      services: [],
      services_other: "",
      files: [],
    },
  });

  // Navigation handlers
  const nextStep = async () => {
    setIsValidating(true);

    try {
      // Get the fields for the current step
      const currentStepFields =
        STEP_FIELDS[currentStep as keyof typeof STEP_FIELDS];

      // Trigger validation for current step fields
      const isValid = await form.trigger(currentStepFields);

      // Additional validation for specific steps
      if (currentStep === 4) {
        // Services step - check if at least one service is selected
        const services = form.getValues("services");
        if (!services || services.length === 0) {
          form.setError("services", {
            type: "manual",
            message: "At least one service must be selected",
          });
          return;
        }
      }

      // Only proceed if validation passes
      if (isValid && currentStep < FORM_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else if (!isValid) {
        // Scroll to first error field
        setTimeout(() => {
          const errorElement = document.querySelector(
            '[data-invalid="true"]',
          ) as HTMLElement;
          if (errorElement) {
            errorElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            errorElement.focus();
          }
        }, 100);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (isValidating) return; // Prevent multiple submissions

    setIsValidating(true);

    try {
      console.log("Form submitted:", data);
      console.log("Uploaded files:", uploadedFiles);

      // Prepare the response data with uploaded files
      const responseData = {
        ...data,
      };

      const response = await recordFormResponse({
        form_id: form_id as Id<"qualification_form">,
        response: responseData,
      });

      //update status to QUALIFIER_RECEIVED

      if (response.success) {
        toast.success("Form response recorded successfully");
      } else {
        toast.error("Failed to record form response");
        console.error(response.error_message);
      }
    } catch (error) {
      toast.error("An error occurred while submitting the form");
      console.error("Form submission error:", error);
    } finally {
      setIsValidating(false);
    }
  };

  // Step renderer
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <PersonalDetailsStep form={form} />;
      case 1:
        return <ProjectDetailsStep form={form} />;
      case 2:
        return <ProjectSpecificationsStep form={form} />;
      case 3:
        return <TimelineBudgetStep form={form} />;
      case 4:
        return <ServicesFilesStep form={form} />;
      case 5:
        return <ReviewSubmitStep form={form} uploadedFiles={uploadedFiles} />;
      default:
        return null;
    }
  };

  // Loading state
  if (isPending) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Form Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              The qualification form you&apos;re looking for could not be found.
              This may be because:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
              <li>The form link has expired</li>
              <li>The form has been removed</li>
              <li>There was an error in the link</li>
            </ul>
            <p className="text-gray-600">
              Please contact the person who sent you this form for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <ProgressIndicator
          currentStep={currentStep}
          steps={FORM_STEPS}
          form={form}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {renderStep()}
            <NavigationButtons
              currentStep={currentStep}
              totalSteps={FORM_STEPS.length}
              onPrevious={prevStep}
              onNext={nextStep}
              isValidating={isValidating}
            />
          </form>
        </Form>
      </div>
    </div>
  );
}

// ==========================================
// STEP FIELD MAPPING
// ==========================================

const STEP_FIELDS = {
  0: ["name", "phone", "role", "companyName"], // Personal Details
  1: ["projectTitle", "location", "projectDescription", "projectType"], // Project Details
  2: [
    "fundingSecured",
    "planningGranted",
    "approvalStatus",
    "architecturePlans",
  ], // Project Specifications (lenderName, planningGrantedDate are optional)
  3: ["timeline"], // Timeline & Additional Info (additionalInfo is optional)
  4: ["services"], // Services & Files (services_other, files are handled separately)
  5: [], // Review & Submit (no additional validation needed)
} as const;
