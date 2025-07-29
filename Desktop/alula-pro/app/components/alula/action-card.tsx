import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Clock,
  Archive,
  MessageSquare,
  MoreVertical,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActionCardProps {
  action: {
    _id: string;
    type: "client" | "business" | "lead" | "partner";
    title: string;
    summary: string;
    urgencyLevel: "critical" | "high" | "medium" | "low";
    createdAt: number;
    dueDate?: number;
    client?: {
      name: string;
    } | null;
  };
  onArchive: () => void;
  onSnooze: (hours: number) => void;
  onReply: () => void;
}

const urgencyColors = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-gray-100 text-gray-800 border-gray-200",
};

const urgencyBorderColors = {
  critical: "border-l-4 border-l-red-500",
  high: "border-l-4 border-l-orange-500",
  medium: "border-l-4 border-l-yellow-500",
  low: "border-l-4 border-l-gray-400",
};

export function ActionCard({ action, onArchive, onSnooze, onReply }: ActionCardProps) {
  return (
    <Card
      className={`p-4 hover:shadow-md transition-shadow ${
        urgencyBorderColors[action.urgencyLevel]
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            {action.urgencyLevel === "critical" && (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <h3 className="font-semibold text-[#10292E]">{action.title}</h3>
            <Badge className={urgencyColors[action.urgencyLevel]}>
              {action.urgencyLevel}
            </Badge>
            {action.client && (
              <span className="text-sm text-[#737373]">• {action.client.name}</span>
            )}
          </div>
          <p className="text-sm text-[#737373]">{action.summary}</p>
          <div className="flex items-center gap-4 text-xs text-[#737373]">
            <span>
              {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
            </span>
            {action.dueDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Due {formatDistanceToNow(new Date(action.dueDate), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onReply}
            className="bg-[#87CEEB] text-[#10292E] hover:bg-[#87CEEB]/90"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Reply
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSnooze(1)}>
                <Clock className="h-4 w-4 mr-2" />
                Snooze for 1 hour
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSnooze(4)}>
                <Clock className="h-4 w-4 mr-2" />
                Snooze for 4 hours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSnooze(24)}>
                <Clock className="h-4 w-4 mr-2" />
                Snooze until tomorrow
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}