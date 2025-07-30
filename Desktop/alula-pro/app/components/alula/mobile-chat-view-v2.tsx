"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { 
  ChevronLeft,
  X,
  Moon
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

interface Message {
  id: string;
  type: 'client' | 'consultant' | 'system' | 'action';
  content: string;
  timestamp: number;
  sender?: string;
  readBy?: string;
}

interface MobileChatViewV2Props {
  action: any;
  messages: Message[];
  aiContext: string;
  onArchive: () => void;
  onBack?: () => void;
  onShowDetails?: () => void;
}

export function MobileChatViewV2({
  action,
  messages,
  aiContext,
  onArchive,
  onBack,
  onShowDetails
}: MobileChatViewV2Props) {
  const [messageText, setMessageText] = useState("");
  const [showInfoCard, setShowInfoCard] = useState(true);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isClient = message.type === 'client';
    const isAction = message.type === 'action';

    if (isAction) {
      return (
        <div className="px-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-3">{message.content}</p>
            <button 
              onClick={onArchive}
              className="text-blue-600 font-medium text-sm underline"
            >
              Complete task
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="px-4 mb-6">
        {isClient && (
          <div className="flex items-end gap-3 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={action.client?.profileImage} />
              <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                {action.client?.name ? getInitials(action.client.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-sm font-medium text-gray-900">
                {action.client?.name?.split(' ')[0]} • 
              </span>
              <span className="text-sm text-gray-500">
                {action.type === "lead" ? "New Client" : "Client"} {format(message.timestamp, 'h:mm a')}
              </span>
            </div>
          </div>
        )}
        
        <div className={cn(
          "rounded-2xl px-4 py-3 inline-block max-w-[85%]",
          isClient 
            ? "bg-gray-900 text-white ml-11" 
            : "bg-gray-100 text-gray-900 ml-auto"
        )}>
          <p className="text-base leading-relaxed">{message.content}</p>
        </div>

        {message.readBy && (
          <p className="text-xs text-gray-500 mt-1 text-right">
            Read by {message.readBy}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header - Exact Airbnb Style */}
      <header className="px-4 pt-14 pb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 -ml-2"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={action.client?.profileImage} />
            <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
              {action.client?.name ? getInitials(action.client.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-medium text-base">
              {action.client?.name?.split(' ')[0]}
            </h1>
          </div>
        </div>
        
        <button 
          onClick={onShowDetails}
          className="px-4 py-2 bg-gray-100 rounded-full"
        >
          <span className="text-sm font-medium">Details</span>
        </button>
      </header>

      {/* Subtitle */}
      <div className="px-4 pb-4 text-center">
        <p className="text-sm text-gray-600">
          {action.urgencyLevel === "critical" ? "Critical" : ""} {action.type === "lead" ? "New inquiry" : "Client message"} • {action.title}
        </p>
      </div>

      {/* Info Card - Can be dismissed */}
      {showInfoCard && aiContext && (
        <div className="mx-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-4 relative">
            <button
              onClick={() => setShowInfoCard(false)}
              className="absolute top-3 right-3"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <p className="text-sm text-gray-900 font-medium mb-2">
              AI Context Summary
            </p>
            <p className="text-sm text-gray-600">
              {aiContext}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-4">
          {/* Timestamp */}
          <div className="text-center mb-6">
            <span className="text-sm text-gray-500">
              {format(messages[0]?.timestamp || Date.now(), 'h:mm a')}
            </span>
          </div>

          {/* Messages */}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Action Card */}
          {action.urgencyLevel === "critical" && (
            <MessageBubble 
              message={{
                id: 'action',
                type: 'action',
                content: 'This client needs immediate attention. Would you like to complete this task now?',
                timestamp: Date.now()
              }}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        {/* Time indicator */}
        <div className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-500">
          <Moon className="w-4 h-4" />
          <span>It's {format(new Date(), 'h:mm a')} for your {action.type === "lead" ? "lead" : "client"}.</span>
        </div>

        {/* Message Input */}
        <div className="relative">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Write a message..."
            className="w-full bg-gray-100 rounded-full px-4 py-3 pr-12 text-base placeholder-gray-500 focus:outline-none"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="px-4 pb-8">
        <button 
          onClick={onArchive}
          className="w-full bg-gray-900 text-white rounded-lg py-4 font-medium text-base hover:bg-gray-800 transition-colors"
        >
          Complete Task
        </button>
      </div>
    </div>
  );
}