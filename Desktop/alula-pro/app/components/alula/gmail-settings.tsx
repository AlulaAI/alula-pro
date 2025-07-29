"use client";
import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Mail, Check, X, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/react-router";

export function GmailSettings() {
  const { user } = useUser();
  const integration = useQuery(api.gmail.getIntegration);
  const connectGmail = useMutation(api.gmail.connectGmail);
  const disconnectGmail = useMutation(api.gmail.disconnectGmail);
  const fetchEmails = useAction(api.gmailActions.fetchEmails);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Check if client ID is available
      if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        toast.error("Google Client ID not configured. Please check your .env.local file.");
        console.error("Missing VITE_GOOGLE_CLIENT_ID in environment variables");
        setIsConnecting(false);
        return;
      }
      
      console.log("Using Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
      console.log("Redirect URI:", import.meta.env.VITE_APP_URL ? 
        `${import.meta.env.VITE_APP_URL}/auth/google/callback` : 
        'http://localhost:5173/auth/google/callback');
      
      // Generate a random state for CSRF protection
      const state = Math.random().toString(36).substring(7);
      
      // Store state in session storage for verification
      sessionStorage.setItem('gmail_oauth_state', state);
      
      // Import the OAuth URL generator
      const { getGoogleOAuthURL } = await import('~/lib/google-oauth');
      
      // Get OAuth URL
      const authUrl = getGoogleOAuthURL(state);
      
      console.log("Redirecting to Google OAuth:", authUrl);
      
      // Add a 2 second delay so you can see the console
      toast.info("Redirecting to Google in 2 seconds...");
      setTimeout(() => {
        window.location.href = authUrl;
      }, 2000);
      
    } catch (error) {
      toast.error("Failed to initiate Gmail connection");
      console.error("Gmail connection error:", error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGmail();
      toast.success("Gmail disconnected");
    } catch (error) {
      toast.error("Failed to disconnect Gmail");
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const result = await fetchEmails({ maxResults: 10 });
      toast.info(result.message);
    } catch (error) {
      toast.error("Failed to sync emails");
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[#10292E]">Gmail Integration</h3>
              <p className="text-sm text-[#737373] mt-1">
                Automatically import and classify emails from your Gmail inbox
              </p>
            </div>
          </div>
          
          <Switch
            checked={integration?.isActive || false}
            onCheckedChange={(checked) => {
              console.log("Toggle clicked, new state:", checked);
              if (checked) {
                handleConnect();
              } else {
                handleDisconnect();
              }
            }}
            disabled={isConnecting}
          />
        </div>

        {integration?.isActive && (
          <>
            <div className="border-t border-[#E5E5E5] pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-[#737373]">
                      Connected to: <span className="font-medium text-[#10292E]">{integration.email}</span>
                    </span>
                  </div>
                  
                  {integration.lastSync && (
                    <p className="text-xs text-[#737373] mt-2">
                      Last synced: {new Date(integration.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>
            </div>

            <div className="bg-[#F5F5F5] rounded-lg p-4">
              <h4 className="font-medium text-sm text-[#10292E] mb-2">How it works:</h4>
              <ul className="space-y-1 text-xs text-[#737373]">
                <li>• Emails are automatically imported every 5 minutes</li>
                <li>• AI classifies business-related emails</li>
                <li>• Urgent emails create action items on your dashboard</li>
                <li>• Emails are matched to existing clients when possible</li>
              </ul>
            </div>

            {integration.accessToken ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-800">
                  Gmail is fully connected and ready to sync emails.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  Connection incomplete. Please reconnect to grant Gmail permissions.
                  <button 
                    className="ml-1 text-amber-600 hover:text-amber-700 font-medium inline-flex items-center gap-1"
                    onClick={handleConnect}
                  >
                    Reconnect
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </p>
              </div>
            )}
          </>
        )}

        {!integration?.isActive && !isConnecting && (
          <div className="bg-[#F5F5F5] rounded-lg p-4">
            <h4 className="font-medium text-sm text-[#10292E] mb-2">Benefits:</h4>
            <ul className="space-y-1 text-xs text-[#737373]">
              <li>• Never miss urgent client emails</li>
              <li>• Automatic email classification</li>
              <li>• Seamless integration with your dashboard</li>
              <li>• Save time on email management</li>
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}