"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ActionCard } from "~/components/alula/action-card";
import { UrgentTaskExpanded } from "~/components/alula/urgent-task-expanded";
import { TaskMiniCard } from "~/components/alula/task-mini-card";
import { ClientModal } from "~/components/alula/client-modal";
import { CommunicationModal } from "~/components/alula/communication-modal";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Plus, Users, MessageCircle, Database, Bug, AlertTriangle } from "lucide-react";
import { EmptyState } from "~/components/alula/empty-state";
import { toast } from "sonner";

export default function AlulaDashboard() {
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

  const actions = useQuery(api.actions.listActive) || [];
  const clients = useQuery(api.clients.list) || [];
  const authDebug = useQuery(api.debug.checkAuth);

  // Get the most urgent action
  const urgentAction = actions.length > 0 ? actions[0] : null;
  const otherActions = actions.slice(1);

  // Get detailed information for the urgent action
  const urgentActionDetails = useQuery(
    api.actions.getActionWithDetails,
    urgentAction ? { actionId: urgentAction._id } : "skip"
  );

  const archiveAction = useMutation(api.actions.archive);
  const snoozeAction = useMutation(api.actions.snooze);
  const seedData = useMutation(api.seedData.seedTestData);

  const handleArchive = async (actionId: string) => {
    await archiveAction({ actionId });
  };

  const handleSnooze = async (actionId: string, hours: number) => {
    await snoozeAction({ actionId, hours });
  };

  const handleAddCommunication = (clientId?: string) => {
    if (clientId) {
      setSelectedClientId(clientId);
    }
    setShowCommunicationModal(true);
  };

  const handleSeedData = async () => {
    try {
      toast.info("Creating test data...");
      const result = await seedData();
      if (result) {
        toast.success(`Test data created: ${result.clients} clients, ${result.communications} communications, ${result.actions} actions`);
      }
    } catch (error: any) {
      console.error("Seed data error:", error);
      toast.error(`Failed to create test data: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 p-3 md:p-4">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#10292E]">
              Good morning! Here's what matters most today.
            </h1>
            <p className="text-sm text-[#737373] mt-0.5">
              You're making a difference. Let's see who needs your support.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowClientModal(true)}
              className="bg-[#10292E] hover:bg-[#10292E]/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
            <Button
              onClick={() => handleAddCommunication()}
              variant="secondary"
              className="bg-[#87CEEB] text-[#10292E] hover:bg-[#87CEEB]/90"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Log Communication
            </Button>
            <Button
              onClick={handleSeedData}
              variant="outline"
              size="sm"
            >
              <Database className="mr-2 h-3 w-3" />
              Test Data
            </Button>
          </div>
        </div>

        {/* Content */}
        {actions.length === 0 ? (
          <EmptyState
            icon={Users}
            title="You're all caught up!"
            description="Take a moment to recharge. New actions will appear here when they need your attention."
            action={
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowClientModal(true)}
                  className="bg-[#10292E] hover:bg-[#10292E]/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Client
                </Button>
                <Button
                  onClick={handleSeedData}
                  variant="outline"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Load Test Data
                </Button>
                <Button
                  onClick={() => {
                    console.log("Auth Debug:", authDebug);
                    toast.info(`Auth: ${authDebug?.authenticated ? 'Yes' : 'No'}, User: ${authDebug?.user?.email || 'None'}`);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Bug className="mr-2 h-4 w-4" />
                  Debug
                </Button>
              </div>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Urgent Task - Takes up 2 columns on large screens */}
            <div className="lg:col-span-2">
              {urgentActionDetails ? (
                <UrgentTaskExpanded
                  action={urgentActionDetails}
                  onArchive={() => handleArchive(urgentAction!._id)}
                  onSnooze={(hours) => handleSnooze(urgentAction!._id, hours)}
                />
              ) : urgentAction ? (
                <ActionCard
                  action={urgentAction}
                  onArchive={() => handleArchive(urgentAction._id)}
                  onSnooze={(hours) => handleSnooze(urgentAction._id, hours)}
                  onReply={() => {
                    if (urgentAction.clientId) {
                      handleAddCommunication(urgentAction.clientId);
                    }
                  }}
                />
              ) : null}
            </div>

            {/* Other Tasks - Side panel */}
            {otherActions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-3 w-3 text-[#737373]" />
                  <h3 className="font-medium text-sm text-[#10292E]">Other Tasks Today</h3>
                  <Badge className="bg-gray-100 text-gray-800 text-[10px] px-1.5 py-0">
                    {otherActions.length}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {otherActions.map((action) => (
                    <TaskMiniCard
                      key={action._id}
                      action={action}
                      onClick={() => setSelectedActionId(action._id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
      />
      <CommunicationModal
        isOpen={showCommunicationModal}
        onClose={() => {
          setShowCommunicationModal(false);
          setSelectedClientId(null);
        }}
        clients={clients}
        defaultClientId={selectedClientId}
      />
    </div>
  );
}