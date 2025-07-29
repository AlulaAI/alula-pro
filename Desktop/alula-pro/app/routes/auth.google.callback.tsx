import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getGoogleUserInfo } from "~/lib/google-oauth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Add meta for React Router v7
export function meta() {
  return [
    { title: "Connecting Gmail - Alula Pro" },
    { name: "description", content: "Connecting your Gmail account to Alula Pro" },
  ];
}

// Add a loader to make React Router v7 recognize this route
export async function loader() {
  return null;
}

export default function GoogleOAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const saveGmailTokens = useMutation(api.gmail.saveOAuthTokens);

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setError(`OAuth error: ${error}`);
        setIsProcessing(false);
        return;
      }

      if (!code) {
        setError("No authorization code received");
        setIsProcessing(false);
        return;
      }

      try {
        // Exchange code for tokens using server-side function
        const response = await fetch('/api/google-oauth-exchange', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange code for tokens');
        }

        const { tokens, userInfo } = await response.json();
        
        // Save tokens to Convex
        await saveGmailTokens({
          email: userInfo.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in,
        });

        toast.success("Gmail connected successfully!");
        navigate("/dashboard/settings");
      } catch (error) {
        console.error("OAuth callback error:", error);
        setError(error instanceof Error ? error.message : "Failed to connect Gmail");
        setIsProcessing(false);
      }
    }

    handleCallback();
  }, [searchParams, navigate, saveGmailTokens]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">
            Connection Failed
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/dashboard/settings")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Connecting your Gmail account...</p>
      </div>
    </div>
  );
}