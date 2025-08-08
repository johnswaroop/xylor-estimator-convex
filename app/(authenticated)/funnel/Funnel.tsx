"use client";

import * as React from "react";
import {
  IconCircleCheckFilled,
  IconDotsVertical,
  IconLoader,
} from "@tabler/icons-react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import { z } from "zod";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronStepper } from "@/components/ui/chevron-stepper";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const schema = z.object({
  _id: z.string(), // Id<"lead"> will be converted to string
  _creationTime: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  valid: z.boolean(),
  lead_source_name: z.string().optional(),
  status: z.string().optional(),
});

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return <>{row.original.name}</>;
    },
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: "Contact Person",
    cell: ({ row }) => <div className="w-48">{row.original.email}</div>,
  },
  {
    accessorKey: "lead_source_name",
    header: "Project Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.lead_source_name || "N/A"}
      </Badge>
    ),
  },
  {
    accessorKey: "valid",
    header: "Status",
    cell: ({ row }) => (
      <Badge className="text-white px-1.5 flex items-center gap-1">
        {row.original.valid ? (
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
        ) : (
          <IconLoader />
        )}
        {row.original.status?.split("_").join(" ")}
      </Badge>
    ),
  },
  {
    accessorKey: "_creationTime",
    header: () => <div className="w-full text-right">Date</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {new Date(row.original._creationTime).toLocaleDateString()}
      </div>
    ),
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

function DataRow({
  row,
  onRowClick,
}: {
  row: Row<z.infer<typeof schema>>;
  onRowClick?: (rowData: z.infer<typeof schema>) => void;
}) {
  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger row click if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest('[role="button"]') ||
      target.closest("input") ||
      target.closest("[data-radix-collection-item]") // For dropdown menu items
    ) {
      return;
    }

    onRowClick?.(row.original);
  };

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      className="cursor-pointer hover:bg-muted/50"
      onClick={handleRowClick}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function Funnel({ company_id }: { company_id: Id<"company"> }) {
  const router = useRouter();
  // Fetch leads data from Convex
  const leadsData = useQuery(api.lead_service.getLeadsByCompany, {
    company_id,
    with_status: true,
  });

  const [data, setData] = React.useState<z.infer<typeof schema>[]>([]);

  // Update local data when Convex data changes
  React.useEffect(() => {
    if (leadsData) {
      // Transform Convex data to match schema
      const transformedData = leadsData.map((lead) => ({
        ...lead,
        _id: lead._id as string, // Convert Id<"lead"> to string
        lead_source_name: lead.lead_source_name || "",
        status: lead.status || "",
      }));
      setData(transformedData);
    }
  }, [leadsData]);

  const isLoading = leadsData === undefined;
  const hasError = leadsData === null;

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Status mapping for reference (keep this for future use)
  const statusMapping: { [key: string]: { step: string; statuses: string[] } } =
    {
      ALL: { step: "ALL", statuses: [] },
      CREATE_LEAD: { step: "CREATE_LEAD", statuses: ["CREATE_LEAD"] },
      BUILD_TEAM: { step: "BUILD_TEAM", statuses: ["BUILD_TEAM"] },
      QUALIFICATION: {
        step: "QUALIFICATION",
        statuses: ["ATTATCH_QUALIFIER", "SEND_QUALIFIER", "AWAIT_RESPONSE"],
      },
      QUALIFIER_REVIEW: {
        step: "QUALIFIER_REVIEW",
        statuses: [
          "QUALIFIER_RECEIVED",
          "QUALIFIER_IN_REVIEW",
          "QUALIFIER_APPROVED",
          "QUALIFIER_REJECTED",
        ],
      },
      ESTIMATION: {
        step: "ESTIMATION",
        statuses: [
          "SENT_FOR_ESTIMATE",
          "ESTIMATE_RECEIVED",
          "ESTIMATE_IN_REVIEW",
          "ESTIMATE_APPROVED",
          "ESTIMATE_REJECTED",
        ],
      },
      PROPOSAL: {
        step: "PROPOSAL",
        statuses: ["SEND_ESTIMATE", "AWAIT_ESTIMATE_RESPONSE"],
      },
      NEGOTIATE: {
        step: "NEGOTIATE",
        statuses: [
          "ESTIMATE_RESPONSE_RECEIVED",
          "ESTIMATE_RESPONSE_IN_REVIEW",
          "ESTIMATE_RESPONSE_APPROVED",
          "ESTIMATE_RESPONSE_REJECTED",
        ],
      },
    };

  const [selectedStep, setSelectedStep] = React.useState<string>("ALL");
  const [selectedSubStep, setSelectedSubStep] = React.useState<string>("ALL");

  const handleStepClick = (stepId: string) => {
    console.log("Step clicked:", stepId);
    setSelectedStep(stepId);
    setSelectedSubStep("ALL");
  };

  const handleSubStepClick = (subStepId: string) => {
    console.log("Sub step clicked:", subStepId);
    setSelectedSubStep(subStepId);
  };

  const handleRowClick = (rowData: z.infer<typeof schema>) => {
    console.log("Row clicked:", rowData);
    // Navigate to lead detail page
    router.push(`/funnel/lead/${rowData._id}?companyId=${company_id}`);
  };

  // Filter data based on selected step and substep
  const filteredData = React.useMemo(() => {
    if (selectedStep === "ALL") {
      return data;
    }

    const stepConfig = statusMapping[selectedStep] as
      | { step: string; statuses: string[] }
      | undefined;
    if (!stepConfig) {
      return data;
    }

    // If substep is ALL, show all leads that match any status in the step
    if (selectedSubStep === "ALL") {
      const allowedStatuses = stepConfig.statuses;
      return data.filter(
        (lead) => lead.status && allowedStatuses.includes(lead.status),
      );
    }

    // If specific substep is selected, show only leads with that exact status
    return data.filter((lead) => lead.status === selectedSubStep);
  }, [data, selectedStep, selectedSubStep]);

  const table = useReactTable({
    data: filteredData, // Use filtered data instead of raw data
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    getRowId: (row) => row._id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Reset pagination when filtering changes
  React.useEffect(() => {
    // Removed pagination reset
  }, [selectedStep, selectedSubStep]);

  return (
    <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
      <div className="flex">
        <ChevronStepper
          onStepClick={handleStepClick}
          className="max-w-fit"
          statusMapping={statusMapping}
          selectedStep={selectedStep}
          selectedSubStep={selectedSubStep}
          onSubStepClick={handleSubStepClick}
        />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <IconLoader className="mr-2" /> Loading...
                </TableCell>
              </TableRow>
            ) : hasError ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <IconLoader className="mr-2" /> Error loading data.
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table
                .getRowModel()
                .rows.map((row) => (
                  <DataRow key={row.id} row={row} onRowClick={handleRowClick} />
                ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
          {selectedStep !== "ALL" && (
            <span className="ml-4 text-primary">
              Filtered by: {selectedStep.replace("_", " ")}
              {selectedSubStep !== "ALL" &&
                ` → ${selectedSubStep.replace("_", " ")}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
