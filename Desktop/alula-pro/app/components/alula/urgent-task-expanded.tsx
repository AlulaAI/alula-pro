import { useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import { Separator } from "~/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  AlertCircle,
  MessageSquare,
  Send,
  Clock,
  Archive,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  User,
  Calendar,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

interface UrgentTaskExpandedProps {
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
      aiSummary?: string;
      metadata?: {
        messageId?: string;
        threadId?: string;
        from?: string;
      };
    } | null;
    communicationHistory?: Array<{
      _id: string;
      subject?: string;
      content: string;
      createdAt: number;
    }>;
    aiSummary?: string;
    aiRecommendations?: string[];
  };
  onArchive: () => void;
  onSnooze: (hours: number) => void;
}

export function UrgentTaskExpanded({ action, onArchive, onSnooze }: UrgentTaskExpandedProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  
  const createCommunication = useMutation(api.communications.create);
  const sendGmailReply = useMutation(api.gmailActions.sendReply);
  
  // Debug logging
  console.log("UrgentTaskExpanded action:", action);
  console.log("Communication data:", action.communication);

  const urgencyColors = {
    critical: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !action.clientId) return;

    setIsReplying(true);
    try {
      // Check if this is a Gmail communication with metadata
      if (action.communication?.metadata?.messageId) {
        await sendGmailReply({
          messageId: action.communication.metadata.messageId,
          threadId: action.communication.metadata.threadId,
          to: action.communication.metadata.from || "",
          subject: `Re: ${action.communication?.subject || action.title}`,
          body: replyContent,
        });
      } else {
        // Fall back to regular communication creation
        await createCommunication({
          clientId: action.clientId,
          type: "email",
          direction: "outbound",
          subject: `Re: ${action.communication?.subject || action.title}`,
          content: replyContent,
        });
      }
      
      toast.success("Reply sent successfully!");
      setReplyContent("");
      onArchive();
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  const generateHistorySummary = () => {
    if (!action.communicationHistory || action.communicationHistory.length === 0) {
      return "This is your first interaction with this client.";
    }

    const recentCount = action.communicationHistory.length;
    const lastContact = action.communicationHistory[0];
    const daysAgo = Math.floor(
      (Date.now() - lastContact.createdAt) / (1000 * 60 * 60 * 24)
    );

    return `You've had ${recentCount} interactions with ${action.client?.name || "this client"} in the past 30 days. Your last contact was ${daysAgo} days ago regarding ${lastContact.subject || "general care updates"}.`;
  };

  const generateRecommendations = () => {
    const recommendations = [];
    
    if (action.urgencyLevel === "critical") {
      recommendations.push({
        icon: Phone,
        text: "Consider a phone call follow-up within 24 hours",
        priority: "high",
      });
    }

    if (action.communication?.content?.toLowerCase().includes("medication")) {
      recommendations.push({
        icon: AlertCircle,
        text: "Verify medication changes with healthcare provider",
        priority: "medium",
      });
    }

    recommendations.push({
      icon: Calendar,
      text: "Schedule a check-in for next week",
      priority: "low",
    });

    return recommendations;
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="border-l-4 border-l-red-500 shadow-lg">
      {/* Client Profile Header */}
      {action.client && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
              <AvatarImage src={action.client.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${action.client.name}`} />
              <AvatarFallback className="bg-red-100 text-red-700 font-semibold">
                {getInitials(action.client.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#10292E]">{action.client.name}</h3>
              <p className="text-xs text-[#737373]">Client since {formatDistanceToNow(new Date(action.createdAt - 90 * 24 * 60 * 60 * 1000), { addSuffix: true })}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Task Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <h2 className="text-lg font-semibold text-[#10292E]">{action.title}</h2>
              <Badge className={urgencyColors[action.urgencyLevel]}>
                {action.urgencyLevel}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-[#737373]">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
              </span>
              {action.dueDate && (
                <span className="flex items-center gap-1 text-red-600">
                  <Calendar className="h-3 w-3" />
                  Due {format(new Date(action.dueDate), "MMM d, h:mm a")}
                </span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <>
          <Separator />
          
          {/* Email Content */}
          <div className="p-3 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-3 w-3 text-[#737373]" />
              <h3 className="font-medium text-sm text-[#10292E]">Original Message</h3>
            </div>
            {action.communication ? (
              <div className="bg-white p-3 rounded-lg border space-y-2">
                {/* Sender and Client Info */}
                <div className="flex items-start justify-between text-xs">
                  <div className="space-y-1">
                    {action.communication.metadata?.from && (
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-3 w-3 text-[#737373]" />
                        <span className="text-[#737373]">From:</span>
                        <span className="text-[#10292E] font-medium">{action.communication.metadata.from}</span>
                      </div>
                    )}
                    {action.client && (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-[#737373]" />
                        <span className="text-[#737373]">Client:</span>
                        <span className="text-[#10292E] font-medium">{action.client.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[#737373]">
                    {formatDistanceToNow(new Date(action.communication.createdAt), { addSuffix: true })}
                  </div>
                </div>
                
                {/* Subject Line */}
                {action.communication.subject && (
                  <div className="border-b pb-2">
                    <p className="font-semibold text-sm text-[#10292E]">{action.communication.subject}</p>
                  </div>
                )}
                
                {/* Message Content */}
                <div className="pt-1">
                  <p className="text-xs text-[#737373] whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                    {action.communication.content}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-xs text-[#737373] italic">
                  {action.summary || "No message content available"}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* AI Summary & Recommendations */}
          <div className="p-4 space-y-3">
            {/* History Summary and Recommendations Side by Side */}
            <div className="grid grid-cols-2 gap-3">
              {/* History Summary */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Sparkles className="h-3 w-3 text-[#87CEEB]" />
                  <h3 className="font-medium text-sm text-[#10292E]">Client History</h3>
                </div>
                <p className="text-xs text-[#737373] bg-blue-50 p-2 rounded-lg leading-relaxed">
                  {action.communication?.aiSummary || generateHistorySummary()}
                </p>
              </div>

              {/* Recommendations */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Sparkles className="h-3 w-3 text-[#87CEEB]" />
                  <h3 className="font-medium text-sm text-[#10292E]">Recommended Actions</h3>
                </div>
                <div className="space-y-1">
                  {generateRecommendations().map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs"
                    >
                      <rec.icon className="h-3 w-3 text-[#737373] mt-0.5 flex-shrink-0" />
                      <span className="text-[#10292E] flex-1 leading-relaxed">{rec.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reply Section */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <MessageSquare className="h-3 w-3 text-[#737373]" />
                <h3 className="font-medium text-sm text-[#10292E]">Reply</h3>
              </div>
              <Textarea
                placeholder="Type your reply here..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[60px] mb-2 text-sm"
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    onClick={handleReply}
                    disabled={!replyContent.trim() || isReplying}
                    className="bg-[#87CEEB] text-[#10292E] hover:bg-[#87CEEB]/90 h-8 text-xs"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Send Reply
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onSnooze(4)}
                    className="h-8 text-xs"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Snooze 4h
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  onClick={onArchive}
                  className="h-8 text-xs"
                >
                  <Archive className="h-3 w-3 mr-1" />
                  Archive
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}