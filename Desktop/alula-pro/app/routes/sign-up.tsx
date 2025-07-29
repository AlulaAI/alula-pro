import { SignUp } from "@clerk/react-router";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#F5F5F5]">
      <SignUp 
        afterSignUpUrl="/onboarding"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
            headerTitle: "text-[#10292E]",
            formButtonPrimary: "bg-[#10292E] hover:bg-[#10292E]/90",
          }
        }}
      />
    </div>
  );
}
