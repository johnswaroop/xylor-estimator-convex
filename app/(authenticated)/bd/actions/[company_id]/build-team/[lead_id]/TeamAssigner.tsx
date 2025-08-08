"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  User,
  Mail,
  MoreHorizontal,
  Users,
  Building,
  Phone,
  Building2,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type UserRole = "BD" | "ESTIMATOR" | "SUPERVISOR";

export default function TeamAssigner({
  company_id,
  lead_id,
}: {
  company_id: string;
  lead_id: string;
}) {
  console.log(company_id, lead_id);
  const [attachQualifier, setAttachQualifier] = useState(true);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  //get lead information
  const leadDetails = useQuery(api.lead_service.getLeadById, {
    lead_id: lead_id as Id<"lead">,
    company_id: company_id as Id<"company">,
  });

  //get the list of company members
  const companyMembers = useQuery(api.company_service.getCompanyMembersList, {
    company_id: company_id as Id<"company">,
  });

  //get current team members
  const currentTeamMembers = useQuery(api.team_service.getLeadTeamMembers, {
    lead_id: lead_id as Id<"lead">,
    company_id: company_id as Id<"company">,
  });

  //update status to attach qualifier
  const updateStatusToAttachQualifier = useMutation(
    api.team_service.updateStatusToAttachQualifier,
  );

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    // TODO: Implement save and continue functionality
    if (attachQualifier) {
      const result = await updateStatusToAttachQualifier({
        lead_id: lead_id as Id<"lead">,
        company_id: company_id as Id<"company">,
      });
      if (result) {
        toast.success("Team saved! Redirecting to qualifier attachment...");
        router.push(`/bd/actions/${company_id}/attach-qualifier/${lead_id}`);
      }
    } else {
      toast.success("Team configuration saved successfully");
      router.push(`/dashboard`);
    }
    setIsSaving(false);
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Lead Information Header */}
      {leadDetails && <LeadInfo leadDetails={leadDetails.lead} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Team Section */}
        {currentTeamMembers && (
          <CurrentTeam
            currentTeamMembers={currentTeamMembers as currentTeamMembers[]}
            company_id={company_id}
          />
        )}
        {/* Available Members Section */}
        {companyMembers && currentTeamMembers && (
          <AvailableMembers
            companyMembers={companyMembers}
            currentTeamMembers={currentTeamMembers as currentTeamMembers[]}
            lead_id={lead_id}
            company_id={company_id}
          />
        )}
      </div>

      {/* Save Section */}
      {currentTeamMembers && (
        <div className="mt-8 flex items-center justify-end gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="attach-qualifier"
              checked={attachQualifier}
              onCheckedChange={(checked) =>
                setAttachQualifier(checked as boolean)
              }
            />
            <label
              htmlFor="attach-qualifier"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Attach qualifier in the next step
            </label>
          </div>

          <div className="flex gap-3">
            <Button disabled={isSaving} onClick={handleSaveAndContinue}>
              {isSaving ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </div>
      )}
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

type currentTeamMembers = {
  _id: Id<"team_assignment">;
  _creationTime: number;
  invalid_detail?: Id<"invalid_detail"> | undefined;
  type: "BD" | "ESTIMATOR" | "SUPERVISOR";
  user_id: Id<"users">;
  valid: boolean;
  lead_id: Id<"lead">;
  assigned_by: Id<"users">;
  user: {
    _id: Id<"users">;
    name: string | undefined;
    email: string | undefined;
    image: string | undefined;
  };
};

const CurrentTeam = ({
  currentTeamMembers,
  company_id,
}: {
  currentTeamMembers: currentTeamMembers[];
  company_id: string;
}) => {
  const removeTeamMember = useMutation(api.team_service.removeTeamMember);

  const currentTeam = currentTeamMembers.map((member) => ({
    id: member.user_id,
    name: member.user.name || "",
    email: member.user.email || "",
    avatar: member.user.image || "",
    role: member.type,
    team_assignment_id: member._id,
  }));

  const handleRemoveMember = async (
    team_assignment_id: Id<"team_assignment">,
  ) => {
    const result = await removeTeamMember({
      team_assignment_id: team_assignment_id,
      company_id: company_id as Id<"company">,
    });
    if (result) {
      toast.success("Team member removed successfully");
    } else {
      toast.error("Failed to remove team member");
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Team ({currentTeam.length})
          </CardTitle>
          <CardDescription>
            Team members currently assigned to this lead
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentTeam.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team members assigned yet</p>
              <p className="text-sm">Add members from the available list</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentTeam.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{member.role}</Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() =>
                            handleRemoveMember(member.team_assignment_id)
                          }
                          className="text-destructive"
                        >
                          Remove from team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

type companyMembers = {
  _id: Id<"member">;
  role: "USER" | "ADMIN";
  _creationTime: number;
  user: {
    _id: Id<"users">;
    name: string | undefined;
    email: string | undefined;
    image: string | undefined;
  };
};

const AvailableMembers = ({
  companyMembers,
  currentTeamMembers,
  lead_id,
  company_id,
}: {
  companyMembers: companyMembers[];
  currentTeamMembers: currentTeamMembers[] | [];
  lead_id: string;
  company_id: string;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("BD");
  const createTeamAssignment = useMutation(
    api.team_service.createTeamAssignment,
  );
  const availableMembers =
    companyMembers?.map((member) => ({
      id: member._id,
      name: member.user.name || "",
      email: member.user.email || "",
      avatar: member.user.image || "",
      department: member.role,
      uid: member.user._id,
    })) || [];

  const filteredAvailableMembers = availableMembers
    .filter(
      (member) =>
        !currentTeamMembers.find(
          (currentMember: currentTeamMembers) =>
            currentMember.user_id === member.uid,
        ),
    )
    .filter(
      (member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const handleAssignMember = async (userId: string, role: UserRole) => {
    const result = await createTeamAssignment({
      lead_id: lead_id as Id<"lead">,
      company_id: company_id as Id<"company">,
      user_id: userId as Id<"users">,
      type: role,
    });
    if (result) {
      toast.success("Team member assigned successfully");
      setOpenAssignDialog(false);
    } else {
      toast.error("Failed to assign team member");
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Available Members</CardTitle>
          <CardDescription>
            Company members who can be assigned to this lead
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Available Members List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAvailableMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-xs">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.email}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {member.department}
                    </Badge>
                  </div>
                </div>

                <Dialog
                  open={openAssignDialog}
                  onOpenChange={setOpenAssignDialog}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Team Member</DialogTitle>
                      <div className="mt-2">
                        <h3 className="text-xl font-semibold text-foreground mb-1">
                          {member.name}
                        </h3>
                        <DialogDescription>
                          Select a role for this team member on this lead
                        </DialogDescription>
                      </div>
                    </DialogHeader>

                    <div className="py-4">
                      <label className="text-sm font-medium mb-2 block">
                        Role
                      </label>
                      <Select
                        value={selectedRole}
                        onValueChange={(value: UserRole) =>
                          setSelectedRole(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BD">
                            Business Development
                          </SelectItem>
                          <SelectItem value="ESTIMATOR">Estimator</SelectItem>
                          <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium">
                          Role Descriptions:
                        </h4>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>
                            <strong>BD:</strong> Manages client relationships
                            and lead development
                          </p>
                          <p>
                            <strong>Estimator:</strong> Handles project cost
                            estimation and technical analysis
                          </p>
                          <p>
                            <strong>Supervisor:</strong> Oversees project
                            execution and team coordination
                          </p>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        onClick={() =>
                          handleAssignMember(member.uid, selectedRole)
                        }
                      >
                        Assign to Team
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ))}

            {filteredAvailableMembers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No members found</p>
                {searchTerm && (
                  <p className="text-xs">Try adjusting your search terms</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
