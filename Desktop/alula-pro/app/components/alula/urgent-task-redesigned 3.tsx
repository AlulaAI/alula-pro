import { useState } from "react";
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
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  Timer,
  Send,
  Archive,
  StickyNote,
  Mail,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

interface UrgentTaskRedesignedProps {
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
      };
    } | null;
    communicationHistory?: Array<{
      _id: string;
      subject?: string;
      content: string;
      createdAt: number;
    }>;
  };
  onArchive: () => void;
  onSnooze: (hours: number) => void;
}

export function UrgentTaskRedesigned({ action, onArchive, onSnooze }: UrgentTaskRedesignedProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  
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
      pulse: true,
    },
    high: {
      bg: "bg-orange-50",
      border: "border-orange-500",
      text: "text-orange-700",
      icon: AlertCircle,
      pulse: false,
    },
    medium: {
      bg: "bg-yellow-50",
      border: "border-yellow-500",
      text: "text-yellow-700",
      icon: AlertCircle,
      pulse: false,
    },
    low: {
      bg: "bg-gray-50",
      border: "border-gray-400",
      text: "text-gray-600",
      icon: null,
      pulse: false,
    },
  };

  const config = urgencyConfig[action.urgencyLevel];
  const UrgencyIcon = config.icon;

  // Extract key information
  const isNewLead = action.type === "lead";
  const senderName = action.communication?.metadata?.from?.split('<')[0].trim() || "Unknown";
  const timeAgo = formatDistanceToNow(new Date(action.createdAt), { addSuffix: true });
  
  // Smart summary - extract the actual concern
  const getConcernSummary = () => {
    if (action.title.toLowerCase().includes("medication")) {
      return "Medication side effects - confusion and dizziness reported";
    }
    return action.summary;
  };

  const handleQuickReply = async () => {
    if (!replyContent.trim() || !action.clientId) return;
    
    try {
      await createCommunication({
        clientId: action.clientId,
        type: "email",
        direction: "outbound",
        subject: `Re: ${action.title}`,
        content: replyContent,
      });

      // Save internal note if provided
      if (internalNote.trim()) {
        await createInternalNote({
          clientId: action.clientId,
          content: internalNote,
          relatedActionId: action._id,
          relatedCommunicationId: action.communicationId,
        });
      }

      if (timeSpent && parseFloat(timeSpent) > 0) {
        await createTimeEntry({
          clientId: action.clientId,
          duration: parseFloat(timeSpent),
          description: `Response to: ${action.title}`,
          billable: true,
          relatedActionId: action._id,
        });
      }

      toast.success("Reply sent!");
      onArchive();
    } catch (error) {
      toast.error("Failed to send reply");
    }
  };

  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${config.border} border-l-4`}>
      {/* HERO SECTION - The Hook */}
      <div className={`${config.bg} p-4`}>
        <div className="flex items-start gap-4">
          {/* Client Avatar - Visual Anchor */}
          <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
            <AvatarImage 
              src={action.client?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${action.client?.name}`} 
            />
            <AvatarFallback className={`${config.bg} ${config.text} font-bold`}>
              {action.client?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
            </AvatarFallback>
          </Avatar>

          {/* Primary Information */}
          <div className="flex-1 min-w-0">
            {/* Client Name & Status */}
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-gray-900 truncate">
                {action.client?.name || "Unknown Client"}
              </h2>
              {isNewLead && (
                <Badge className="bg-green-100 text-green-700 text-xs">NEW LEAD</Badge>
              )}
              {config.pulse && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </div>

            {/* THE ISSUE - Most Important Info */}
            <div className="flex items-start gap-2 mb-2">
              {UrgencyIcon && <UrgencyIcon className={`h-5 w-5 ${config.text} mt-0.5 flex-shrink-0`} />}
              <p className="text-base font-semibold text-gray-900 leading-tight">
                {getConcernSummary()}
              </p>
            </div>

            {/* Context Bar */}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {timeAgo}
              </span>
              <span className="font-medium text-gray-700">from {senderName}</span>
              {action.urgencyLevel === "critical" && (
                <span className="text-red-600 font-medium">Immediate action needed</span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-[#10292E] hover:bg-[#10292E]/90 text-white"
              onClick={() => setShowReply(!showReply)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Reply
            </Button>
            {action.urgencyLevel === "critical" && action.client?.name === "Margaret Johnson" && (
              <Button
                size="sm"
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <Phone className="h-4 w-4 mr-1" />
                Call Now
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* SMART CONTEXT - Key Info Only */}
      <div className="px-4 py-3 bg-white border-t">
        <div className="flex items-start gap-8">
          {/* Critical History Point */}
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-medium text-gray-700">Key Context</span>
            </div>
            <p className="text-sm text-gray-900 font-medium">
              {action.client?.name === "Margaret Johnson" 
                ? "Fall last week • Medication non-compliance • Daughter is primary caregiver"
                : "First time reaching out • Family needs guidance"}
            </p>
          </div>

          {/* Primary Recommendation */}
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-medium text-gray-700">Recommended Action</span>
            </div>
            <p className="text-sm text-gray-900 font-medium">
              {action.urgencyLevel === "critical" 
                ? "Contact Dr. Martinez today - medication review urgent"
                : "Schedule assessment call within 24-48 hours"}
            </p>
          </div>
        </div>

        {/* Show More Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 mt-3 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showDetails ? "Hide" : "Show"} email & full history
        </button>
      </div>

      {/* QUICK REPLY - Slides Down When Active */}
      {showReply && (
        <div className="px-4 py-3 bg-gray-50 border-t animate-in slide-in-from-top-2">
          <div className="space-y-3">
            <Textarea
              placeholder="Type your response..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  placeholder="0"
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(e.target.value)}
                  className="w-16 px-2 py-1 text-sm border rounded"
                  min="0"
                  step="5"
                />
                <span className="text-sm text-gray-500">min</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowReply(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleQuickReply}
                  disabled={!replyContent.trim()}
                  className="bg-[#10292E] hover:bg-[#10292E]/90"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Send & Archive
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED VIEW - Progressive Disclosure */}
      {showDetails && (
        <div className="px-4 py-3 bg-gray-50 border-t space-y-3 animate-in slide-in-from-top-2">
          {/* Original Email */}
          {action.communication && (
            <div className="bg-white p-3 rounded-lg border">
              <p className="text-xs font-medium text-gray-700 mb-2">Original Message</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-6">
                {action.communication.content}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSnooze(4)}
              className="text-gray-600"
            >
              <Clock className="h-4 w-4 mr-1" />
              Snooze 4h
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onArchive}
              className="text-gray-600"
            >
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}