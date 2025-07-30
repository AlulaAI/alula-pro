"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MobileTaskList } from "~/components/alula/mobile-task-list";
import { MobileChatViewV2 } from "~/components/alula/mobile-chat-view-v2";
import { MobileFloatingToolbar } from "~/components/alula/mobile-floating-toolbar";
import { ClientModal } from "~/components/alula/client-modal";
import { CommunicationModal } from "~/components/alula/communication-modal";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useAIContext } from "~/hooks/use-ai-context";

type ViewState = 'list' | 'chat';

export default function MobileDashboard() {
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState('all');

  const actions = useQuery(api.actions.listActive) || [];
  const clients = useQuery(api.clients.list) || [];
  const archiveAction = useMutation(api.actions.archive);
  const snoozeAction = useMutation(api.actions.snooze);
  const createCommunication = useMutation(api.communications.create);

  // Filter tasks based on current filter
  const filteredTasks = useMemo(() => {
    switch (currentFilter) {
      case 'critical':
        return actions.filter(a => a.urgencyLevel === 'critical');
      case 'clients':
        return actions.filter(a => a.type === 'client');
      case 'new':
        return actions.filter(a => a.type === 'lead');
      default:
        return actions;
    }
  }, [actions, currentFilter]);

  // Get detailed information for the selected action
  const selectedActionDetails = useQuery(
    api.actions.getActionWithDetails,
    selectedAction ? { actionId: selectedAction._id } : "skip"
  );

  const actionToDisplay = selectedActionDetails || (selectedAction ? {
    ...selectedAction,
    client: selectedAction.client || null,
    communication: null,
    communicationHistory: [],
    aiSummary: selectedAction.summary,
    aiRecommendations: []
  } : null);

  // Trigger AI context generation for the selected action
  useAIContext(actionToDisplay?.clientId, actionToDisplay?.communicationId);

  // Transform communication history into chat messages for the selected action
  const messages = useMemo(() => {
    if (!actionToDisplay) return [];
    
    const msgs = [];
    
    // Add current communication as the most recent message
    if (actionToDisplay.communication) {
      msgs.push({
        id: actionToDisplay.communication._id,
        type: actionToDisplay.communication.direction === 'inbound' ? 'client' : 'consultant' as const,
        content: actionToDisplay.communication.content,
        timestamp: actionToDisplay.communication.createdAt,
        sender: actionToDisplay.communication.direction === 'inbound' 
          ? actionToDisplay.client?.name 
          : "You",
        metadata: {
          channel: actionToDisplay.communication.type as 'email' | 'phone' | 'in-person',
        }
      });
    }
    
    // Add communication history
    if (actionToDisplay.communicationHistory) {
      actionToDisplay.communicationHistory.forEach((comm: any) => {
        if (comm._id !== actionToDisplay.communication?._id) {
          msgs.push({
            id: comm._id,
            type: comm.direction === 'inbound' ? 'client' : 'consultant' as const,
            content: comm.content,
            timestamp: comm.createdAt,
            sender: comm.direction === 'inbound' 
              ? actionToDisplay.client?.name 
              : "You",
            metadata: {
              channel: comm.type as 'email' | 'phone' | 'in-person',
            }
          });
        }
      });
    }
    
    // Sort by timestamp, oldest first (for chat display)
    return msgs.sort((a, b) => a.timestamp - b.timestamp);
  }, [actionToDisplay]);

  const handleTaskSelect = (task: any) => {
    setSelectedAction(task);
    setViewState('chat');
  };

  const handleArchive = async () => {
    if (!selectedAction) return;
    
    await archiveAction({ actionId: selectedAction._id });
    toast.success("Task completed");
    
    // Go back to list view
    setViewState('list');
    setSelectedAction(null);
  };

  const handleBack = () => {
    setViewState('list');
    setSelectedAction(null);
  };

  const handleShowDetails = () => {
    // TODO: Show details modal or drawer
    toast.info("Details view coming soon");
  };

  const handleAddCommunication = (clientId?: string) => {
    if (clientId) {
      setSelectedClientId(clientId);
    }
    setShowCommunicationModal(true);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <AnimatePresence mode="wait">
        {viewState === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <MobileTaskList
              tasks={filteredTasks}
              onTaskSelect={handleTaskSelect}
              currentFilter={currentFilter}
              onFilterChange={setCurrentFilter}
            />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {actionToDisplay && (
              <MobileChatViewV2
                action={actionToDisplay}
                messages={messages}
                aiContext={actionToDisplay.keyContext || ""}
                onArchive={handleArchive}
                onBack={handleBack}
                onShowDetails={handleShowDetails}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Toolbar - Only show in list view */}
      {viewState === 'list' && (
        <MobileFloatingToolbar
          onAddClient={() => setShowClientModal(true)}
          onAddCommunication={() => handleAddCommunication()}
          hasUrgentTasks={actions.some(a => a.urgencyLevel === "critical")}
          taskCount={actions.length}
        />
      )}

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