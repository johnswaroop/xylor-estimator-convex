import { Badge } from "@/components/ui/badge";
import { Loader, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { TFormData, TLeadData } from "./LeadView";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

const noteFormSchema = z.object({
  content: z.string().min(1, "Note content is required"),
});

type NoteFormData = z.infer<typeof noteFormSchema>;

const AddNoteDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NoteFormData) => void;
  isLoading?: boolean;
}) => {
  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: "",
    },
  });

  const handleSubmit = (data: NoteFormData) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your note here..."
                      className="min-h-[120px]"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Note"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export const OverviewTab = ({
  leadData,
  formData,
  company_id,
  lead_id,
}: {
  leadData: TLeadData;
  formData: TFormData;
  company_id: string;
  lead_id: string;
}) => {
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const createNewNote = useMutation(api.note_service.createNewNote);

  const handleAddNote = async (data: NoteFormData) => {
    setIsAddingNote(true);
    try {
      await createNewNote({
        lead_id: lead_id as Id<"lead">,
        company_id: company_id as Id<"company">,
        artifact_id: lead_id, // Using lead_id as artifact_id
        artifact_type: "lead", // Type of artifact this note is attached to
        note: data.content,
      });

      toast.success("Note added successfully!");
      setIsAddNoteDialogOpen(false);
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note. Please try again.");
    } finally {
      setIsAddingNote(false);
    }
  };

  if (!leadData)
    return (
      <div className="flex justify-center items-center h-full">
        <Loader />
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Lead Information */}
      <div className="space-y-4 p-4 rounded-md bg-primary/10">
        <h2 className="text-xl font-semibold">Lead Information</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <p className="text-sm text-muted-foreground">
              {leadData.lead.name}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="text-sm text-muted-foreground">
              {leadData.lead.email}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <p className="text-sm text-muted-foreground">
              {leadData.lead.phone}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Lead Source</label>
            <p className="text-sm text-muted-foreground">
              {leadData.source && leadData.source.length > 0
                ? leadData.source[0].name
                : "Not specified"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Created</label>
            <p className="text-sm text-muted-foreground">
              {new Date(leadData.lead._creationTime).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      <Separator />
      {/* Project Details */}
      {formData && (
        <>
          <div className="space-y-4   ">
            <h2 className="text-xl font-semibold">Project Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Title</label>
                <p className="text-sm text-muted-foreground">
                  Insight beyond vision
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <p className="text-sm text-muted-foreground">London, UK</p>
              </div>
              <div className="flex  gap-2">
                <label className="text-sm font-medium">Project Type</label>
                <Badge>Commercial</Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground">
                  Development of handheld imaging device for cancer detection
                  during surgery.
                </p>
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Notes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Notes & Communications</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddNoteDialogOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Note
          </Button>
        </div>
        <div className="space-y-4">
          {leadData.notes && leadData.notes.length > 0 ? (
            leadData.notes.map((note) => (
              <div
                key={note._id}
                className="border-l-4 pl-4 py-3 border-gray-400"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {note.author.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {note.author.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {note.author.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(note._creationTime).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{note.note}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No notes available.</p>
          )}
        </div>
      </div>

      <AddNoteDialog
        open={isAddNoteDialogOpen}
        onOpenChange={setIsAddNoteDialogOpen}
        onSubmit={handleAddNote}
        isLoading={isAddingNote}
      />
    </div>
  );
};
