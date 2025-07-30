"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  Search,
  Settings,
  ChevronRight
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

interface Task {
  _id: string;
  type: "client" | "business" | "lead" | "partner";
  title: string;
  summary: string;
  urgencyLevel: "critical" | "high" | "medium" | "low";
  createdAt: number;
  client?: {
    _id: string;
    name: string;
    profileImage?: string;
  } | null;
  communication?: {
    content: string;
    createdAt: number;
  } | null;
}

interface MobileTaskListProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
  currentFilter: string;
  onFilterChange: (filter: string) => void;
}

export function MobileTaskList({
  tasks,
  onTaskSelect,
  currentFilter,
  onFilterChange
}: MobileTaskListProps) {
  const filters = [
    { id: "all", label: "All" },
    { id: "critical", label: "Critical" },
    { id: "clients", label: "Clients" },
    { id: "new", label: "New" }
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusLine = (task: Task) => {
    if (task.urgencyLevel === "critical") {
      return "• Critical - Immediate attention needed";
    }
    if (task.type === "lead") {
      return "• New client inquiry";
    }
    return "• " + task.summary.slice(0, 50) + "...";
  };

  const getLastMessage = (task: Task) => {
    if (task.communication?.content) {
      return task.communication.content.slice(0, 60) + "...";
    }
    return task.summary;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="px-4 pt-14 pb-6">
        <div className="flex justify-end gap-3 mb-6">
          <button className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <h1 className="text-4xl font-semibold text-gray-900 mb-6">Messages</h1>
        
        {/* Filter Pills */}
        <div className="flex gap-3 overflow-x-auto">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                currentFilter === filter.id
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {tasks.map((task, index) => (
          <button
            key={task._id}
            onClick={() => onTaskSelect(task)}
            className="w-full px-4 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex gap-3">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={task.client?.profileImage} />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-medium">
                    {task.client?.name ? getInitials(task.client.name) : "?"}
                  </AvatarFallback>
                </Avatar>
                {task.urgencyLevel === "critical" && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 text-left">
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="font-medium text-gray-900">
                    {task.client?.name || "Unknown"}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(task.createdAt, { addSuffix: false })}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-1">
                  {getLastMessage(task)}
                </p>
                
                <div className="flex items-center gap-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    task.urgencyLevel === "critical" ? "bg-red-500" : "bg-gray-400"
                  )} />
                  <span className="text-xs text-gray-500">
                    {getStatusLine(task)}
                  </span>
                </div>

                {/* Action Button */}
                {task.urgencyLevel === "critical" && (
                  <div className="mt-3">
                    <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full">
                      <span className="text-sm font-medium text-gray-900">Respond now</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Separator */}
            {index < tasks.length - 1 && (
              <div className="mt-4 ml-[68px] border-b border-gray-100" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}