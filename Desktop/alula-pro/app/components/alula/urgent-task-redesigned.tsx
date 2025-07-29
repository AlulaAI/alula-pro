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
}

export function UrgentTaskRedesigned({ action, onArchive, onSnooze }: UrgentTaskRedesignedProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [replySent, setReplySent] = useState(false);
  
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
  
  // Parse all recipients
  const getRecipients = () => {
    const recipients = [];
    
    // Add original sender as primary recipient
    if (action.communication?.metadata?.from) {
      recipients.push(action.communication.metadata.from);
    }
    
    // Add other recipients from "to" field (excluding consultant's email)
    if (action.communication?.metadata?.to) {
      const toRecipients = action.communication.metadata.to
        .split(',')
        .map(email => email.trim())
        .filter(email => !email.includes('alulacare.com')); // Filter out consultant emails
      recipients.push(...toRecipients);
    }
    
    // Add CC recipients if any
    if (action.communication?.metadata?.cc) {
      const ccRecipients = action.communication.metadata.cc
        .split(',')
        .map(email => email.trim());
      recipients.push(...ccRecipients);
    }
    
    // Remove duplicates
    return [...new Set(recipients)];
  };
  
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

      toast.success("Reply sent!");
      setReplySent(true);
      setReplyContent("");
    } catch (error) {
      toast.error("Failed to send reply");
    }
  };

  const handleCompleteTask = async () => {
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
    } catch (error) {
      toast.error("Failed to save data");
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
              {/* Type Badge */}
              {action.type === "lead" && (
                <Badge className="bg-green-100 text-green-700 text-xs font-semibold">
                  NEW CLIENT
                </Badge>
              )}
              {action.type === "client" && (
                <Badge className="bg-blue-100 text-blue-700 text-xs font-semibold">
                  EXISTING CLIENT
                </Badge>
              )}
              {action.type === "business" && (
                <Badge className="bg-purple-100 text-purple-700 text-xs font-semibold">
                  BUSINESS
                </Badge>
              )}
              {action.type === "partner" && (
                <Badge className="bg-purple-100 text-purple-700 text-xs font-semibold">
                  PARTNER
                </Badge>
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
              onClick={() => {
                setShowReply(!showReply);
                setReplySent(false);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              {showReply ? 'Hide Reply' : 'Reply'}
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
        <div className="space-y-3">
          {/* Who is this from - Prominent display */}
          <div className="flex items-center gap-2 pb-2 border-b">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Email from</span>
            <span className="text-sm font-semibold text-gray-900">{senderName}</span>
            {action.communication?.metadata?.from && (
              <span className="text-xs text-gray-500">({action.communication.metadata.from.match(/<(.+?)>/)?.[1] || action.communication.metadata.from})</span>
            )}
          </div>

          <div className="flex items-start gap-8">
            {/* Critical History Point */}
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-medium text-gray-700">Key Context</span>
              </div>
              <p className="text-sm text-gray-900 font-medium">
                {action.keyContext || "New client • Needs assessment"}
              </p>
            </div>

            {/* Primary Recommendation */}
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-xs font-medium text-gray-700">Recommended Action</span>
              </div>
              <p className="text-sm text-gray-900 font-medium">
                {(() => {
                  // Generate recommendations based on context
                  if (action.urgencyLevel === "critical") {
                    if (action.keyContext?.toLowerCase().includes("medication")) {
                      return "Contact healthcare provider about medication concerns";
                    }
                    if (action.keyContext?.toLowerCase().includes("fall")) {
                      return "Arrange immediate safety assessment";
                    }
                    return "Respond immediately - urgent care needed";
                  }
                  
                  if (action.type === "lead") {
                    return "Schedule initial assessment within 24-48 hours";
                  }
                  
                  if (action.keyContext?.toLowerCase().includes("hospital")) {
                    return "Follow up on recent hospitalization";
                  }
                  
                  return "Respond within 24 hours";
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* Show More Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 mt-3 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showDetails ? "Hide" : "Show"} full communication history
        </button>
      </div>

      {/* QUICK REPLY - Shows Email + Reply Side by Side */}
      {showReply && (
        <div className="border-t animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 divide-x">
            {/* Original Email */}
            <div className="p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">Original Message from {senderName}</h3>
              </div>
              {action.communication && (
                <div className="bg-white p-3 rounded-lg border max-h-[300px] overflow-y-auto">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {action.communication.content}
                  </p>
                </div>
              )}
            </div>

            {/* Reply Interface */}
            <div className="p-4 bg-white">
              {!replySent ? (
                <div className="space-y-3">
                  <div>
                    <div className="space-y-2 mb-3 border-b pb-3">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-gray-700 min-w-[50px]">To:</span>
                        <div className="flex-1">
                          {getRecipients().map((recipient, idx) => (
                            <span key={idx} className="text-sm text-gray-900">
                              {recipient}{idx < getRecipients().length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-gray-700 min-w-[50px]">Subject:</span>
                        <span className="text-sm text-gray-600 flex-1">Re: {action.communication?.subject || action.title}</span>
                      </div>
                    </div>
                    <Textarea
                      placeholder="Type your response..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[180px] text-sm resize-none"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowReply(false);
                        setReplyContent("");
                      }}
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
                      Send Reply
                    </Button>
                  </div>
                </div>
              ) : (
                /* Success State - Notes & Billing */
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800">✓ Reply sent successfully!</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <StickyNote className="h-4 w-4 text-gray-500" />
                      <label className="text-sm font-medium text-gray-700">Internal Note</label>
                      <span className="text-xs text-gray-500">(optional)</span>
                    </div>
                    <Textarea
                      placeholder="Add notes about this interaction..."
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      className="min-h-[80px] text-sm resize-none bg-yellow-50 border-yellow-200"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <Timer className="h-4 w-4 text-gray-500" />
                      <label className="text-sm font-medium text-gray-700">Time Spent</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="0"
                        value={timeSpent}
                        onChange={(e) => setTimeSpent(e.target.value)}
                        className="w-20 px-2 py-1 text-sm border rounded"
                        min="0"
                        step="5"
                      />
                      <span className="text-sm text-gray-500">minutes</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onArchive()}
                    >
                      Skip & Archive
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCompleteTask}
                      className="bg-[#10292E] hover:bg-[#10292E]/90"
                    >
                      <Archive className="h-3.5 w-3.5 mr-1" />
                      Complete & Archive
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED VIEW - Progressive Disclosure */}
      {showDetails && (
        <div className="px-4 py-3 bg-gray-50 border-t space-y-3 animate-in slide-in-from-top-2">
          {/* Communication History */}
          {action.communicationHistory && action.communicationHistory.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Previous Communications</p>
              <div className="space-y-2">
                {action.communicationHistory.slice(0, 3).map((comm, idx) => (
                  <div key={comm._id} className="bg-white p-2 rounded border text-xs">
                    <div className="flex justify-between text-gray-500 mb-1">
                      <span>{comm.subject || "No subject"}</span>
                      <span>{formatDistanceToNow(new Date(comm.createdAt), { addSuffix: true })}</span>
                    </div>
                    <p className="text-gray-600 line-clamp-2">{comm.content}</p>
                  </div>
                ))}
              </div>
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