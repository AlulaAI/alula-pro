"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MobileTaskCard } from "~/components/alula/mobile-task-card";
import { MobileFloatingToolbar } from "~/components/alula/mobile-floating-toolbar";
import { ClientModal } from "~/components/alula/client-modal";
import { CommunicationModal } from "~/components/alula/communication-modal";
import { Badge } from "~/components/ui/badge";
import { Users, Bell } from "lucide-react";
import { EmptyState } from "~/components/alula/empty-state";
import { SwipeTutorial } from "~/components/alula/swipe-tutorial";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { useAIContext } from "~/hooks/use-ai-context";

export default function MobileDashboard() {
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const [showSwipeTutorial, setShowSwipeTutorial] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasSeenTutorial = useRef(false);

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
      setDragDirection('left');
      setTimeout(() => {
        setCurrentTaskIndex(currentTaskIndex + 1);
        setDragDirection(null);
      }, 300);
    }
  };

  const handleSwipeToPrevious = () => {
    if (currentTaskIndex > 0) {
      setDragDirection('right');
      setTimeout(() => {
        setCurrentTaskIndex(currentTaskIndex - 1);
        setDragDirection(null);
      }, 300);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (offset > threshold || velocity > 500) {
      // Swipe right - go to previous
      handleSwipeToPrevious();
    } else if (offset < -threshold || velocity < -500) {
      // Swipe left - go to next
      handleSwipeToNext();
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
  
  // Trigger AI context generation for the current action's client
  useAIContext(actionToDisplay?.clientId);

  // Show tutorial on first load with multiple tasks
  useEffect(() => {
    if (actions.length > 1 && !hasSeenTutorial.current) {
      const timer = setTimeout(() => {
        setShowSwipeTutorial(true);
        hasSeenTutorial.current = true;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [actions.length]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Minimal Header */}
      <header className="bg-white px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
          <span className="text-sm text-gray-600">
            {actions.length} {actions.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      </header>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-hidden relative">
        {actions.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900 mb-2">All caught up</h2>
              <p className="text-sm text-gray-600">No tasks need attention right now</p>
            </div>
          </div>
        ) : (
          <div className="h-full relative">
            {/* Simple Position Dots */}
            {actions.length > 1 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
                <div className="flex items-center gap-1">
                  {actions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTaskIndex(index)}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full transition-all",
                        index === currentTaskIndex
                          ? "bg-gray-900 w-4"
                          : "bg-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Swipeable Task Cards Container */}
            <div className="h-full pt-8 pb-20" ref={containerRef}>
              <div className="h-full relative overflow-hidden">
                {/* Subtle Edge Glow Indicators */}
                <AnimatePresence>
                  {currentTaskIndex > 0 && !dragDirection && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute left-0 top-0 bottom-0 w-4 z-10 pointer-events-none"
                      style={{
                        background: "linear-gradient(to right, rgba(135, 206, 235, 0.15), transparent)"
                      }}
                    />
                  )}
                  
                  {currentTaskIndex < actions.length - 1 && !dragDirection && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute right-0 top-0 bottom-0 w-4 z-10 pointer-events-none"
                      style={{
                        background: "linear-gradient(to left, rgba(135, 206, 235, 0.15), transparent)"
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Animated Task Cards */}
                <AnimatePresence mode="wait" custom={dragDirection}>
                  {actionToDisplay && (
                    <motion.div
                      key={actionToDisplay._id}
                      custom={dragDirection}
                      initial={(direction) => ({
                        x: direction === 'left' ? 300 : direction === 'right' ? -300 : 0,
                        opacity: direction ? 0 : 1,
                      })}
                      animate={{ x: 0, opacity: 1 }}
                      exit={(direction) => ({
                        x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
                        opacity: 0,
                      })}
                      transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                      }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.1}
                      dragMomentum={false}
                      onDragEnd={handleDragEnd}
                      className="h-full"
                      whileDrag={{ scale: 0.98 }}
                      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
                      style={{ height: '100%' }}
                    >
                      <div className="h-full px-4">
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
                    </motion.div>
                  )}
                </AnimatePresence>
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

      {/* Swipe Tutorial */}
      <SwipeTutorial 
        show={showSwipeTutorial}
        onDismiss={() => setShowSwipeTutorial(false)}
      />
    </div>
  );
}