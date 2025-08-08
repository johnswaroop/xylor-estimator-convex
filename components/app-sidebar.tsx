"use client";

import * as React from "react";
import { IconInnerShadowTop, IconPlus } from "@tabler/icons-react";
import { Filter, Database, BarChart3, Users } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Filter,
      isActive: true,
      children: [
        {
          title: "New Lead",
          url: "/dashboard/new-lead",
          icon: IconPlus,
        },
      ],
    },
    {
      title: "Database",
      url: "#",
      icon: Database,
    },
    {
      title: "Analytics",
      url: "#",
      icon: BarChart3,
    },
    {
      title: "Team",
      url: "#",
      icon: Users,
    },
  ],
};

type TMembership = {
  company: {
    _id: Id<"company">;
    _creationTime: number;
    logo?: string | undefined;
    name: string;
    email: string;
  } | null;
  _id: Id<"member">;
  _creationTime: number;
  role: "USER" | "ADMIN";
  user_id: Id<"users">;
  company_id: Id<"company">;
};

export function AppSidebar({
  memberships,
  companyId,
  setCompanyId,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  memberships: TMembership[];
  companyId: string;
  setCompanyId: (companyId: string) => void;
}) {
  const user = useQuery(api.auth.getUser);
  console.log({ user });
  if (!memberships) return <></>;

  const currentCompany = memberships.find(
    (membership) => membership.company_id === companyId,
  );

  const activeTeam = {
    id: currentCompany?.company_id || "",
    name: currentCompany?.company?.name || "",
    logo: IconInnerShadowTop,
    plan: currentCompany?.company?.email || "",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <TeamSwitcher
              teams={memberships.map((membership) => ({
                name: membership.company?.name || "",
                logo: IconInnerShadowTop,
                plan: membership.company?.email || "",
                _id: membership.company_id,
              }))}
              activeTeam={activeTeam}
              onTeamSelect={(companyId: string) => {
                setCompanyId(companyId);
              }}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name || "",
            email: user?.email || "",
            avatar: "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
