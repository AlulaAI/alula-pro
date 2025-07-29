import { Plus, MessageCircle, Home, Archive, Users } from "lucide-react";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";

interface MobileFloatingToolbarProps {
  onAddClient: () => void;
  onAddCommunication: () => void;
  hasUrgentTasks?: boolean;
  taskCount?: number;
}

export function MobileFloatingToolbar({
  onAddClient,
  onAddCommunication,
  hasUrgentTasks,
  taskCount = 0,
}: MobileFloatingToolbarProps) {
  return (
    <>
      {/* Spacer to prevent content from being hidden behind toolbar */}
      <div className="h-20" />
      
      {/* Floating Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Backdrop blur effect */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-md border-t border-gray-200" />
        
        {/* Toolbar Content */}
        <div className="relative px-4 py-3">
          <div className="flex items-center justify-around">
            {/* Home - Dashboard */}
            <button className="flex flex-col items-center gap-1 p-2 rounded-lg active:bg-gray-100 transition-colors">
              <div className="relative">
                <Home className="h-5 w-5 text-gray-700" />
                {hasUrgentTasks && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-[10px] text-gray-600">Tasks</span>
              {taskCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-[#87CEEB] text-white text-[10px] px-1 py-0 h-4 min-w-[16px]">
                  {taskCount}
                </Badge>
              )}
            </button>

            {/* Clients */}
            <button 
              onClick={() => window.location.href = '/dashboard/clients'}
              className="flex flex-col items-center gap-1 p-2 rounded-lg active:bg-gray-100 transition-colors"
            >
              <Users className="h-5 w-5 text-gray-700" />
              <span className="text-[10px] text-gray-600">Clients</span>
            </button>

            {/* Primary Action - Add Communication */}
            <button
              onClick={onAddCommunication}
              className="relative flex items-center justify-center h-14 w-14 bg-[#87CEEB] rounded-full shadow-lg active:scale-95 transition-transform"
            >
              <MessageCircle className="h-6 w-6 text-[#10292E]" />
              <span className="absolute -bottom-5 text-[10px] text-gray-600 whitespace-nowrap">Log Note</span>
            </button>

            {/* Add Client */}
            <button
              onClick={onAddClient}
              className="flex flex-col items-center gap-1 p-2 rounded-lg active:bg-gray-100 transition-colors"
            >
              <Plus className="h-5 w-5 text-gray-700" />
              <span className="text-[10px] text-gray-600">Add Client</span>
            </button>

            {/* Archive/History */}
            <button 
              onClick={() => window.location.href = '/dashboard/archive'}
              className="flex flex-col items-center gap-1 p-2 rounded-lg active:bg-gray-100 transition-colors"
            >
              <Archive className="h-5 w-5 text-gray-700" />
              <span className="text-[10px] text-gray-600">Archive</span>
            </button>
          </div>
        </div>

        {/* iPhone Safe Area - using padding-bottom for compatibility */}
        <div className="pb-safe bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />
      </div>
    </>
  );
}