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
      <div className="h-16" />
      
      {/* Simple Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        {/* Toolbar Content */}
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={onAddClient}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Add client
              </button>
              <button
                onClick={onAddCommunication}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Log note
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/dashboard/clients'}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Clients
              </button>
              <button
                onClick={() => window.location.href = '/dashboard/archive'}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Archive
              </button>
            </div>
          </div>
        </div>

        {/* iPhone Safe Area */}
        <div className="bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />
      </div>
    </>
  );
}