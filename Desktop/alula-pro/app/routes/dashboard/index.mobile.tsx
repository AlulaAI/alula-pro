"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MobileTaskCard } from "~/components/alula/mobile-task-card";
import { MobileFloatingToolbar } from "~/components/alula/mobile-floating-toolbar";
import { ClientModal } from "~/components/alula/client-modal";
import { CommunicationModal } from "~/components/alula/communication-modal";
import { Badge } from "~/components/ui/badge";
import { Users, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "~/components/alula/empty-state";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

export default function MobileDashboard() {
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  const actions = useQuery(api.actions.listActive) || [];
  const clients = useQuery(api.clients.list) || [];
  const archiveAction = useMutation(api.actions.archive);
  const snoozeAction = useMutation(api.actions.snooze);

  const currentAction = actions[currentTaskIndex];

  const handleArchive = async (actionId: string) => {
    await archiveAction({ actionId });
    toast.success("Task archived");
    // Move to next task after archiving
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
    }
  };

  const handleSnooze = async (actionId: string, hours: number) => {
    await snoozeAction({ actionId, hours });
    toast.success(`Snoozed for ${hours} hours`);
  };

  const handleSwipeToNext = () => {
    if (currentTaskIndex < actions.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    }
  };

  const handleSwipeToPrevious = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
    }
  };

  const handleAddCommunication = (clientId?: string) => {
    if (clientId) {
      setSelectedClientId(clientId);
    }
    setShowCommunicationModal(true);
  };

  // Get detailed information for the current action
  const currentActionDetails = useQuery(
    api.actions.getActionWithDetails,
    currentAction ? { actionId: currentAction._id } : "skip"
  );

  const actionToDisplay = currentActionDetails || (currentAction ? {
    ...currentAction,
    client: currentAction.client || null,
    communication: null,
    communicationHistory: [],
    aiSummary: currentAction.summary,
    aiRecommendations: []
  } : null);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Mobile Header - Compact and Reachable */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-[#10292E]">Alula Care</h1>
            <p className="text-xs text-[#737373]">
              {actions.length} tasks need attention
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification Badge */}
            <button className="relative p-2">
              <Bell className="h-5 w-5 text-gray-600" />
              {actions.filter(a => a.urgencyLevel === "critical").length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-hidden relative">
        {actions.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6">
            <EmptyState
              icon={Users}
              title="All caught up!"
              description="No urgent tasks right now. Take a breather."
              action={null}
            />
          </div>
        ) : (
          <div className="h-full relative">
            {/* Task Navigation Dots */}
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-30">
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                {actions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTaskIndex(index)}
                    className={cn(
                      "h-2 w-2 rounded-full transition-all",
                      index === currentTaskIndex
                        ? "bg-[#87CEEB] w-6"
                        : "bg-gray-300"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Swipeable Task Cards Container */}
            <div className="h-full pt-12 pb-24 px-4">
              <div className="h-full relative">
                {/* Previous/Next Navigation Hints */}
                {currentTaskIndex > 0 && (
                  <button
                    onClick={handleSwipeToPrevious}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-md"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                )}
                
                {currentTaskIndex < actions.length - 1 && (
                  <button
                    onClick={handleSwipeToNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-l-lg shadow-md"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                )}

                {/* Current Task Card */}
                {actionToDisplay && (
                  <div className="h-full">
                    <MobileTaskCard
                      action={actionToDisplay}
                      onArchive={() => handleArchive(actionToDisplay._id)}
                      onSnooze={(hours) => handleSnooze(actionToDisplay._id, hours)}
                      onSwipeLeft={handleSwipeToNext}
                      onSwipeRight={handleSwipeToPrevious}
                      isFirst={currentTaskIndex === 0}
                      isLast={currentTaskIndex === actions.length - 1}
                      position={`${currentTaskIndex + 1} of ${actions.length}`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Toolbar - Always Accessible */}
      <MobileFloatingToolbar
        onAddClient={() => setShowClientModal(true)}
        onAddCommunication={() => handleAddCommunication()}
        hasUrgentTasks={actions.some(a => a.urgencyLevel === "critical")}
        taskCount={actions.length}
      />

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