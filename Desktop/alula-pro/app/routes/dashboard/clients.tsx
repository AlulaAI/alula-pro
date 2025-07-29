"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ClientModal } from "~/components/alula/client-modal";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Plus, Mail, Phone, MapPin } from "lucide-react";
import { EmptyState } from "~/components/alula/empty-state";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router";

export default function ClientsPage() {
  const [showClientModal, setShowClientModal] = useState(false);
  const clients = useQuery(api.clients.list) || [];

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
              <Link key={client._id} to={`/dashboard/clients/${client._id}`}>
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer h-full">
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
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <ClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
      />
    </div>
  );
}