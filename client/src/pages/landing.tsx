import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, FileText, MessageSquare, CreditCard, Star, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="portal-gradient text-white">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">
              Professional Client Portal
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Share deliverables, track invoices, and communicate with clients through 
              branded, professional dashboards that build trust and streamline your workflow.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => window.location.href = "/api/login"}
              className="text-lg px-8 py-3"
            >
              <Briefcase className="mr-2 h-5 w-5" />
              Start Your Free Portal
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Everything You Need for Client Success
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Replace long email chains and scattered files with a professional portal 
            that keeps everything organized and accessible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Branded Dashboard</CardTitle>
              <CardDescription>
                Logo + name + welcome note for a personal feel and lightweight professionalism
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Deliverables View</CardTitle>
              <CardDescription>
                Timeline of current/past work (milestones or updates) showing progress without long email chains
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>File Sharing</CardTitle>
              <CardDescription>
                Drag/drop or link uploads from you (e.g. designs, reports) keeping it central and tidy
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle>Chat or Notes Thread</CardTitle>
              <CardDescription>
                Simple messaging or comments for feedback/questions replacing long email threads
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Invoice & Payment Tracker</CardTitle>
              <CardDescription>
                Upload or sync invoices (Stripe, PDF, etc.) encouraging timely payments and improving trust
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-pink-600" />
              </div>
              <CardTitle>Feedback Request Form</CardTitle>
              <CardDescription>
                Quick form to collect testimonials or feedback helping with growth & referrals
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* MVP Flow Section */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Simple 4-Step Process
            </h2>
            <p className="text-lg text-slate-600">
              Get your professional client portal up and running in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Sign Up</h3>
              <p className="text-slate-600">Create your freelancer account</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Client Room</h3>
              <p className="text-slate-600">Set up a branded project space</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Content</h3>
              <p className="text-slate-600">Add your first deliverable or notes</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-lg font-semibold mb-2">Share Link</h3>
              <p className="text-slate-600">Send client the secure portal link</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="portal-gradient text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Impress Your Clients?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of freelancers who've elevated their client experience
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => window.location.href = "/api/login"}
            className="text-lg px-8 py-3"
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
}
