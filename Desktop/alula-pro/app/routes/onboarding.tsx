"use client";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { 
  Users, 
  MessageCircle, 
  Brain, 
  ArrowRight,
  Database,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const seedData = useMutation(api.seedData.seedTestData);

  const steps = [
    {
      icon: Brain,
      title: "Welcome to Your Command Center",
      description: "Alula Pro uses AI to automatically prioritize urgent client needs, so you never miss what matters most.",
      demo: (
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] p-4">
          <div className="border-l-4 border-l-red-500 bg-red-50 p-3 rounded">
            <h4 className="font-semibold text-red-800 text-sm">🚨 Urgent: Margaret Johnson</h4>
            <p className="text-xs text-red-700 mt-1">
              Family reports confusion after new medication - needs immediate attention
            </p>
          </div>
        </div>
      )
    },
    {
      icon: MessageCircle,
      title: "All Communications in One Place",
      description: "Log emails, phone calls, texts, and in-person visits. Everything is organized by client with a complete timeline.",
      demo: (
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">Phone Call</span>
            <span className="text-[#737373]">• 2 hours ago</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium">Email</span>
            <span className="text-[#737373]">• Yesterday</span>
          </div>
        </div>
      )
    },
    {
      icon: Users,
      title: "Manage Your Clients with Care",
      description: "Keep detailed profiles, track family contacts, and maintain a complete care history for each client.",
      demo: (
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#E0F2B2]/30 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-[#10292E]" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Margaret Johnson</h4>
              <p className="text-xs text-[#737373]">Last contact: 2 hours ago</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/dashboard");
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  const handleLoadSampleData = async () => {
    try {
      await seedData();
      toast.success("Sample data loaded! Check your dashboard.");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to load sample data");
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-16 rounded-full transition-colors ${
                index <= currentStep ? "bg-[#10292E]" : "bg-[#E5E5E5]"
              }`}
            />
          ))}
        </div>

        <Card className="p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="bg-[#E0F2B2]/30 rounded-full p-4 inline-flex mb-4">
              <Icon className="h-12 w-12 text-[#10292E]" />
            </div>
            <h2 className="text-2xl font-semibold text-[#10292E] mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-[#737373] max-w-md mx-auto">
              {currentStepData.description}
            </p>
          </div>

          {/* Demo */}
          <div className="mb-8 flex justify-center">
            <div className="max-w-sm w-full">
              {currentStepData.demo}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-[#737373]"
            >
              Skip Tour
            </Button>

            {currentStep === steps.length - 1 ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleLoadSampleData}
                  className="border-[#10292E] text-[#10292E]"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Load Sample Data
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-[#10292E] hover:bg-[#10292E]/90"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-[#10292E] hover:bg-[#10292E]/90"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>

        {/* Features reminder */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#737373] mb-4">Key features you'll love:</p>
          <div className="flex justify-center gap-6 text-xs text-[#737373]">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Zero-search dashboard</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>AI urgency detection</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Mobile friendly</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}