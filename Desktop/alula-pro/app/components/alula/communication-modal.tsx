import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { toast } from "sonner";

interface CommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Array<{
    _id: string;
    name: string;
  }>;
  defaultClientId?: string | null;
}

export function CommunicationModal({
  isOpen,
  onClose,
  clients,
  defaultClientId,
}: CommunicationModalProps) {
  const [formData, setFormData] = useState({
    clientId: defaultClientId || "",
    type: "phone" as "email" | "phone" | "sms" | "in_person",
    direction: "inbound" as "inbound" | "outbound",
    subject: "",
    content: "",
  });

  const createCommunication = useMutation(api.communications.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.content) {
      toast.error("Please select a client and enter communication details");
      return;
    }

    try {
      await createCommunication({
        clientId: formData.clientId as any,
        type: formData.type,
        direction: formData.direction,
        subject: formData.subject || undefined,
        content: formData.content,
      });
      
      toast.success("Communication logged successfully!");
      setFormData({
        clientId: "",
        type: "phone",
        direction: "inbound",
        subject: "",
        content: "",
      });
      onClose();
    } catch (error) {
      toast.error("Failed to log communication");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[#10292E]">Log a new communication</DialogTitle>
          <DialogDescription className="text-[#737373]">
            Record important conversations and updates to keep everyone informed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => setFormData({ ...formData, clientId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client._id} value={client._id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="sms">Text Message</SelectItem>
                  <SelectItem value="in_person">In Person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <Select
                value={formData.direction}
                onValueChange={(value: any) => setFormData({ ...formData, direction: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound">Inbound (from them)</SelectItem>
                  <SelectItem value="outbound">Outbound (to them)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject (optional)</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Quick update about Mom"
              className="focus:ring-[#87CEEB]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Family is concerned about Mom's recent confusion. She's been forgetting appointments and seems more tired than usual..."
              className="focus:ring-[#87CEEB] min-h-[120px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#10292E] hover:bg-[#10292E]/90">
              Log Communication
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}