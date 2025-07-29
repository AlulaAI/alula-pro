"use client";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { CommunicationModal } from "~/components/alula/communication-modal";
import { 
  ArrowLeft,
  Mail, 
  Phone, 
  MapPin,
  MessageCircle,
  Clock,
  FileText,
  Plus
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { EmptyState } from "~/components/alula/empty-state";

export default function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);

  const client = useQuery(api.clients.get, { 
    clientId: clientId as any 
  });
  
  const communications = useQuery(api.communications.listByClient, { 
    clientId: clientId as any 
  }) || [];

  const archiveCommunication = useMutation(api.communications.archive);

  if (!client) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[#737373]">Loading client details...</p>
      </div>
    );
  }

  const handleArchive = async (communicationId: string) => {
    await archiveCommunication({ communicationId });
  };

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4" />;
      case "phone": return <Phone className="h-4 w-4" />;
      case "sms": return <MessageCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCommunicationColor = (urgencyScore?: number) => {
    if (!urgencyScore) return "bg-gray-100";
    if (urgencyScore >= 80) return "bg-red-100";
    if (urgencyScore >= 60) return "bg-orange-100";
    if (urgencyScore >= 40) return "bg-yellow-100";
    return "bg-gray-100";
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/clients")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[#10292E]">{client.name}</h1>
            <p className="text-[#737373]">
              Client since {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
            </p>
          </div>
          <Button
            onClick={() => setShowCommunicationModal(true)}
            className="bg-[#10292E] hover:bg-[#10292E]/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Log Communication
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Client Info Card */}
          <Card className="p-6">
            <h3 className="font-semibold text-[#10292E] mb-4">Contact Information</h3>
            <div className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-[#737373]" />
                  <span className="text-[#737373]">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-[#737373]" />
                  <span className="text-[#737373]">{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-[#737373]" />
                  <span className="text-[#737373]">{client.address}</span>
                </div>
              )}
              {client.lastContactedAt && (
                <div className="pt-3 border-t border-[#E5E5E5] mt-3">
                  <p className="text-xs text-[#737373]">
                    Last contact: {formatDistanceToNow(new Date(client.lastContactedAt), { addSuffix: true })}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Communications Timeline */}
          <div className="md:col-span-2">
            <Card className="p-6">
              <Tabs defaultValue="timeline" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="space-y-4">
                  <h3 className="font-semibold text-[#10292E]">Communication History</h3>
                  
                  {communications.length === 0 ? (
                    <EmptyState
                      icon={MessageCircle}
                      title="No communications yet"
                      description="Start logging communications to build a care history."
                      action={
                        <Button
                          onClick={() => setShowCommunicationModal(true)}
                          className="bg-[#10292E] hover:bg-[#10292E]/90"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Log First Communication
                        </Button>
                      }
                    />
                  ) : (
                    <div className="space-y-3">
                      {communications.map((comm) => (
                        <div
                          key={comm._id}
                          className={`p-4 rounded-lg border border-[#E5E5E5] ${getCommunicationColor(comm.urgencyScore)}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getCommunicationIcon(comm.type)}
                                <span className="font-medium text-sm text-[#10292E] capitalize">
                                  {comm.type === "in_person" ? "In Person" : comm.type}
                                </span>
                                <span className="text-xs text-[#737373]">
                                  • {comm.direction} • {formatDistanceToNow(new Date(comm.createdAt), { addSuffix: true })}
                                </span>
                                {comm.urgencyScore && comm.urgencyScore >= 70 && (
                                  <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">
                                    Urgent
                                  </span>
                                )}
                              </div>
                              {comm.subject && (
                                <p className="font-medium text-[#10292E] mb-1">{comm.subject}</p>
                              )}
                              <p className="text-sm text-[#737373]">
                                {comm.aiSummary || comm.content}
                              </p>
                            </div>
                            {comm.status === "active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArchive(comm._id)}
                              >
                                Archive
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <h3 className="font-semibold text-[#10292E]">Care Notes</h3>
                  <EmptyState
                    icon={FileText}
                    title="Notes feature coming soon"
                    description="You'll be able to add internal and client-facing notes here."
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

      <CommunicationModal
        isOpen={showCommunicationModal}
        onClose={() => setShowCommunicationModal(false)}
        clients={[client]}
        defaultClientId={client._id}
      />
    </div>
  );
}