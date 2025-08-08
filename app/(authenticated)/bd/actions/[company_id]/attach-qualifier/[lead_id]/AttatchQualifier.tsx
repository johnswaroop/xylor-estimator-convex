"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Mail,
  Building,
  Phone,
  Building2,
  Search,
  Clock,
  FileText,
  CheckCircle,
  Info,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "convex/react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AttatchQualifier({
  company_id,
  lead_id,
}: {
  company_id: string;
  lead_id: string;
}) {
  console.log(company_id, lead_id);
  const [lockQualifier, setLockQualifier] = useState(true);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const router = useRouter();
  const attachFormToLead = useMutation(api.form_service.attachFormToLead);
  const [isLoading, setIsLoading] = useState(false);

  //set status to attach qualifier on enter
  const attachQualifierStatus = useMutation(api.status_service.registerStatus);
  useEffect(() => {
    if (lead_id) {
      attachQualifierStatus({
        lead_id: lead_id as Id<"lead">,
        statusName: "ATTATCH_QUALIFIER",
        patch: true,
      });
    }
  }, [lead_id, attachQualifierStatus]);

  //get lead information
  const leadDetails = useQuery(api.lead_service.getLeadById, {
    lead_id: lead_id as Id<"lead">,
    company_id: company_id as Id<"company">,
  });

  // Check if form is already attached
  const existingForm = useQuery(api.form_service.getFormByLeadId, {
    lead_id: lead_id as Id<"lead">,
  });

  // Set selected form if one already exists
  useEffect(() => {
    if (existingForm && existingForm.valid) {
      setSelectedForm(existingForm.form_name);
    }
  }, [existingForm]);

  const handleSaveAndContinue = async () => {
    // TODO: Implement save and continue functionality
    setIsLoading(true);
    if (!selectedForm) {
      toast.error("Please select a qualifier form first");
      setIsLoading(false);
      return;
    }

    try {
      const res = await attachFormToLead({
        form_name: selectedForm,
        lead_id: lead_id as Id<"lead">,
        company_id: company_id as Id<"company">,
        sendToNextStatus: lockQualifier,
      });

      console.log(res);

      if (lockQualifier) {
        toast.success("Qualifier saved! Redirecting to next step...");
        router.push(`/bd/actions/${company_id}/send-qualifier/${lead_id}`);
      } else {
        toast.success("Qualifier saved successfully");
        router.push(`/funnel`);
      }
    } catch (error) {
      toast.error("Failed to save qualifier");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!leadDetails) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Lead Information Header */}
      <LeadInfo leadDetails={leadDetails.lead} />

      {/* Existing Form Alert */}
      {existingForm && existingForm.valid && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            This lead already has a qualifier form attached:{" "}
            <strong>{existingForm.form_name}</strong>
            {existingForm.email_sent && (
              <span className="text-amber-600"> (Email has been sent)</span>
            )}
            {existingForm.response_received && (
              <span className="text-green-600"> (Response received)</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Qualifier Section */}
      <QualifierSection
        selectedForm={selectedForm}
        setSelectedForm={setSelectedForm}
        existingForm={existingForm}
      />

      {/* Save Section */}
      <div className="mt-8 flex items-center justify-end gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="attach-qualifier"
            checked={lockQualifier}
            onCheckedChange={(checked) => setLockQualifier(checked as boolean)}
          />
          <label
            htmlFor="attach-qualifier"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Lock the qualifier and continue to next step
          </label>
        </div>

        <div className="flex gap-3">
          <Button
            disabled={isLoading || !selectedForm}
            onClick={handleSaveAndContinue}
          >
            {isLoading ? (
              <Loader />
            ) : existingForm?.valid ? (
              "Update & Continue"
            ) : (
              "Save & Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

const LeadInfo = ({ leadDetails }: { leadDetails: Doc<"lead"> }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Attach Qualifier
          </h1>
          <p className="text-muted-foreground">
            Attach a qualifier to this lead
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Building className="h-5 w-5" />
            Lead Information
          </CardTitle>
        </CardHeader>
        {/* lead name  */}

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">{leadDetails.name}</p>
                <p className="text-sm text-muted-foreground">Lead Name</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">{leadDetails.email}</p>
                <p className="text-sm text-muted-foreground">Email</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">{leadDetails.phone}</p>
                <p className="text-sm text-muted-foreground">Phone</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const QualifierSection = ({
  selectedForm,
  setSelectedForm,
  existingForm,
}: {
  selectedForm: string | null;
  setSelectedForm: (formId: string | null) => void;
  existingForm: Doc<"qualification_form"> | null | undefined;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock data for form library - in real app this would come from a query
  const formLibrary = [
    {
      id: "Qualifier Form",
      name: "Qualifier Form",
      description:
        "A standard qualification form to assess lead readiness, including budget, decision-making, timeline, and project requirements.",
      category: "Qualifier Form",
      questions: 8,
      estimatedTime: "5-7 minutes",
      preview: [
        "What is your budget range for this project?",
        "Who approves the budget decisions?",
        "When do you plan to make the purchase?",
      ],
    },
  ];
  const categories = [
    { id: "all", label: "All Forms", count: formLibrary.length },
  ];

  const filteredForms = formLibrary.filter((form) => {
    const matchesSearch =
      form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || form.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      budget:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      timeline: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      decision:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      needs:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      competition: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      technical:
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Select Qualifier Form
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose a qualifier form from your library to attach to this lead
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Filter */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search forms by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Tabs */}
            <Tabs
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-7">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="text-xs"
                  >
                    {category.label}
                    <Badge variant="secondary" className="ml-1 h-4 text-xs">
                      {category.count}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Forms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredForms.map((form) => (
              <Card
                key={form.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedForm === form.id
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedForm(form.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{form.name}</CardTitle>
                      <Badge
                        className={`text-xs ${getCategoryBadgeColor(form.category)}`}
                      >
                        {form.category.charAt(0).toUpperCase() +
                          form.category.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {form.description}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Form Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {form.estimatedTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {form.questions} questions
                      </div>
                    </div>

                    {/* Preview Questions */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Sample Questions
                      </p>
                      <div className="space-y-1">
                        {form.preview.slice(0, 2).map((question, index) => (
                          <p
                            key={index}
                            className="text-xs text-muted-foreground"
                          >
                            • {question}
                          </p>
                        ))}
                        {form.preview.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{form.preview.length - 2} more questions
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                        View Form
                      </Button>
                      {selectedForm === form.id && (
                        <div className="flex items-center gap-2 text-primary">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredForms.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No forms found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or category filter
              </p>
            </div>
          )}

          {/* Selected Form Summary */}
          {selectedForm && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        {formLibrary.find((f) => f.id === selectedForm)?.name}{" "}
                        {existingForm?.valid ? "will be updated" : "selected"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {existingForm?.valid
                          ? "This will update the existing qualifier form"
                          : "This qualifier will be attached to the lead"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedForm(null)}
                  >
                    Change Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
