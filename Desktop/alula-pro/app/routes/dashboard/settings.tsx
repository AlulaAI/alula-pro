"use client";
import SubscriptionStatus from "~/components/subscription-status";
import { GmailSettings } from "~/components/alula/gmail-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#10292E]">Settings</h1>
          <p className="text-[#737373] mt-1">
            Manage your account, integrations, and preferences
          </p>
        </div>

        <Tabs defaultValue="integrations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-4">
            <GmailSettings />
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <SubscriptionStatus />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
