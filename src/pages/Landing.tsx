import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Sparkles, Upload, MessageSquare, Zap, CheckCircle2,
  ArrowRight, Globe, FileText, Youtube, Brain, Star, Users, Shield
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Upload Any Source",
    desc: "PDFs, websites, YouTube videos, and text notes — all in one place.",
    color: "text-[hsl(217,91%,60%)]",
    bg: "bg-[hsl(217,91%,60%)]/10",
  },
  {
    icon: Brain,
    title: "Instant AI Insights",
    desc: "Get personalized AI responses grounded in your exact sources.",
    color: "text-[hsl(142,71%,45%)]",
    bg: "bg-[hsl(142,71%,45%)]/10",
  },
  {
    icon: MessageSquare,
    title: "Chat with Your Notes",
    desc: "Ask questions, get summaries, and explore ideas through conversation.",
    color: "text-[hsl(271,81%,56%)]",
    bg: "bg-[hsl(271,81%,56%)]/10",
  },
  {
    icon: Zap,
    title: "Flashcards & Quizzes",
    desc: "Auto-generate study flashcards and practice quizzes from any content.",
    color: "text-[hsl(38,92%,50%)]",
    bg: "bg-[hsl(38,92%,50%)]/10",
  },
];

const sourceTypes = [
  { icon: FileText, label: "PDF Files", color: "text-red-500" },
  { icon: Globe, label: "Websites", color: "text-blue-500" },
  { icon: Youtube, label: "YouTube", color: "text-red-600" },
  { icon: FileText, label: "Text Notes", color: "text-green-600" },
];

