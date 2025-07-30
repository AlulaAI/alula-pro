"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Clock, 
  Archive, 
  Phone, 
  Mail,
  MessageCircle,
  Sparkles,
  ChevronLeft,
  User
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

interface Message {
  id: string;
  type: 'client' | 'consultant' | 'system' | 'context';
  content: string;
  timestamp: number;
  sender?: string;
  metadata?: {
    urgency?: string;
    channel?: 'email' | 'phone' | 'in-person';
  };
}

interface MobileChatViewProps {
  action: any;
  messages: Message[];
  aiContext: string;
  onArchive: () => void;
  onSnooze: (hours: number) => void;
  onReply: (message: string) => void;
  onBack?: () => void;
}

export function MobileChatView({
  action,
  messages,
  aiContext,
  onArchive,
  onSnooze,
  onReply,
  onBack
}: MobileChatViewProps) {
  const [replyText, setReplyText] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  const quickReplies = [
    "I'll call you this afternoon to discuss",
    "Thank you for reaching out. Let me look into this",
    "I've scheduled time to visit tomorrow",
    "I'll coordinate with your family about this"
  ];

  const MessageBubble = ({ message }: { message: Message }) => {
    const isClient = message.type === 'client';
    const isContext = message.type === 'context';
    const isSystem = message.type === 'system';

    if (isContext) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 my-3"
        >
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-900 mb-1">Context Summary</p>
                <p className="text-sm text-gray-700 leading-relaxed">{message.content}</p>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    if (isSystem) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center my-4"
        >
          <span className="text-xs text-gray-400">{message.content}</span>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, x: isClient ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "flex gap-3 mb-4",
          isClient ? "justify-start" : "justify-end"
        )}
      >
        {isClient && (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-gray-600" />
          </div>
        )}
        
        <div className={cn(
          "max-w-[75%]",
          isClient ? "order-2" : "order-1"
        )}>
          <div className={cn(
            "rounded-2xl px-4 py-3",
            isClient 
              ? "bg-gray-100 text-gray-900" 
              : "bg-blue-600 text-white"
          )}>
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          <div className={cn(
            "flex items-center gap-2 mt-1",
            isClient ? "justify-start" : "justify-end"
          )}>
            <span className="text-xs text-gray-400">
              {format(message.timestamp, 'h:mm a')}
            </span>
            {message.metadata?.channel && (
              <span className="text-xs text-gray-400">
                via {message.metadata.channel}
              </span>
            )}
          </div>
        </div>

        {!isClient && (
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 order-2">
            <span className="text-white font-medium text-sm">You</span>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900">{action.client?.name}</h1>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className={cn(
                "capitalize",
                action.urgencyLevel === 'critical' && "text-red-600 font-medium"
              )}>
                {action.urgencyLevel} priority
              </span>
              <span>•</span>
              <span>{formatDistanceToNow(action.createdAt, { addSuffix: true })}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
              <Mail className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-4">
          {/* Date separator */}
          <div className="flex justify-center mb-4">
            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
              {format(messages[0]?.timestamp || Date.now(), 'MMMM d, yyyy')}
            </span>
          </div>

          {/* AI Context Card */}
          {aiContext && (
            <MessageBubble 
              message={{
                id: 'context',
                type: 'context',
                content: aiContext,
                timestamp: Date.now()
              }}
            />
          )}

          {/* Messages */}
          <div className="px-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>

          {/* Action needed indicator */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-6"
          >
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <p className="text-sm text-amber-900 font-medium mb-2">
                Action Needed
              </p>
              <p className="text-sm text-amber-800">
                {action.summary}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reply Section */}
      <div className="border-t border-gray-100 bg-gray-50 p-4">
        {/* Quick Replies */}
        {showQuickReplies && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Quick replies:</p>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setReplyText(reply);
                    setShowQuickReplies(false);
                  }}
                  className="flex-shrink-0 text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reply Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onFocus={() => setShowQuickReplies(false)}
            placeholder="Type your response..."
            className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => {
              if (replyText.trim()) {
                onReply(replyText);
                setReplyText("");
              }
            }}
            disabled={!replyText.trim()}
            className={cn(
              "p-2 rounded-full transition-colors",
              replyText.trim() 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "bg-gray-200 text-gray-400"
            )}
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onSnooze(4)}
            className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4 text-gray-500" />
            Snooze 4h
          </button>
          <button
            onClick={onArchive}
            className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Archive className="w-4 h-4 text-gray-500" />
            Complete
          </button>
        </div>
      </div>
    </div>
  );
}