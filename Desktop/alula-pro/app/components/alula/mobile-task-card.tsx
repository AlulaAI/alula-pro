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
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  Timer,
  Send,
  Archive,
  StickyNote,
  Mail,
  X,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

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
  const [showReply, setShowReply] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const createCommunication = useMutation(api.communications.create);

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

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && !isLast && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && !isFirst && onSwipeRight) {
      onSwipeRight();
    }
  };

  const handleQuickReply = async () => {
    if (!replyContent.trim() || !action.clientId) return;
    
    setIsReplying(true);
    try {
      await createCommunication({
        clientId: action.clientId,
        type: "email",
        direction: "outbound",
        subject: `Re: ${action.title}`,
        content: replyContent,
      });

      toast.success("Reply sent!");
      setReplyContent("");
      setShowReply(false);
      onArchive();
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div 
      className="h-full flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Card className={cn(
        "flex-1 overflow-hidden flex flex-col",
        config.border,
        "border-l-4"
      )}>
        {/* Compact Header */}
        <div className={cn(config.bg, "p-4 border-b")}>
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm flex-shrink-0">
              <AvatarImage 
                src={action.client?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${action.client?.name}`} 
              />
              <AvatarFallback className={cn(config.bg, config.text, "font-bold text-sm")}>
                {action.client?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm text-gray-900 truncate">
                  {action.client?.name || "Unknown"}
                </h3>
                {action.type === "lead" && (
                  <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">
                    NEW
                  </Badge>
                )}
                {action.type === "client" && (
                  <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0">
                    EXISTING
                  </Badge>
                )}
              </div>
              
              <div className="flex items-start gap-1.5">
                {UrgencyIcon && <UrgencyIcon className={cn("h-4 w-4 mt-0.5", config.text)} />}
                <p className="text-xs font-medium text-gray-700 line-clamp-2">
                  {action.summary}
                </p>
              </div>

              <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </span>
                <Badge className={cn(config.badge, "text-[10px] px-1.5 py-0")}>
                  {action.urgencyLevel}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Email Preview - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          <div className="space-y-3">
            {/* From Line */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <Mail className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs text-gray-600">From:</span>
              <span className="text-xs font-medium text-gray-900">{senderName}</span>
            </div>

            {/* Key Context */}
            {action.keyContext && (
              <div className="bg-gray-50 rounded-lg p-2.5 mb-3">
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">Key Context</span>
                </div>
                <p className="text-xs text-gray-800 font-medium">
                  {action.keyContext}
                </p>
              </div>
            )}

            {/* Email Content */}
            {action.communication && (
              <div className="text-sm text-gray-700 leading-relaxed">
                <p className="whitespace-pre-wrap">
                  {action.communication.content.slice(0, 300)}
                  {action.communication.content.length > 300 && '...'}
                </p>
              </div>
            )}

            {/* AI Recommendations */}
            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-medium text-blue-900">Quick Actions</span>
              </div>
              {action.urgencyLevel === "critical" ? (
                <div className="space-y-1.5">
                  <button className="w-full text-left text-xs text-blue-700 font-medium">
                    • Call Dr. Martinez about medication review
                  </button>
                  <button className="w-full text-left text-xs text-blue-700 font-medium">
                    • Alert home health aide about fall risk
                  </button>
                </div>
              ) : (
                <button className="w-full text-left text-xs text-blue-700 font-medium">
                  • Schedule assessment call within 24-48 hours
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="border-t bg-gray-50 p-3">
          {!showReply ? (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowReply(true)}
                size="sm"
                className="flex-1 bg-[#10292E] hover:bg-[#10292E]/90 text-white h-10"
              >
                <MessageSquare className="h-4 w-4 mr-1.5" />
                Reply
              </Button>
              
              {action.urgencyLevel === "critical" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-red-500 text-red-600 h-10"
                >
                  <Phone className="h-4 w-4 mr-1.5" />
                  Call
                </Button>
              )}
              
              <Button
                onClick={() => setShowQuickActions(!showQuickActions)}
                size="sm"
                variant="ghost"
                className="h-10 w-10 p-0"
              >
                {showQuickActions ? <X className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="Type your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[100px] text-sm resize-none"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setShowReply(false);
                    setReplyContent("");
                  }}
                  size="sm"
                  variant="ghost"
                  className="flex-1 h-10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleQuickReply}
                  disabled={!replyContent.trim() || isReplying}
                  size="sm"
                  className="flex-1 bg-[#87CEEB] hover:bg-[#87CEEB]/90 text-[#10292E] h-10"
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  Send & Archive
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        {showQuickActions && (
          <div className="border-t bg-white p-3 space-y-2 animate-in slide-in-from-bottom-2">
            <button
              onClick={() => onSnooze(4)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 active:bg-gray-100"
            >
              <span className="flex items-center gap-2 text-sm text-gray-700">
                <Clock className="h-4 w-4" />
                Snooze for 4 hours
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400 rotate-270" />
            </button>
            
            <button
              onClick={onArchive}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 active:bg-gray-100"
            >
              <span className="flex items-center gap-2 text-sm text-gray-700">
                <Archive className="h-4 w-4" />
                Archive without reply
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400 rotate-270" />
            </button>
          </div>
        )}

        {/* Position Indicator */}
        {position && (
          <div className="text-center py-2 text-[10px] text-gray-500 bg-gray-50 border-t">
            {position}
          </div>
        )}
      </Card>
    </div>
  );
}