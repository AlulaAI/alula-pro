import { getAuth } from "@clerk/react-router/ssr.server";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { 
  Users, 
  MessageCircle, 
  Brain, 
  Shield, 
  Clock, 
  Heart,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  const title = "Alula Pro - Empowering Elder Care Consultants";
  const description =
    "Transform fragmented eldercare communication into organized, actionable insights. Zero-search dashboard with AI-powered urgency detection.";
  const keywords = "elder care, care management, senior care, care coordination, family communication";
  const siteUrl = "https://www.alula.pro/";

  return [
    { title },
    { name: "description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: siteUrl },
    { property: "og:site_name", content: "Alula Pro" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "keywords", content: keywords },
    { name: "author", content: "Alula Pro" },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  return { isSignedIn: !!userId };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { isSignedIn } = loaderData;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-[#E5E5E5] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-[#10292E]">Alula Pro</h1>
            </div>
            <div className="flex items-center gap-4">
              {isSignedIn ? (
                <Link to="/dashboard">
                  <Button className="bg-[#10292E] hover:bg-[#10292E]/90">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/sign-in">
                    <Button variant="ghost" className="text-[#10292E]">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/sign-up">
                    <Button className="bg-[#10292E] hover:bg-[#10292E]/90">
                      Start Free Trial
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-[#10292E] mb-6">
            Empowering Elder Care Consultants<br />
            to Provide Better Care
          </h2>
          <p className="text-xl text-[#737373] mb-8 max-w-3xl mx-auto">
            Transform fragmented family communications into organized, actionable insights. 
            Never miss an urgent need with our AI-powered priority dashboard.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/sign-up">
              <Button size="lg" className="bg-[#10292E] hover:bg-[#10292E]/90">
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-[#10292E] text-[#10292E]">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-semibold text-[#10292E] mb-4">
              The Challenge You Face Every Day
            </h3>
            <p className="text-lg text-[#737373]">
              Multiple family members. Endless emails. Scattered phone calls. Critical information lost in the chaos.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 border-[#E5E5E5]">
              <div className="text-red-600 mb-4">
                <MessageCircle className="h-10 w-10" />
              </div>
              <h4 className="font-semibold text-[#10292E] mb-2">Fragmented Communication</h4>
              <p className="text-[#737373]">
                Important updates scattered across emails, texts, and voicemails from multiple family members.
              </p>
            </Card>
            <Card className="p-6 border-[#E5E5E5]">
              <div className="text-orange-600 mb-4">
                <Clock className="h-10 w-10" />
              </div>
              <h4 className="font-semibold text-[#10292E] mb-2">Missed Urgent Needs</h4>
              <p className="text-[#737373]">
                Critical issues buried in routine messages, leading to delayed responses and family stress.
              </p>
            </Card>
            <Card className="p-6 border-[#E5E5E5]">
              <div className="text-yellow-600 mb-4">
                <Users className="h-10 w-10" />
              </div>
              <h4 className="font-semibold text-[#10292E] mb-2">Coordination Complexity</h4>
              <p className="text-[#737373]">
                Managing multiple clients with diverse needs while keeping all family members informed.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-semibold text-[#10292E] mb-4">
              Your Command Center for Compassionate Care
            </h3>
            <p className="text-lg text-[#737373]">
              Alula Pro brings order to the chaos, ensuring you never miss what matters most.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-[#E0F2B2]/30 rounded-full p-4 inline-flex mb-4">
                <Brain className="h-8 w-8 text-[#10292E]" />
              </div>
              <h4 className="font-semibold text-[#10292E] mb-2">AI-Powered Triage</h4>
              <p className="text-sm text-[#737373]">
                Automatically identifies urgent situations that need immediate attention.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-[#E0F2B2]/30 rounded-full p-4 inline-flex mb-4">
                <MessageCircle className="h-8 w-8 text-[#10292E]" />
              </div>
              <h4 className="font-semibold text-[#10292E] mb-2">Unified Communications</h4>
              <p className="text-sm text-[#737373]">
                All emails, calls, and messages in one organized timeline.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-[#E0F2B2]/30 rounded-full p-4 inline-flex mb-4">
                <Users className="h-8 w-8 text-[#10292E]" />
              </div>
              <h4 className="font-semibold text-[#10292E] mb-2">Client Management</h4>
              <p className="text-sm text-[#737373]">
                Complete profiles with family contacts and care history.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-[#E0F2B2]/30 rounded-full p-4 inline-flex mb-4">
                <Shield className="h-8 w-8 text-[#10292E]" />
              </div>
              <h4 className="font-semibold text-[#10292E] mb-2">Secure & Private</h4>
              <p className="text-sm text-[#737373]">
                Bank-level security with family-controlled data access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-semibold text-[#10292E] mb-6">
                Zero-Search Dashboard
              </h3>
              <p className="text-lg text-[#737373] mb-6">
                Log in and immediately see what needs your attention. No searching, no scrolling, 
                no wondering what you might have missed.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <span className="text-[#737373]">Urgent items automatically rise to the top</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <span className="text-[#737373]">AI-generated summaries for quick context</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <span className="text-[#737373]">One-click actions for common responses</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border border-[#E5E5E5]">
              <div className="space-y-4">
                <div className="border-l-4 border-l-red-500 bg-red-50 p-4 rounded">
                  <h4 className="font-semibold text-red-800">Urgent: Margaret Johnson</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Family reports increased confusion and dizziness after new medication
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="bg-[#87CEEB] text-[#10292E] hover:bg-[#87CEEB]/90">
                      Reply
                    </Button>
                    <Button size="sm" variant="outline">Archive</Button>
                  </div>
                </div>
                <div className="border-l-4 border-l-yellow-500 bg-yellow-50 p-4 rounded">
                  <h4 className="font-semibold text-yellow-800">Follow-up: Robert Smith</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Interested in meal prep services - send recommendations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Heart className="h-12 w-12 text-[#E0F2B2] mx-auto mb-6" />
          <blockquote className="text-2xl text-[#10292E] font-light italic mb-6">
            "Alula Pro transformed how I manage my practice. I used to spend hours sorting through emails. 
            Now I know exactly what needs my attention the moment I log in."
          </blockquote>
          <p className="text-[#737373]">
            — Sarah Mitchell, Certified Elder Care Consultant
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#10292E]">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Practice?
          </h3>
          <p className="text-xl text-white/80 mb-8">
            Join elder care consultants who are providing better care with less stress.
          </p>
          <Link to="/sign-up">
            <Button size="lg" className="bg-[#87CEEB] text-[#10292E] hover:bg-[#87CEEB]/90">
              Start Your 14-Day Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-white/60 mt-4 text-sm">
            No credit card required • Full access to all features
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-[#10292E]">Alula Pro</span>
              <span className="text-[#737373]">© 2024 All rights reserved.</span>
            </div>
            <div className="flex gap-6 text-sm text-[#737373]">
              <a href="#" className="hover:text-[#10292E]">Privacy Policy</a>
              <a href="#" className="hover:text-[#10292E]">Terms of Service</a>
              <a href="#" className="hover:text-[#10292E]">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}