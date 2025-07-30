import { useState, useRef, useEffect } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  AlertCircle,
  Phone,
  MessageSquare,
  Clock,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  AlertTriangle,
  Timer,
  Send,
  Archive,
  StickyNote,
  Mail,
  X,
  Check,
  Info,
  ArrowRight,
  MessageCircle,
  History,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface MobileTaskCardProps {
  action: {
    _id: string;
    type: "client" | "business" | "lead" | "partner";
    title: string;
    summary: string;
    urgencyLevel: "critical" | "high" | "medium" | "low";
    createdAt: number;
    dueDate?: number;
    clientId?: string;
    communicationId?: string;
    client?: {
      _id: string;
      name: string;
      profileImage?: string;
    } | null;
    communication?: {
      _id: string;
      subject?: string;
      content: string;
      type: string;
      createdAt: number;
      metadata?: {
        from?: string;
        to?: string;
        cc?: string;
      };
    } | null;
    communicationHistory?: Array<{
      _id: string;
      subject?: string;
      content: string;
      createdAt: number;
    }>;
    keyContext?: string | null;
  };
  onArchive: () => void;
  onSnooze: (hours: number) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  position?: string;
}

type ViewState = 'message' | 'context' | 'reply' | 'complete';

export function MobileTaskCard({
  action,
  onArchive,
  onSnooze,
  onSwipeLeft,
  onSwipeRight,
  isFirst,
  isLast,
  position,
}: MobileTaskCardProps) {
  const [viewState, setViewState] = useState<ViewState>('message');
  const [replyContent, setReplyContent] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const createCommunication = useMutation(api.communications.create);
  const createTimeEntry = useMutation(api.timeEntries.createTimeEntry);
  const createInternalNote = useMutation(api.communications.createInternalNote);

  // Visual hierarchy colors
  const urgencyConfig = {
    critical: {
      bg: "bg-red-50",
      border: "border-red-500",
      text: "text-red-700",
      icon: AlertTriangle,
      badge: "bg-red-100 text-red-700",
    },
    high: {
      bg: "bg-orange-50",
      border: "border-orange-500",
      text: "text-orange-700",
      icon: AlertCircle,
      badge: "bg-orange-100 text-orange-700",
    },
    medium: {
      bg: "bg-yellow-50",
      border: "border-yellow-500",
      text: "text-yellow-700",
      icon: AlertCircle,
      badge: "bg-yellow-100 text-yellow-700",
    },
    low: {
      bg: "bg-gray-50",
      border: "border-gray-400",
      text: "text-gray-600",
      icon: null,
      badge: "bg-gray-100 text-gray-700",
    },
  };

  const config = urgencyConfig[action.urgencyLevel];
  const UrgencyIcon = config.icon;

  const senderName = action.communication?.metadata?.from?.split('<')[0].trim() || "Unknown";
  const timeAgo = formatDistanceToNow(new Date(action.createdAt), { addSuffix: true });

  const handleSendReply = async () => {
    if (!replyContent.trim() || !action.clientId) return;
    
    setIsProcessing(true);
    try {
      await createCommunication({
        clientId: action.clientId,
        type: "email",
        direction: "outbound",
        subject: `Re: ${action.title}`,
        content: replyContent,
      });

      toast.success("Reply sent successfully!");
      setViewState('complete');
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      // Save internal note if provided
      if (internalNote.trim() && action.clientId) {
        await createInternalNote({
          clientId: action.clientId,
          content: internalNote,
          relatedActionId: action._id,
          relatedCommunicationId: action.communicationId,
        });
      }

      // Save billable time if provided
      if (timeSpent && parseFloat(timeSpent) > 0 && action.clientId) {
        await createTimeEntry({
          clientId: action.clientId,
          duration: parseFloat(timeSpent),
          description: `Time on: ${action.title}`,
          billable: true,
          relatedActionId: action._id,
        });
      }

      onArchive();
      toast.success("Task completed!");
    } catch (error) {
      toast.error("Failed to complete task");
    } finally {
      setIsProcessing(false);
    }
  };

  // Get key information
  const getRecommendedAction = () => {
    if (action.urgencyLevel === "critical") {
      if (action.keyContext?.toLowerCase().includes("medication")) {
        return "Contact healthcare provider immediately";
      }
      if (action.keyContext?.toLowerCase().includes("fall")) {
        return "Arrange immediate safety assessment";
      }
      return "Respond immediately - urgent care needed";
    }
    
    if (action.type === "lead") {
      return "Schedule assessment within 24-48 hours";
    }
    
    return "Respond within 24 hours";
  };

  return (
    <div 
      className="h-full flex flex-col relative"
      style={{ touchAction: isDragging ? 'none' : 'auto' }}
    >
      {/* Minimal Progress Dots */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-10">
        <div className={cn(
          "h-1 w-1 rounded-full transition-all duration-300",
          viewState === 'message' ? "w-6 bg-gray-900" : "bg-gray-300"
        )} />
        <div className={cn(
          "h-1 w-1 rounded-full transition-all duration-300",
          viewState === 'context' ? "w-6 bg-gray-900" : "bg-gray-300"
        )} />
        <div className={cn(
          "h-1 w-1 rounded-full transition-all duration-300",
          viewState === 'reply' ? "w-6 bg-gray-900" : "bg-gray-300"
        )} />
        <div className={cn(
          "h-1 w-1 rounded-full transition-all duration-300",
          viewState === 'complete' ? "w-6 bg-gray-900" : "bg-gray-300"
        )} />
      </div>

      <AnimatePresence mode="wait">
        {viewState === 'message' && (
          <motion.div
            key="message"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col"
          >
            {/* Message State - Clean conversation view */}
            <div className={cn(
              "flex-1 overflow-hidden flex flex-col bg-white",
              action.urgencyLevel === "critical" && "border-l-4 border-red-500"
            )}>
              {/* Minimal Text Header */}
              <div className="p-6 pb-4">
                <div className="flex items-baseline justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {action.client?.name || "Unknown"}
                  </h2>
                  <span className="text-xs text-gray-500">{position}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {senderName} • {timeAgo}
                  {action.urgencyLevel === "critical" && (
                    <span className="text-red-600 font-medium"> • Urgent</span>
                  )}
                </p>
              </div>

              {/* Message Content - Clean and readable */}
              <div className="flex-1 overflow-y-auto px-6">
                <div className="space-y-4">
                  {/* Subject as conversation starter */}
                  <h3 className="text-base font-medium text-gray-900">
                    {action.communication?.subject || action.title}
                  </h3>
                  
                  {/* Email body as message */}
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {action.communication?.content || "No message content available"}
                  </div>
                </div>
              </div>

              {/* Simple Action */}
              <div className="p-6 pt-4">
                <button
                  onClick={() => setViewState('context')}
                  className="w-full py-3 text-[#10292E] font-medium text-center hover:bg-gray-50 rounded-lg transition-colors"
                >
                  View context →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Context State - Show insights and recommendations */}
        {viewState === 'context' && (
          <motion.div
            key="context"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col"
          >
            <div className={cn(
              "flex-1 overflow-hidden flex flex-col bg-white",
              action.urgencyLevel === "critical" && "border-l-4 border-red-500"
            )}>
              {/* Simple Back Header */}
              <div className="p-6 pb-4">
                <button
                  onClick={() => setViewState('message')}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to message
                </button>
                <h2 className="text-lg font-semibold text-gray-900">About {action.client?.name?.split(' ')[0]}</h2>
              </div>

              {/* Clean Context Content */}
              <div className="flex-1 overflow-y-auto px-6 space-y-6">
                {/* Client Status - Simple text */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Client Status</p>
                  <p className="text-base text-gray-900">
                    {action.type === "lead" ? "New Client" : "Existing Client"} • 
                    {action.urgencyLevel === "critical" ? " Critical Priority" : 
                     action.urgencyLevel === "high" ? " High Priority" : 
                     " Standard Priority"}
                  </p>
                </div>

                {/* Key Context - Conversational */}
                {action.keyContext && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">What we know</p>
                    <p className="text-base text-gray-900 leading-relaxed">
                      {action.keyContext}
                    </p>
                  </div>
                )}

                {/* Recommendation - Direct */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Recommended next step</p>
                  <p className="text-base text-gray-900 font-medium">
                    {getRecommendedAction()}
                  </p>
                </div>

                {/* Recent History - Minimal */}
                {action.communicationHistory && action.communicationHistory.length > 1 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">Recent messages</p>
                    <div className="space-y-3">
                      {action.communicationHistory.slice(1, 3).map((comm) => (
                        <div key={comm._id} className="border-l-2 border-gray-200 pl-3">
                          <p className="text-xs text-gray-500 mb-1">
                            {formatDistanceToNow(new Date(comm.createdAt), { addSuffix: true })}
                          </p>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {comm.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Simple Actions */}
              <div className="p-6 space-y-2">
                <button
                  onClick={() => setViewState('reply')}
                  className="w-full py-3 bg-[#10292E] text-white font-medium text-center rounded-lg hover:bg-[#10292E]/90 transition-colors"
                >
                  Reply to {action.client?.name?.split(' ')[0]}
                </button>
                
                {action.urgencyLevel === "critical" && (
                  <button
                    className="w-full py-3 text-red-600 font-medium text-center hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Call immediately
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Reply State - Clean composer */}
        {viewState === 'reply' && (
          <motion.div
            key="reply"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col"
          >
            <div className={cn(
              "flex-1 overflow-hidden flex flex-col bg-white",
              action.urgencyLevel === "critical" && "border-l-4 border-red-500"
            )}>
              {/* Minimal Header */}
              <div className="p-6 pb-4">
                <button
                  onClick={() => setViewState('context')}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Reply to {action.client?.name?.split(' ')[0]}
                </h2>
                <p className="text-sm text-gray-600">
                  Re: {action.communication?.subject || action.title}
                </p>
              </div>

              {/* Clean Composer */}
              <div className="flex-1 px-6 overflow-y-auto">
                <textarea
                  placeholder="Type your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full min-h-[300px] text-base resize-none border-0 outline-none placeholder-gray-400"
                  autoFocus
                />
                
                {/* Quick Responses - Subtle */}
                {replyContent.length === 0 && (
                  <div className="mt-8 space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Quick responses</p>
                    <button
                      onClick={() => setReplyContent("I'll look into this right away and get back to you shortly.")}
                      className="block w-full text-left text-sm text-gray-600 hover:text-gray-900 py-2 border-l-2 border-gray-200 pl-3 hover:border-gray-400 transition-colors"
                    >
                      I'll look into this right away...
                    </button>
                    <button
                      onClick={() => setReplyContent("I understand your concern and will coordinate with the care team immediately.")}
                      className="block w-full text-left text-sm text-gray-600 hover:text-gray-900 py-2 border-l-2 border-gray-200 pl-3 hover:border-gray-400 transition-colors"
                    >
                      I understand your concern...
                    </button>
                  </div>
                )}
              </div>

              {/* Simple Send Button */}
              <div className="p-6">
                <button
                  onClick={handleSendReply}
                  disabled={!replyContent.trim() || isProcessing}
                  className={cn(
                    "w-full py-3 font-medium text-center rounded-lg transition-colors",
                    replyContent.trim() 
                      ? "bg-[#87CEEB] text-[#10292E] hover:bg-[#87CEEB]/90" 
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {isProcessing ? "Sending..." : "Send reply"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Complete State - Optional notes */}
        {viewState === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col"
          >
            <div className="flex-1 overflow-hidden flex flex-col bg-white">
              {/* Simple Success Message */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Reply sent!</h2>
                </div>

                {/* Optional Fields - Conversational */}
                <div className="space-y-6">
                  {/* Internal Note */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Add a note for the team?</p>
                    <textarea
                      placeholder="Optional internal note..."
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      className="w-full min-h-[80px] p-3 bg-yellow-50 rounded-lg resize-none border-0 outline-none placeholder-gray-400"
                    />
                  </div>

                  {/* Time Tracking - Simple */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Time spent on this task?</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        placeholder="0"
                        value={timeSpent}
                        onChange={(e) => setTimeSpent(e.target.value)}
                        className="w-20 px-3 py-2 bg-gray-50 rounded-lg border-0 outline-none text-center"
                        min="0"
                        step="5"
                      />
                      <span className="text-sm text-gray-600">minutes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simple Actions */}
              <div className="mt-auto p-6 space-y-3">
                <button
                  onClick={handleComplete}
                  disabled={isProcessing}
                  className="w-full py-3 bg-[#10292E] text-white font-medium text-center rounded-lg hover:bg-[#10292E]/90 transition-colors"
                >
                  {isProcessing ? "Saving..." : "Complete task"}
                </button>
                
                <button
                  onClick={() => {
                    onArchive();
                    toast.success("Task completed!");
                  }}
                  className="w-full py-3 text-gray-500 text-center hover:text-gray-700 transition-colors"
                >
                  Skip notes and complete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}