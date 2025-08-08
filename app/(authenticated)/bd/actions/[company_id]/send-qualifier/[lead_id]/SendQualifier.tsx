"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  Mail,
  Building2,
  Phone,
  Building,
  AlertCircle,
  ExternalLink,
  Eye,
  Edit,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Loader from "@/components/Loader";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Type for validation error details
interface ValidationError {
  field: string;
  message: string;
}

function SendQualifier({
  company_id,
  lead_id,
  sendgrid_from_email,
}: {
  company_id: string;
  lead_id: string;
  sendgrid_from_email: string;
}) {
  // Get lead information
  const leadDetails = useQuery(api.lead_service.getLeadById, {
    lead_id: lead_id as Id<"lead">,
    company_id: company_id as Id<"company">,
  });

  // Get company information
  const companyData = useQuery(api.company_service.getUserCompanyByCompanyId, {
    company_id: company_id as Id<"company">,
  });

  // Get the qualification form for this lead
  const qualificationForm = useQuery(api.form_service.getFormByLeadId, {
    lead_id: lead_id as Id<"lead">,
  });

  //set status to send qualifier
  const sendQualifierStatus = useMutation(api.status_service.registerStatus);

  //set status to await response
  const awaitResponseStatus = useMutation(api.status_service.registerStatus);

  //update lead with email sent
  const updateFormWithEmailSent = useMutation(
    api.form_service.updateFormWithEmailSent,
  );

  //if user enters from quick action
  useEffect(() => {
    if (leadDetails && leadDetails.lead._id) {
      sendQualifierStatus({
        lead_id: leadDetails.lead._id,
        statusName: "SEND_QUALIFIER",
        patch: true,
      });
    }
  }, [leadDetails, sendQualifierStatus]);

  const [formLink, setFormLink] = useState("");
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [fromEmail, setFromEmail] = useState(sendgrid_from_email || "");
  const [isSending, setIsSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      leadDetails &&
      companyData?.company &&
      qualificationForm?._id
    ) {
      // Use the actual qualification form ID instead of lead_id
      const formUrl = `${window.location.origin}/forms/${qualificationForm._id}`;
      setFormLink(formUrl);

      // Set subject using actual company name
      setSubject(`Qualification Form - ${companyData.company.name}`);

      // Set email body using professional HTML formatting
      setEmailBody(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Qualification Form</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-name {
            color: #007bff;
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 25px;
        }
        .cta-button {
            display: inline-block;
            background-color: #007bff;
            color: #ffffff;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .cta-button:hover {
            background-color: #0056b3;
        }
        .time-estimate {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #007bff;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
        }
        .signature {
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1 class="company-name">${companyData.company.name}</h1>
        </div>
        
        <div class="greeting">
            <p>Hi ${leadDetails.lead.name},</p>
        </div>
        
        <div class="content">
            <p>Thank you for your interest in working with <strong>${companyData.company.name}</strong>.</p>
            
            <p>To help us better understand your project requirements and provide you with the most accurate proposal, we've prepared a qualification form specifically for your needs.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${formUrl}" class="cta-button">Complete Qualification Form</a>
            </div>
            
            <div class="time-estimate">
                <strong>⏱️ Time Required:</strong> This form should take approximately 5-10 minutes to complete.
            </div>
            
            <p>The information you provide will help us:</p>
            <ul>
                <li>Understand your specific project requirements</li>
                <li>Assess the scope and complexity of your needs</li>
                <li>Prepare a tailored proposal that fits your budget and timeline</li>
                <li>Ensure we're the right fit for your project</li>
            </ul>
            
            <p>If you have any questions or need assistance completing the form, please don't hesitate to reach out.</p>
        </div>
        
        <div class="signature">
            <p>Best regards,<br>
            <strong>[Your Name]</strong><br>
            ${companyData.company.name}</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email address.</p>
        </div>
    </div>
</body>
</html>`);
    }
  }, [leadDetails, companyData, lead_id, qualificationForm]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(formLink);
      toast.success("Form link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy link:", err);
      toast.error("Failed to copy link to clipboard");
    }
  };

  const handleOpenLink = () => {
    if (formLink) {
      window.open(formLink, "_blank");
    }
  };

  const handleSendEmail = async () => {
    if (!leadDetails) return;

    // Clear any previous errors
    setEmailError(null);
    setIsSending(true);

    try {
      const emailData = {
        to: leadDetails.lead.email,
        subject: subject.trim(),
        html: emailBody.trim(),
        ...(fromEmail.trim() && { from: fromEmail.trim() }),
      };

      // Validate required fields on frontend
      if (!emailData.subject) {
        throw new Error("Subject is required");
      }
      if (!emailData.html) {
        throw new Error("Email message is required");
      }

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error types
        if (result.details && Array.isArray(result.details)) {
          // Validation errors
          const errorMessages = result.details
            .map((err: ValidationError) => `${err.field}: ${err.message}`)
            .join(", ");
          throw new Error(`Validation failed: ${errorMessages}`);
        } else if (result.details) {
          // SendGrid errors
          const details = Array.isArray(result.details)
            ? result.details.join(", ")
            : result.details;
          throw new Error(`${result.error}: ${details}`);
        } else {
          throw new Error(result.error || "Failed to send email");
        }
      }

      toast.success("Email sent successfully!");
      updateFormWithEmailSent({
        form_id: qualificationForm?._id as Id<"qualification_form">,
        company_id: company_id as Id<"company">,
        is_email_sent: true,
      });

      awaitResponseStatus({
        lead_id: leadDetails.lead._id,
        statusName: "AWAIT_RESPONSE",
        patch: true,
      });

      // Optionally reset form or navigate away
      // You could add navigation logic here if needed
    } catch (error) {
      console.error("Failed to send email:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send email";
      setEmailError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  if (!leadDetails || !companyData?.company) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  // Check if qualification form exists
  if (leadDetails && companyData?.company && qualificationForm === null) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No qualification form found for this lead. Please attach a
            qualification form first before sending the email.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!qualificationForm) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <LeadInfo leadDetails={leadDetails.lead} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Email Composer */}

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Qualification Form
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Alert */}
              {emailError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{emailError}</AlertDescription>
                </Alert>
              )}

              {/* Recipient Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {companyData?.company?.name}
                </div>

                <div>
                  <Label htmlFor="recipient">To</Label>
                  <Input
                    id="recipient"
                    value={leadDetails.lead.email}
                    disabled
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="from-email">From (optional)</Label>
                  <Input
                    id="from-email"
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="your-email@company.com"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to use default sender email
                  </p>
                </div>
              </div>

              <Separator />

              {/* Subject Line */}
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              {/* Email Tabs */}
              <Tabs defaultValue="compose" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="compose"
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Compose
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="compose" className="mt-4">
                  <div>
                    <Label htmlFor="email-body">Message (HTML)</Label>
                    <Textarea
                      id="email-body"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={16}
                      className="mt-1 font-mono text-sm"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Professional HTML email template with styling
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  <div>
                    <Label>Email Preview</Label>
                    <div className="mt-1 border rounded-md bg-background">
                      {/* Email Header Info */}
                      <div className="p-4 border-b bg-muted/50">
                        <div className="text-sm space-y-1">
                          <div>
                            <strong>To:</strong> {leadDetails.lead.email}
                          </div>
                          {fromEmail.trim() && (
                            <div>
                              <strong>From:</strong> {fromEmail.trim()}
                            </div>
                          )}
                          <div>
                            <strong>Subject:</strong> {subject || "No subject"}
                          </div>
                        </div>
                      </div>

                      {/* Email Content Preview */}
                      <div className="p-4">
                        {emailBody.trim() ? (
                          <iframe
                            srcDoc={emailBody}
                            className="w-full border-0 bg-white rounded"
                            style={{ height: "600px", minHeight: "400px" }}
                            title="Email Preview"
                            sandbox="allow-same-origin"
                          />
                        ) : (
                          <div className="text-muted-foreground italic h-96 flex items-center justify-center border rounded">
                            Email content will appear here...
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      This is how your email will appear to the recipient
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Send Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSendEmail}
                  disabled={isSending || !subject.trim() || !emailBody.trim()}
                  size="lg"
                >
                  {isSending ? "Sending..." : "Send HTML Email"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Link Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Qualification Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Open Link Button */}
              <div>
                <Label>Form Access</Label>
                <div className="mt-2">
                  <Button
                    onClick={handleOpenLink}
                    className="w-full"
                    variant="default"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Qualification Form
                  </Button>
                </div>
              </div>

              {/* Actual Link Display */}
              <div>
                <Label htmlFor="form-link">Direct Link</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <p className="text-xs font-mono break-all text-muted-foreground">
                    {formLink}
                  </p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  <strong>Note:</strong> This qualification form is
                  automatically embedded in your HTML email template.
                </p>
                <p>
                  You can preview the form using the &ldquo;Open&rdquo; button
                  or copy the direct link if needed.
                </p>
              </div>
            </CardContent>
          </Card>
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
          <h1 className="text-3xl font-bold tracking-tight">Build Team</h1>
          <p className="text-muted-foreground">
            Assign team members to this lead and manage their roles
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

export default SendQualifier;
