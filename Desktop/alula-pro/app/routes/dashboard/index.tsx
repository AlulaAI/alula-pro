"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ActionCard } from "~/components/alula/action-card";
import { UrgentTaskRedesigned } from "~/components/alula/urgent-task-redesigned";
import { TaskMiniCard } from "~/components/alula/task-mini-card";
import { MobileTaskCard } from "~/components/alula/mobile-task-card";
import { MobileFloatingToolbar } from "~/components/alula/mobile-floating-toolbar";
import { ClientModal } from "~/components/alula/client-modal";
import { CommunicationModal } from "~/components/alula/communication-modal";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Plus, Users, MessageCircle, Database, Bug, AlertTriangle, Mail, Sparkles, ChevronLeft, ChevronRight, Bell } from "lucide-react";
import { EmptyState } from "~/components/alula/empty-state";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { useAIContext } from "~/hooks/use-ai-context";

export default function AlulaDashboard() {
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [currentMobileTaskIndex, setCurrentMobileTaskIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const actions = useQuery(api.actions.listActive) || [];
  const clients = useQuery(api.clients.list) || [];
  const authDebug = useQuery(api.debug.checkAuth);

  // Use selectedActionId if set, otherwise show the most urgent (first) action
  const displayedActionId = selectedActionId || (actions.length > 0 ? actions[0]._id : null);
  const displayedAction = actions.find(a => a._id === displayedActionId);
  
  // Get all actions except the one being displayed
  const otherActions = actions.filter(a => a._id !== displayedActionId);

  // Get detailed information for the displayed action
  const displayedActionDetails = useQuery(
    api.actions.getActionWithDetails,
    displayedActionId ? { actionId: displayedActionId } : "skip"
  );

  // Ensure we always have detailed data for the displayed action
  const actionToDisplay = displayedActionDetails || (displayedAction ? {
    ...displayedAction,
    client: displayedAction.client || null,
    communication: null,
    communicationHistory: [],
    aiSummary: displayedAction.summary,
    aiRecommendations: []
  } : null);
  
  // Trigger AI context generation for the displayed action's client and communication
  useAIContext(actionToDisplay?.clientId, actionToDisplay?.communicationId);

  const archiveAction = useMutation(api.actions.archive);
  const snoozeAction = useMutation(api.actions.snooze);
  const seedData = useMutation(api.seedData.seedTestData);

  const handleArchive = async (actionId: string) => {
    await archiveAction({ actionId });
    // Clear selection if we just archived the selected action
    if (actionId === selectedActionId) {
      setSelectedActionId(null);
    }
    // Move to next task on mobile after archiving
    if (isMobile && currentMobileTaskIndex > 0) {
      setCurrentMobileTaskIndex(currentMobileTaskIndex - 1);
    }
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

  // Mobile handlers
  const handleSwipeToNext = () => {
    if (currentMobileTaskIndex < actions.length - 1) {
      setCurrentMobileTaskIndex(currentMobileTaskIndex + 1);
    }
  };

  const handleSwipeToPrevious = () => {
    if (currentMobileTaskIndex > 0) {
      setCurrentMobileTaskIndex(currentMobileTaskIndex - 1);
    }
  };

  const currentMobileAction = actions[currentMobileTaskIndex];
  const currentMobileActionDetails = useQuery(
    api.actions.getActionWithDetails,
    currentMobileAction && isMobile ? { actionId: currentMobileAction._id } : "skip"
  );

  const mobileActionToDisplay = currentMobileActionDetails || (currentMobileAction ? {
    ...currentMobileAction,
    client: currentMobileAction.client || null,
    communication: null,
    communicationHistory: [],
    aiSummary: currentMobileAction.summary,
    aiRecommendations: []
  } : null);
  
  // Trigger AI context generation for mobile view
  useAIContext(
    isMobile ? mobileActionToDisplay?.clientId : null,
    isMobile ? mobileActionToDisplay?.communicationId : null
  );

  // Show mobile layout on small screens
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-[#10292E]">Alula Care</h1>
              <p className="text-xs text-[#737373]">
                {actions.length} {actions.length === 1 ? 'task needs' : 'tasks need'} attention
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2">
                <Bell className="h-5 w-5 text-gray-600" />
                {actions.filter(a => a.urgencyLevel === "critical").length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
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
                      onClick={() => setCurrentMobileTaskIndex(index)}
                      className={cn(
                        "h-2 w-2 rounded-full transition-all",
                        index === currentMobileTaskIndex
                          ? "bg-[#87CEEB] w-6"
                          : "bg-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Swipeable Task Cards */}
              <div className="h-full pt-12 pb-24 px-4">
                <div className="h-full relative">
                  {/* Navigation Hints */}
                  {currentMobileTaskIndex > 0 && (
                    <button
                      onClick={handleSwipeToPrevious}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-md"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                  )}
                  
                  {currentMobileTaskIndex < actions.length - 1 && (
                    <button
                      onClick={handleSwipeToNext}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-l-lg shadow-md"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                  )}

                  {/* Current Task Card */}
                  {mobileActionToDisplay && (
                    <div className="h-full">
                      <MobileTaskCard
                        action={mobileActionToDisplay}
                        onArchive={() => handleArchive(mobileActionToDisplay._id)}
                        onSnooze={(hours) => handleSnooze(mobileActionToDisplay._id, hours)}
                        onSwipeLeft={handleSwipeToNext}
                        onSwipeRight={handleSwipeToPrevious}
                        isFirst={currentMobileTaskIndex === 0}
                        isLast={currentMobileTaskIndex === actions.length - 1}
                        position={`${currentMobileTaskIndex + 1} of ${actions.length}`}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Floating Bottom Toolbar */}
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

  // Desktop layout
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 p-3 md:p-4">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative">
            <h1 className="text-xl font-semibold text-[#10292E]">
              Good morning! Here's what matters most today.
            </h1>
            <p className="text-sm text-[#737373] mt-0.5">
              You're making a difference. Let's see who needs your support.
            </p>
            {/* Hidden test email button - appears on hover in top-left corner */}
            <a href="/dashboard/test-email" className="absolute -top-2 -left-2 opacity-0 hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                title="Test Email Interface"
              >
                <Mail className="h-3 w-3" />
              </Button>
            </a>
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
            {/* Selected Task - Takes up 2 columns on large screens */}
            <div className="lg:col-span-2">
              {actionToDisplay && (
                <UrgentTaskRedesigned
                  action={actionToDisplay}
                  onArchive={() => handleArchive(displayedActionId!)}
                  onSnooze={(hours) => handleSnooze(displayedActionId!, hours)}
                />
              )}
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
                      isSelected={action._id === displayedActionId}
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