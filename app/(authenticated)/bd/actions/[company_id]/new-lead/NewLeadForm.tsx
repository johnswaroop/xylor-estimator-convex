"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { IconPlus } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

// Form validation schema based on the lead table schema
const newLeadSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(/^[\+]?[\d\s\-\(\)]+$/, "Please enter a valid phone number"),
  company_id: z.string().min(1, "Please select a company"),
  lead_source_id: z.string().optional(),
});

type NewLeadFormData = z.infer<typeof newLeadSchema>;

export default function NewLeadForm({ company_id }: { company_id: string }) {
  const router = useRouter();
  const [buildTeam, setBuildTeam] = useState(true);
  const form = useForm<NewLeadFormData>({
    resolver: zodResolver(newLeadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company_id: company_id,
      lead_source_id: "",
    },
  });

  const { isSubmitting } = form.formState;

  //queries
  const createNewLead = useMutation(api.lead_service.createNewLead);
  const leadSources = useQuery(api.lead_service.getLeadSources, {
    company_id: company_id as Id<"company">,
  });

  const onSubmit = async (data: NewLeadFormData, build_team: boolean) => {
    if (isSubmitting) return;
    try {
      console.log("Form data:", data);
      const leadId = await createNewLead({
        ...data,
        lead_source_id: undefined,
        company_id: data.company_id as Id<"company">,
        build_team: build_team,
      });
      console.log("Lead created successfully!", leadId);

      toast.success("Lead created successfully!");
      form.reset();

      //router.push(`/funnel`);
      if (build_team) {
        router.push(`/bd/actions/${company_id}/build-team/${leadId}`);
      } else {
        router.push(`/funnel`);
      }
    } catch (error) {
      console.error("Error creating lead:", error);
      toast.error("Error creating lead. Please try again.");
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create New Lead</h1>
        <p className="text-muted-foreground mt-2">
          Add a new lead to your pipeline. All fields marked with * are
          required.
        </p>
      </div>

      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
          <CardDescription>
            Enter the contact details and company information for the new lead.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => onSubmit(data, buildTeam))}
              className="space-y-6"
            >
              {/* Contact Information Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Contact Details</h3>
                  <Separator />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter lead's full name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          {...field}
                        />
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
                      <FormLabel>Phone *</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include country code if international
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Company & Source Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Source</h3>
                  <Separator />
                </div>

                <FormField
                  control={form.control}
                  name="lead_source_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Source</FormLabel>
                      <div className="flex gap-2 items-center jus">
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select lead source (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leadSources?.map((source) => (
                              <SelectItem key={source._id} value={source._id}>
                                {source.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <NewLeadSourcePopup company_id={company_id} />
                      </div>
                      <FormDescription>
                        How did this lead come to your attention?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Form Actions */}
              {/* Build Team Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="buildTeam"
                  checked={buildTeam}
                  onCheckedChange={() => {
                    setBuildTeam(!buildTeam);
                  }}
                />
                <Label htmlFor="buildTeam">Build Team in the next step</Label>
              </div>
              <div className="flex gap-4 pt-6">
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create Lead
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

const NewLeadSourceForm = z.object({
  company_id: z.string().min(1, "Company is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type NewLeadSourceFormData = z.infer<typeof NewLeadSourceForm>;

const NewLeadSourcePopup = ({ company_id }: { company_id: string }) => {
  //close dialog
  const [open, setOpen] = useState(false);

  const createNewLeadSource = useMutation(api.lead_service.createNewLeadSource);

  const form = useForm<NewLeadSourceFormData>({
    resolver: zodResolver(NewLeadSourceForm),
    defaultValues: {
      name: "",
      description: "",
      company_id: company_id,
    },
  });

  const onSubmit = async (data: NewLeadSourceFormData) => {
    try {
      const leadSourceId = await createNewLeadSource({
        name: data.name,
        description: data.description || "",
        company_id: data.company_id as Id<"company">,
      });
      console.log("Lead source created successfully!", leadSourceId);
      toast.success("Lead source created successfully!");
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error creating lead source:", error);
      toast.error("Error creating lead source. Please try again.");
    }
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit(onSubmit)(event);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button type="button" variant="ghost" className=" text-primary">
          <IconPlus />
          New Source
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Lead Source</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Source Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description{" "}
                    <p className="text-xs text-muted-foreground">(optional)</p>
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Source Description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
