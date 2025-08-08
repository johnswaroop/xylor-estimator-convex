import { NextRequest, NextResponse } from "next/server";
import sgMail, { MailDataRequired } from "@sendgrid/mail";
import { z } from "zod";

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Validation schema for email request
const emailSchema = z
  .object({
    to: z.email("Invalid email address"),
    subject: z.string().min(1, "Subject is required"),
    text: z.string().optional(),
    html: z.string().optional(),
    from: z.email("Invalid sender email").optional(),
  })
  .refine((data) => data.text || data.html, {
    message: "Either text or html content must be provided",
  });

// Type for SendGrid error
interface SendGridError {
  code?: number;
  response?: {
    body?: {
      errors?: string[];
    };
  };
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if SendGrid API key is configured
    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json(
        { error: "SendGrid API key not configured" },
        { status: 500 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    console.log(body);
    const validatedData = emailSchema.parse(body);

    // Prepare email message
    const msg = {
      to: validatedData.to,
      from: validatedData.from || process.env.SENDGRID_FROM_EMAIL,
      subject: validatedData.subject,
      text: validatedData.text,
      html: validatedData.html,
    } as MailDataRequired;

    // Send email via SendGrid
    await sgMail.send(msg);

    return NextResponse.json(
      { success: true, message: "Email sent successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("SendGrid email error:", error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues.map((err: z.ZodIssue) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }

    // Handle SendGrid specific errors
    if (error && typeof error === "object" && "response" in error) {
      const sgError = error as SendGridError;
      return NextResponse.json(
        {
          error: "Failed to send email",
          details: sgError.response?.body?.errors || sgError.message,
        },
        { status: sgError.code || 500 },
      );
    }

    // Handle other errors
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Optional: Add GET method for health check
export async function GET() {
  try {
    // Simple health check
    const isConfigured = !!process.env.SENDGRID_API_KEY;

    return NextResponse.json({
      service: "SendGrid Email API",
      status: isConfigured ? "configured" : "not configured",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
