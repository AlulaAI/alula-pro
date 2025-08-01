import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useAIContext(
  clientId: string | null | undefined, 
  communicationId?: string | null | undefined
) {
  const generateContext = useMutation(api.generateContext.generateForClient);
  
  useEffect(() => {
    if (!clientId) return;
    
    // Trigger context generation in the background
    // This will either return cached context or generate new
    generateContext({ 
      clientId, 
      communicationId: communicationId || undefined 
    }).catch(console.error);
  }, [clientId, communicationId, generateContext]);
}