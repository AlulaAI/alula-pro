import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TaskMiniCardProps {
  action: {
    _id: string;
    title: string;
    urgencyLevel: "critical" | "high" | "medium" | "low";
    createdAt: number;
    dueDate?: number;
    client?: {
      name: string;
    } | null;
  };
  onClick: () => void;
}

const urgencyColors = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-gray-100 text-gray-800 border-gray-200",
};

const urgencyBorderColors = {
  critical: "border-l-2 border-l-red-500",
  high: "border-l-2 border-l-orange-500",
  medium: "border-l-2 border-l-yellow-500",
  low: "border-l-2 border-l-gray-400",
};

export function TaskMiniCard({ action, onClick }: TaskMiniCardProps) {
  return (
    <Card
      className={`p-2 hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] ${
        urgencyBorderColors[action.urgencyLevel]
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-xs text-[#10292E] truncate">
            {action.title}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            {action.client && (
              <span className="text-[10px] text-[#737373] flex items-center gap-0.5">
                <User className="h-2.5 w-2.5" />
                {action.client.name}
              </span>
            )}
            {action.dueDate && (
              <span className="text-[10px] text-[#737373] flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                Due {formatDistanceToNow(new Date(action.dueDate), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
        <Badge className={`${urgencyColors[action.urgencyLevel]} text-[10px] px-1.5 py-0`}>
          {action.urgencyLevel}
        </Badge>
      </div>
    </Card>
  );
}