const stats = [
  { value: "10M+", label: "Notes analyzed" },
  { value: "500K+", label: "Active students" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9★", label: "User rating" },
];

const testimonials = [
  {
    text: "This completely changed how I study. I can upload my lecture slides and get instant Q&A. My grades went from B to A+.",
    name: "Sarah Chen",
    role: "Medical Student",
    avatar: "SC",
    color: "bg-blue-500",
  },
  {
    text: "I upload research papers and get structured summaries in seconds. It's like having a brilliant study partner available 24/7.",
    name: "Marcus Johnson",
    role: "PhD Researcher",
    avatar: "MJ",
    color: "bg-green-500",
  },
  {
    text: "The flashcard generation saves me hours every week. I can focus on actually learning instead of creating study materials.",
    name: "Aisha Patel",
    role: "Law Student",
    avatar: "AP",
    color: "bg-purple-500",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202124]" style={{ fontFamily: "'Inter', 'Google Sans', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#4285F4] flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-[#202124] tracking-tight">StudyLM</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5F6368]">
            <a href="#features" className="hover:text-[#202124] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#202124] transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-[#202124] transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-sm font-medium text-[#5F6368] hover:text-[#202124] hover:bg-gray-100" onClick={() => navigate("/auth")}>
              Sign in
            </Button>
            <Button className="bg-[#4285F4] hover:bg-[#3367D6] text-white text-sm font-medium rounded-full px-5 shadow-sm" onClick={() => navigate("/auth")}>
              Try Now
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-28 px-6">
        {/* Background gradient blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4285F4]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-[#34A853]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-[#FBBC05]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <Badge className="mb-6 bg-[#E8F0FE] text-[#4285F4] border-[#C5D9FB] hover:bg-[#E8F0FE] text-xs font-medium px-3 py-1 rounded-full">
            <Sparkles className="h-3 w-3 mr-1.5" />
            Powered by Gemini AI
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#202124] leading-[1.1] mb-6">
            Understand{" "}
            <span className="bg-gradient-to-r from-[#4285F4] via-[#34A853] to-[#FBBC05] bg-clip-text text-transparent">
              Anything
            </span>
          </h1>

          <p className="text-xl text-[#5F6368] max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
            Your AI-powered research and study partner. Upload any source — PDFs, videos, websites — and get instant insights, summaries, and answers.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Button
              size="lg"
              className="bg-[#4285F4] hover:bg-[#3367D6] text-white font-medium rounded-full px-8 h-12 text-base shadow-md hover:shadow-lg transition-all"
              onClick={() => navigate("/auth")}
            >
              Try Now — It's Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-200 text-[#5F6368] font-medium rounded-full px-8 h-12 text-base hover:bg-gray-50"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            >
              See how it works
            </Button>
          </div>

          {/* Source type pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {sourceTypes.map((s) => (
              <div key={s.label} className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-4 py-2 shadow-sm text-sm text-[#5F6368] font-medium">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* Hero workspace preview */}
        <div className="max-w-5xl mx-auto mt-16 relative">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Mock browser bar */}
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-400 max-w-xs mx-auto text-center">
                studylm.app/workspace
              </div>
            </div>

            {/* Workspace mock */}
            <div className="flex h-[380px]">
              {/* Sidebar mock */}
              <div className="w-56 border-r border-gray-100 p-4 bg-[#F8F9FA] flex-shrink-0 hidden md:flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Sources</p>
                {["Lecture Notes.pdf", "Chapter 3.pdf", "Research Paper", "Study Guide"].map((item, i) => (
                  <div key={item} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-default transition-colors ${i === 0 ? "bg-[#E8F0FE] text-[#4285F4]" : "text-gray-600 hover:bg-gray-100"}`}>
                    <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
                <div className="mt-auto">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center">
                    <Upload className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">Add source</p>
                  </div>
                </div>
              </div>

              {/* Chat mock */}
              <div className="flex-1 flex flex-col">
                <div className="flex-1 p-4 space-y-3 overflow-hidden">
                  <div className="flex justify-end">
                    <div className="bg-[#E8F0FE] text-[#202124] text-xs rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[75%]">
                      Summarize the key concepts from my lecture notes
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-full bg-[#4285F4] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <div className="bg-white border border-gray-100 text-xs rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[75%] shadow-sm">
                      <p className="font-semibold text-[#202124] mb-1">Key Concepts from Lecture Notes:</p>
                      <ul className="space-y-1 text-[#5F6368]">
                        <li className="flex gap-1.5"><span className="text-[#4285F4] font-bold">•</span> Neural networks and backpropagation</li>
                        <li className="flex gap-1.5"><span className="text-[#34A853] font-bold">•</span> Gradient descent optimization</li>
                        <li className="flex gap-1.5"><span className="text-[#FBBC05] font-bold">•</span> Convolutional architectures</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-gray-100">
                  <div className="bg-[#F8F9FA] rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-gray-400">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Ask a question about your sources...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-gray-100 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-[#202124] mb-1">{s.value}</div>
              <div className="text-sm text-[#5F6368]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#E6F4EA] text-[#34A853] border-[#CEEAD6] text-xs font-medium px-3 py-1 rounded-full">
              Features
            </Badge>
            <h2 className="text-4xl font-bold text-[#202124] mb-4">Your AI-Powered Research Partner</h2>
            <p className="text-lg text-[#5F6368] max-w-2xl mx-auto">Everything you need to study smarter and understand deeper.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
                <div className={`h-11 w-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-[#202124] mb-2 text-base">{f.title}</h3>
                <p className="text-sm text-[#5F6368] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#FEF7E0] text-[#F9AB00] border-[#FEEFC3] text-xs font-medium px-3 py-1 rounded-full">
              How It Works
            </Badge>
            <h2 className="text-4xl font-bold text-[#202124] mb-4">Get started in 3 simple steps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload your sources",
                desc: "Add PDFs, paste YouTube URLs, import websites, or type your notes directly.",
                icon: Upload,
                color: "bg-[#4285F4]",
              },
              {
                step: "02",
                title: "AI analyzes everything",
                desc: "Our AI reads all your sources and builds a deep understanding of your content.",
                icon: Brain,
                color: "bg-[#34A853]",
              },
              {
                step: "03",
                title: "Ask anything",
                desc: "Chat, summarize, create flashcards, and generate quizzes — all cited from your sources.",
                icon: MessageSquare,
                color: "bg-[#FBBC05]",
              },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+48px)] right-0 h-px bg-gradient-to-r from-gray-200 to-transparent" />
                )}
                <div className="text-center">
                  <div className={`h-16 w-16 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-5 shadow-md`}>
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-xs font-bold text-gray-300 mb-2 tracking-widest">{item.step}</div>
                  <h3 className="text-lg font-semibold text-[#202124] mb-3">{item.title}</h3>
                  <p className="text-sm text-[#5F6368] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-[#F8F9FA]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-[#FBBC05] text-[#FBBC05]" />
              ))}
            </div>
            <h2 className="text-4xl font-bold text-[#202124] mb-4">Loved by students everywhere</h2>
            <p className="text-lg text-[#5F6368]">Join hundreds of thousands of students studying smarter.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-[#FBBC05] text-[#FBBC05]" />
                  ))}
                </div>
                <p className="text-sm text-[#5F6368] leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#202124]">{t.name}</p>
                    <p className="text-xs text-[#5F6368]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-[#4285F4]/10 via-[#34A853]/5 to-[#FBBC05]/10 rounded-3xl p-12 border border-gray-100">
            <div className="h-14 w-14 rounded-2xl bg-[#4285F4] flex items-center justify-center mx-auto mb-6 shadow-lg">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-[#202124] mb-4">Start studying smarter today</h2>
            <p className="text-lg text-[#5F6368] mb-8 max-w-xl mx-auto">
              Join 500,000+ students using AI to understand their course material faster and retain it longer.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="bg-[#4285F4] hover:bg-[#3367D6] text-white font-medium rounded-full px-8 h-12 text-base shadow-md hover:shadow-lg transition-all"
                onClick={() => navigate("/auth")}
              >
                Try Now — It's Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-[#5F6368]">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#34A853]" /> No credit card required</div>
              <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-[#4285F4]" /> Your data is private</div>
              <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-[#FBBC05]" /> 500K+ students</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F8F9FA] border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#4285F4] flex items-center justify-center">
              <BookOpen className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#202124]">StudyLM</span>
          </div>
          <p className="text-xs text-[#9AA0A6]">© 2025 StudyLM. Built for curious minds.</p>
          <div className="flex gap-6 text-xs text-[#5F6368]">
            <a href="#" className="hover:text-[#202124] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#202124] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#202124] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
