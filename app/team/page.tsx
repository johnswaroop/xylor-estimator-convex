"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  Building2,
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Form schemas
const createCompanySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.email("Please enter a valid email address"),
  logo: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

const addMemberSchema = z.object({
  email: z.email("Please enter a valid email address"),
  role: z.enum(["USER", "ADMIN"], {
    message: "Please select a role",
  }),
});

type CreateCompanyForm = z.infer<typeof createCompanySchema>;
type AddMemberForm = z.infer<typeof addMemberSchema>;

export default function UserPage() {
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] =
    useState<Id<"company"> | null>(null);

  const router = useRouter();
  const { signOut } = useAuthActions();

  const companyList = useQuery(api.company_service.getUserCompaniesList, {
    isAdmin: true,
  });

  // Set default selected company if none is selected and companies exist
  const userCompanies = companyList;
  const currentCompanyId =
    selectedCompanyId ||
    (userCompanies && userCompanies.length > 0
      ? userCompanies[0].company_id
      : null);

  // Find the current user's company information
  const userCompany =
    userCompanies && currentCompanyId
      ? userCompanies.find((c) => c.company_id === currentCompanyId)
      : null;

  const companyMembers = useQuery(
    api.company_service.getCompanyMembersList,
    currentCompanyId ? { company_id: currentCompanyId } : "skip",
  );

  // Mutations
  const createCompany = useMutation(api.company_service.createCompany);
  const addMember = useMutation(api.company_service.addMemberToCompany);

  // Forms
  const createCompanyForm = useForm<CreateCompanyForm>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: "",
      email: "",
      logo: "",
    },
  });

  const addMemberForm = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      email: "",
      role: "USER",
    },
  });

  // Handlers
  const handleCreateCompany = async (data: CreateCompanyForm) => {
    try {
      await createCompany({
        name: data.name,
        email: data.email,
        logo: data.logo || undefined,
      });
      setCreateCompanyOpen(false);
      createCompanyForm.reset();
    } catch (error) {
      console.error("Error creating company:", error);
    }
  };

  const handleAddMember = async (data: AddMemberForm) => {
    if (!currentCompanyId) return;

    try {
      await addMember({
        company_id: currentCompanyId,
        email: data.email,
        role: data.role,
      });
      setAddMemberOpen(false);
      addMemberForm.reset();
    } catch (error) {
      //error includes User not found
      if (error instanceof Error && error.message.includes("User not found")) {
        addMemberForm.setError("email", {
          message: "User not found. Please invite them to sign up.",
        });
      } else {
        console.error("Error adding member:", error);
        addMemberForm.setError("email", {
          message: "An error occurred. Please try again.",
        });
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadgeVariant = (role: "USER" | "ADMIN") => {
    return role === "ADMIN" ? "default" : "secondary";
  };

  const getRoleIcon = (role: "USER" | "ADMIN") => {
    return role === "ADMIN" ? (
      <ShieldCheck className="h-3 w-3" />
    ) : (
      <Shield className="h-3 w-3" />
    );
  };

  // Loading state
  if (userCompanies === undefined) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // No company state - user is not part of any companies
  if (!userCompanies || userCompanies.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome to Your Workspace
            </h1>
            <p className="text-muted-foreground">
              You&apos;re not part of any company yet. Create a new company to
              get started.
            </p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle>Create Your Company</CardTitle>
              <CardDescription>
                Set up your company profile and start managing your team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog
                open={createCompanyOpen}
                onOpenChange={setCreateCompanyOpen}
              >
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full">
                    <Building2 className="h-4 w-4" />
                    Create Company
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Company</DialogTitle>
                    <DialogDescription>
                      Fill in your company details to get started. You&apos;ll
                      be set as the admin.
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...createCompanyForm}>
                    <form
                      onSubmit={createCompanyForm.handleSubmit(
                        handleCreateCompany,
                      )}
                      className="space-y-4"
                    >
                      <FormField
                        control={createCompanyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Acme Corporation"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createCompanyForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="contact@acme.com"
                                type="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createCompanyForm.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo URL (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.com/logo.png"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1">
                          Create Company
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCreateCompanyOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <div className="pt-4 border-t space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Need to use a different account that&apos;s already part of a
                  company?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state - selected company not found or user doesn't have access
  if (userCompany === null || userCompany === undefined) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight">
              Company Not Found
            </h1>
            <p className="text-muted-foreground">
              The selected company could not be found or you don&apos;t have
              access to it.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={() =>
                  setSelectedCompanyId(userCompanies?.[0]?.company_id || null)
                }
                className="w-full"
              >
                <Building2 className="h-4 w-4" />
                Select Different Company
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Company exists - show dashboard
  const isAdmin = userCompany.role === "ADMIN";

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              {userCompany.company?.name || "Unknown Company"}
            </h1>
            {userCompanies && userCompanies.length > 1 && (
              <Select
                value={currentCompanyId || undefined}
                onValueChange={(value) =>
                  setSelectedCompanyId(value as Id<"company">)
                }
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select company">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {userCompanies.find(
                        (c) => c.company_id === currentCompanyId,
                      )?.company?.name || "Select company"}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {userCompanies.map((company) => (
                    <SelectItem
                      key={company.company_id}
                      value={company.company_id}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {company.company?.name || "Unknown Company"}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            {userCompany.company?.email || "No email"}
            <Badge
              variant={getRoleBadgeVariant(userCompany.role)}
              className="gap-1"
            >
              {getRoleIcon(userCompany.role)}
              {userCompany.role}
            </Badge>
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          {isAdmin && (
            <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Invite a new member to your company. They must already have
                    an account.
                  </DialogDescription>
                </DialogHeader>

                <Form {...addMemberForm}>
                  <form
                    onSubmit={addMemberForm.handleSubmit(handleAddMember)}
                    className="space-y-4"
                  >
                    <FormField
                      control={addMemberForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="user@example.com"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addMemberForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USER">User</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
                        Add Member
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddMemberOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Company Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companyMembers?.length ?? <Skeleton className="h-8 w-8" />}
            </div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companyMembers?.filter((m) => m.role === "ADMIN").length ?? (
                <Skeleton className="h-8 w-8" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Company administrators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Founded</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userCompany.company?._creationTime
                ? formatDate(userCompany.company._creationTime)
                : "Unknown"}
            </div>
            <p className="text-xs text-muted-foreground">
              Company creation date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your company&apos;s team members and their roles
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {companyMembers === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : companyMembers.length === 0 ? (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                No team members found.{" "}
                {isAdmin &&
                  "Use the 'Add Member' button to invite your first team member."}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyMembers.map((member) => (
                    <TableRow key={member._id}>
                      <TableCell className="font-medium">
                        {member.user.name || "Unknown User"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.user.email || "No email"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getRoleBadgeVariant(member.role)}
                          className="gap-1"
                        >
                          {getRoleIcon(member.role)}
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(member._creationTime)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
