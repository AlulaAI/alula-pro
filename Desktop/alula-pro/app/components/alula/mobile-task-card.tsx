"use client";

import React from "react";
import { MobileChatView } from "./mobile-chat-view";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

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
      direction: string;
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
      direction: string;
      type: string;
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
  const createCommunication = useMutation(api.communications.create);

  // Transform communication history into chat messages
  const messages = React.useMemo(() => {
    const msgs = [];
    
    // Add current communication as the most recent message
    if (action.communication) {
      msgs.push({
        id: action.communication._id,
        type: action.communication.direction === 'inbound' ? 'client' : 'consultant' as const,
        content: action.communication.content,
        timestamp: action.communication.createdAt,
        sender: action.communication.direction === 'inbound' 
          ? action.client?.name 
          : "You",
        metadata: {
          channel: action.communication.type as 'email' | 'phone' | 'in-person',
        }
      });
    }
    
    // Add communication history
    if (action.communicationHistory) {
      action.communicationHistory.forEach((comm) => {
        if (comm._id !== action.communication?._id) {
          msgs.push({
            id: comm._id,
            type: comm.direction === 'inbound' ? 'client' : 'consultant' as const,
            content: comm.content,
            timestamp: comm.createdAt,
            sender: comm.direction === 'inbound' 
              ? action.client?.name 
              : "You",
            metadata: {
              channel: comm.type as 'email' | 'phone' | 'in-person',
            }
          });
        }
      });
    }
    
    // Sort by timestamp, most recent first
    return msgs.sort((a, b) => b.timestamp - a.timestamp);
  }, [action]);

  const handleReply = async (message: string) => {
    if (!message.trim() || !action.clientId) return;
    
    try {
      await createCommunication({
        clientId: action.clientId,
        type: "email",
        direction: "outbound",
        subject: `Re: ${action.communication?.subject || action.title}`,
        content: message,
      });

      toast.success("Reply sent successfully!");
      
      // Archive the action after successful reply
      setTimeout(() => {
        onArchive();
      }, 1500);
    } catch (error) {
      toast.error("Failed to send reply");
    }
  };

  return (
    <MobileChatView
      action={action}
      messages={messages}
      aiContext={action.keyContext || ""}
      onArchive={onArchive}
      onSnooze={onSnooze}
      onReply={handleReply}
      onBack={onSwipeLeft}
    />
  );
}