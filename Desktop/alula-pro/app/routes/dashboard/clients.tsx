"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ClientModal } from "~/components/alula/client-modal";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Plus, Mail, Phone, MapPin, Trash2, MoreVertical } from "lucide-react";
import { EmptyState } from "~/components/alula/empty-state";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { toast } from "sonner";

export default function ClientsPage() {
  const [showClientModal, setShowClientModal] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const clients = useQuery(api.clients.list) || [];
  const deleteClient = useMutation(api.clients.deleteClient);

  const handleDeleteClient = async () => {
    if (!deleteClientId) return;

    try {
      await deleteClient({ clientId: deleteClientId as any });
      toast.success("Client deleted successfully");
      setDeleteClientId(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete client");
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#10292E]">Your Clients</h1>
            <p className="text-[#737373] mt-1">
              Manage and support the people in your care circle.
            </p>
          </div>
          <Button
            onClick={() => setShowClientModal(true)}
            className="bg-[#10292E] hover:bg-[#10292E]/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>

        {/* Clients Grid */}
        {clients.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No clients yet"
            description="Add your first client to start providing personalized eldercare support."
            action={
              <Button
                onClick={() => setShowClientModal(true)}
                className="bg-[#10292E] hover:bg-[#10292E]/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Client
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Card key={client._id} className="p-6 hover:shadow-md transition-shadow h-full relative group">
                <Link to={`/dashboard/clients/${client._id}`} className="block">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg text-[#10292E]">{client.name}</h3>
                      <p className="text-sm text-[#737373]">
                        Added {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  
                  <div className="space-y-2">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-[#737373]">
                        <Mail className="h-4 w-4" />
                        <span>{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-[#737373]">
                        <Phone className="h-4 w-4" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-2 text-sm text-[#737373]">
                        <MapPin className="h-4 w-4" />
                        <span>{client.address}</span>
                      </div>
                    )}
                  </div>

                  {client.lastContactedAt && (
                    <p className="text-xs text-[#737373]">
                      Last contact: {formatDistanceToNow(new Date(client.lastContactedAt), { addSuffix: true })}
                    </p>
                  )}
                  </div>
                </Link>
                
                {/* Actions Menu */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          console.log("Setting delete client ID:", client._id);
                          setDeleteClientId(client._id);
                        }}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Client
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteClientId} onOpenChange={(open) => !open && setDeleteClientId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription className="space-y-3">
              <span>This will permanently delete this client and all associated data including:</span>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All communications and emails</li>
                <li>All tasks and actions</li>
                <li>All time entries and billing records</li>
              </ul>
              <span className="font-semibold text-red-600 block">
                This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteClientId(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteClient}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}