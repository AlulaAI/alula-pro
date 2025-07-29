"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { EmptyState } from "~/components/alula/empty-state";
import { 
  Archive as ArchiveIcon, 
  RotateCcw,
  MessageCircle,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  Phone
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Get archived items
const getArchivedActions = api.actions.listArchived;
const getArchivedCommunications = api.communications.listArchived;

export default function ArchivePage() {
  const [activeTab, setActiveTab] = useState("actions");

  const archivedActions = useQuery(getArchivedActions) || [];
  const archivedCommunications = useQuery(getArchivedCommunications) || [];

  const restoreAction = useMutation(api.actions.restore);
  const restoreCommunication = useMutation(api.communications.restore);

  const handleRestoreAction = async (actionId: any) => {
    await restoreAction({ actionId });
  };

  const handleRestoreCommunication = async (communicationId: any) => {
    await restoreCommunication({ communicationId });
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[#10292E]">Archive</h1>
          <p className="text-[#737373] mt-1">
            Review completed actions and past communications for reference.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="actions">Completed Actions</TabsTrigger>
            <TabsTrigger value="communications">Past Communications</TabsTrigger>
          </TabsList>

          <TabsContent value="actions" className="space-y-4">
            {archivedActions.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="No archived actions yet"
                description="Completed actions will appear here for your reference. Keep up the great work!"
              />
            ) : (
              <div className="space-y-4">
                {archivedActions.map((action: any) => (
                  <Card key={action._id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#10292E]">{action.title}</h4>
                        <p className="text-sm text-[#737373] mt-1">{action.summary}</p>
                        {action.client && (
                          <p className="text-xs text-[#737373] mt-2">
                            Client: {action.client.name}
                          </p>
                        )}
                        <p className="text-xs text-[#737373] mt-1">
                          Archived {formatDistanceToNow(new Date(action.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreAction(action._id)}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="communications" className="space-y-4">
            {archivedCommunications.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title="No archived communications yet"
                description="Past communications will be stored here for easy reference and pattern recognition."
              />
            ) : (
              <div className="space-y-4">
                {archivedCommunications.map((comm: any) => (
                  <Card key={comm._id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {comm.type === "email" ? <Mail className="h-4 w-4" /> :
                           comm.type === "phone" ? <Phone className="h-4 w-4" /> :
                           comm.type === "sms" ? <MessageCircle className="h-4 w-4" /> :
                           <FileText className="h-4 w-4" />}
                          <span className="font-medium text-sm text-[#10292E] capitalize">
                            {comm.type === "in_person" ? "In Person" : comm.type}
                          </span>
                          <span className="text-xs text-[#737373]">
                            • {comm.direction}
                          </span>
                        </div>
                        {comm.subject && (
                          <h4 className="font-medium text-[#10292E]">{comm.subject}</h4>
                        )}
                        <p className="text-sm text-[#737373] mt-1">
                          {comm.aiSummary || comm.content}
                        </p>
                        {comm.client && (
                          <p className="text-xs text-[#737373] mt-2">
                            Client: {comm.client.name}
                          </p>
                        )}
                        <p className="text-xs text-[#737373] mt-1">
                          Archived {formatDistanceToNow(new Date(comm.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreCommunication(comm._id)}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="p-6 bg-[#F5F5F5]">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-[#E0F2B2]/30 rounded-full">
              <FileText className="h-5 w-5 text-[#10292E]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#10292E] mb-1">Why Archive?</h3>
              <p className="text-sm text-[#737373]">
                The archive helps you maintain a complete care history for each client. 
                Reference past issues, identify patterns, and ensure nothing important is lost. 
                All archived items remain searchable and can be restored if needed.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}