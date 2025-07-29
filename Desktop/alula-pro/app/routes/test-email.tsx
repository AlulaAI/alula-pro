import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { toast } from "sonner";
import { Loader2, Mail, Send } from "lucide-react";

export default function TestEmail() {
  const [from, setFrom] = useState("Sarah Johnson <jason+1@withalula.com>");
  const [to, setTo] = useState("consultant@alulacare.com");
  const [subject, setSubject] = useState("Need help with my mother's care");
  const [body, setBody] = useState(`Hi,

I found your website and I'm reaching out because I need help with my 82-year-old mother, Margaret. She's been living alone since my father passed last year, but we're noticing she's becoming more forgetful and had a fall last week.

We're not sure what kind of care she needs or how to even start looking for help. She's resistant to the idea of moving but we're worried about her safety.

Can you help us figure out the best options? This is becoming quite urgent as we found out she's been forgetting to take her medications.

Thanks,
Sarah Johnson
(555) 123-4567`);
  
  const [scenario, setScenario] = useState("new_lead");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const processEmail = useAction(api.emailProcessor.processIncomingEmail);
  const testScenario = useAction(api.emailProcessor.testEmailProcessing);

  const scenarios = {
    new_lead: {
      from: "Sarah Johnson <jason+1@withalula.com>",
      subject: "Need help with my mother's care",
      body: `Hi,

I found your website and I'm reaching out because I need help with my 82-year-old mother, Margaret. She's been living alone since my father passed last year, but we're noticing she's becoming more forgetful and had a fall last week.

We're not sure what kind of care she needs or how to even start looking for help. She's resistant to the idea of moving but we're worried about her safety.

Can you help us figure out the best options? This is becoming quite urgent as we found out she's been forgetting to take her medications.

Thanks,
Sarah Johnson
(555) 123-4567`,
    },
    urgent_client: {
      from: "Mike Wilson <mike.wilson@example.com>",
      subject: "URGENT: Dad had another fall - need immediate help",
      body: `This is Mike Wilson (Robert Wilson's son).

Dad had another fall this morning and hit his head. He's at the ER now and they're running tests. The doctor says he can't go back home alone after this.

We need to arrange 24/7 care immediately or find a facility that can take him. Can you help us TODAY? 

Please call me ASAP at (555) 987-6543.

Mike`,
    },
    professional_referral: {
      from: "Jen Kowalski <jen@dowdaseniorconsultants.com>",
      subject: "Referral - Mrs. Thompson needs care coordination",
      body: `Hi Missy,

I have a referral for you. Mrs. Dorothy Thompson (88) lives in your service area and her family reached out to us, but we're at capacity right now.

She's recently widowed and her daughter Linda is overwhelmed trying to manage her care from out of state. Dorothy has mild dementia, diabetes, and mobility issues. She's currently at home with part-time help but needs a comprehensive care assessment and ongoing coordination.

The family has a good budget for private care. Linda's number is (555) 234-5678.

Let me know if you can take this on. Happy to provide a warm handoff.

Best,
Jen Kowalski
Dowda Senior Consultants`,
    },
    target_marketing: {
      from: "Target <deals@e.target.com>",
      subject: "🎯 Don't miss out! 30% off home essentials this weekend",
      body: `Shop these deals before they're gone!

Living Room Furniture - Up to 30% off
Kitchen Appliances - Buy 2 Get 1 Free  
Bedding & Bath - Starting at $9.99

Plus, get free shipping on orders over $35!

[Shop Now] [Unsubscribe]

Target Corporation | Minneapolis, MN 55403`,
    },
    lunch_invitation: {
      from: "Reamey Walsh <reamey@dementiacarespecialists.com>",
      subject: "Lunch this week?",
      body: `Hey Missy!

It's been way too long! I know we're both swamped with clients, but are you free for lunch this week? I'm thinking Thursday or Friday around noon?

There's this new Mediterranean place downtown I've been wanting to try. Plus I'd love to catch up - feels like we haven't talked since the conference in March!

Let me know what works for you.

Reamey`,
    },
    amazon_order: {
      from: "Amazon <shipment-tracking@amazon.com>",
      subject: "Your order has been delivered",
      body: `Your package was delivered.

Order #123-4567890-1234567
Delivered to: Front door

Items:
- Compression Socks (3 pairs)
- Hand Sanitizer (12 oz)

Track your package: [Link]

Thank you for shopping with Amazon!`,
    },
    routine_update: {
      from: "Patricia Chen <pchen@example.com>",
      subject: "Mom's doing better with the new aide",
      body: `Hi,

Just wanted to give you a quick update. Mom (Eleanor Chen) seems to be doing much better with the new aide you recommended. They get along well and Mom is eating better.

We'd like to increase the hours from 4 to 6 per day starting next month if possible.

Thanks for all your help!
Patricia`,
    },
    newsletter_spam: {
      from: "Wellness Weekly <newsletter@wellnessweekly.com>",
      subject: "10 Superfoods That Will Change Your Life! 🥑",
      body: `This Week's Top Stories:

🥑 The Avocado Secret Doctors Don't Want You to Know
🧘 5-Minute Morning Yoga That Burns 500 Calories  
💊 New Vitamin Trend Taking Hollywood by Storm

SPECIAL OFFER: Get 50% off your first month!

Click here to read more...

Copyright 2024 Wellness Weekly | Unsubscribe`,
    },
  };

  const handleScenarioChange = (value: string) => {
    setScenario(value);
    const scenarioData = scenarios[value as keyof typeof scenarios];
    if (scenarioData) {
      setFrom(scenarioData.from);
      setSubject(scenarioData.subject);
      setBody(scenarioData.body);
    }
  };

  const handleProcessEmail = async () => {
    setIsProcessing(true);
    setResult(null);
    
    try {
      const response = await processEmail({
        from,
        to,
        subject,
        body,
        messageId: `test-${Date.now()}`,
      });
      
      setResult(response);
      
      if (response.processed) {
        toast.success(
          response.isNewClient 
            ? "Email processed! New client created." 
            : "Email processed successfully!"
        );
      } else {
        toast.info(`Email not processed: ${response.reason}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process email");
      setResult({ error: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickTest = async () => {
    setIsProcessing(true);
    setResult(null);
    
    try {
      const response = await testScenario({ scenario });
      setResult(response);
      
      if (response.processed) {
        toast.success(
          response.isNewClient 
            ? "Test email processed! New client created." 
            : "Test email processed successfully!"
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to run test");
      setResult({ error: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Email Processing Test Interface</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Test Scenarios</CardTitle>
            <CardDescription>
              Use pre-configured scenarios to test email processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={scenario} onValueChange={handleScenarioChange}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a scenario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_lead">New Lead Inquiry</SelectItem>
                  <SelectItem value="urgent_client">Urgent Client Need</SelectItem>
                  <SelectItem value="professional_referral">Professional Referral</SelectItem>
                  <SelectItem value="routine_update">Routine Update</SelectItem>
                  <SelectItem value="target_marketing">Target Marketing Email</SelectItem>
                  <SelectItem value="lunch_invitation">Lunch Invitation</SelectItem>
                  <SelectItem value="amazon_order">Amazon Order</SelectItem>
                  <SelectItem value="newsletter_spam">Newsletter Spam</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleQuickTest}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Run Test Scenario
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Email Test</CardTitle>
            <CardDescription>
              Configure and send a custom test email through the processing pipeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <Input
                  id="from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="sender@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Email body content..."
                rows={10}
              />
            </div>
            
            <Button 
              onClick={handleProcessEmail}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Email...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Process Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Processing Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}