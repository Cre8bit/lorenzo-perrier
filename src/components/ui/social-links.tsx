import { Github, Linkedin, Mail, X, Sparkles, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface SocialButtonProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  delay?: number;
}

const SocialButton = ({ href, icon, label, delay = 0 }: SocialButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glow effect on hover */}
      <div
        className={`absolute inset-0 rounded-full blur-lg transition-opacity duration-500 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)",
        }}
      />

      {/* Glass button */}
      <div
        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
          isHovered
            ? "bg-primary/20 border-primary/40 scale-110"
            : "bg-glass-bg/30 border-white/5"
        }`}
        style={{
          backdropFilter: "blur(12px)",
          border: "1px solid",
          borderColor: isHovered
            ? "hsl(var(--primary) / 0.4)"
            : "hsl(var(--foreground) / 0.05)",
        }}
      >
        {/* Liquid shine effect */}
        <div
          className={`absolute inset-0 rounded-full overflow-hidden transition-opacity duration-500 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, transparent 40%, hsl(var(--primary) / 0.2) 50%, transparent 60%)",
              transform: isHovered ? "translateX(100%)" : "translateX(-100%)",
              transition: "transform 600ms ease-out",
            }}
          />
        </div>

        <span
          className={`relative z-10 transition-colors duration-300 ${
            isHovered ? "text-primary" : "text-muted-foreground/60"
          }`}
        >
          {icon}
        </span>
      </div>
    </a>
  );
};

export const SocialLinks = ({ hide = false }: { hide?: boolean }) => {
  return (
    <div
      className="fixed top-8 right-8 z-50 flex items-center gap-3 transition-all duration-500 ease-out"
      style={{
        opacity: hide ? 0 : 1,
        pointerEvents: hide ? "none" : "auto",
        transform: hide ? "translateY(-8px)" : "translateY(0)",
      }}
    >
      <SocialButton
        href="https://github.com/cre8bit"
        icon={<Github className="w-4 h-4" strokeWidth={1.5} />}
        label="GitHub"
        delay={0}
      />
      <SocialButton
        href="https://www.linkedin.com/in/lorenzoperrier/"
        icon={<Linkedin className="w-4 h-4" strokeWidth={1.5} />}
        label="LinkedIn"
        delay={100}
      />
    </div>
  );
};

export const ContactLink = ({ hide = false }: { hide?: boolean }) => {
  return (
    <div
      className="fixed top-8 left-8 sm:top-auto sm:bottom-8 z-50 flex items-center gap-3 transition-all duration-500 ease-out"
      style={{
        opacity: hide ? 0 : 1,
        pointerEvents: hide ? "none" : "auto",
        transform: hide ? "translateY(-8px)" : "translateY(0)",
      }}
    >
      <ContactButton />
    </div>
  );
};

const ContactButton = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // Two-step modal
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [hoveredIntent, setHoveredIntent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const FUN_INTENTS = [
    {
      value: "work",
      label: "🚀 Let’s work together",
      blurb: "Something exciting you’re working on.",
    },
    {
      value: "hire",
      label: "💼 I have an opportunity",
      blurb: "A role or mission, tell me more.",
    },
    {
      value: "feedback",
      label: "💬 Feedback on my portfolio",
      blurb: "Happy to hear what you think about it :)",
    },
    {
      value: "bug",
      label: "🐛 I found a bug",
      blurb: "Oh no. Help me squash it.",
    },
    { value: "other", label: "✨ Something else", blurb: "Surprise me." },
  ] as const;

  const openModal = () => {
    setIsModalOpen(true);
    setStep(1);
    setSelectedIntent(null);
    setEmail("");
    setMessage("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setStep(1);
    setSelectedIntent(null);
  };

  const proceedToStep2 = (intent?: string) => {
    if (intent) {
      setSelectedIntent(intent);
      setStep(2);
    } else if (selectedIntent) {
      setStep(2);
    }
  };

  const backToStep1 = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycby7jRqm2FZY6Lfv2hO1k_ILbCAXN1_1cbxMnGHL6AV5eAPsLdsgs72BrIJpT6MOfQT-/exec";

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: formData,
      });

      let payload = null;
      try {
        payload = await res.json();
      } catch {
        // Response is not JSON, ignore
      }

      if (!res.ok || (payload && payload.result !== "success")) {
        throw new Error("Failed to send message");
      }

      // Success
      setEmail("");
      setMessage("");
      setHoneypot("");
      closeModal();
    } catch (err) {
      console.error("Form submission error:", err);
      // TODO: Show error toast/message to user
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        aria-label="Contact Me"
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`absolute inset-0 rounded-full blur-lg transition-opacity duration-500 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)",
          }}
        />

        <div
          className={`relative px-0 sm:px-4 h-10 sm:h-10 w-10 sm:w-auto rounded-full flex items-center justify-center gap-0 sm:gap-2 transition-all duration-500 ${
            isHovered
              ? "bg-primary/20 border-primary/40 scale-105"
              : "bg-glass-bg/30 border-white/5"
          }`}
          style={{
            backdropFilter: "blur(12px)",
            border: "1px solid",
            borderColor: isHovered
              ? "hsl(var(--primary) / 0.4)"
              : "hsl(var(--foreground) / 0.05)",
          }}
        >
          <div
            className={`absolute inset-0 rounded-full overflow-hidden transition-opacity duration-500 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, transparent 40%, hsl(var(--primary) / 0.2) 50%, transparent 60%)",
                transform: isHovered ? "translateX(100%)" : "translateX(-100%)",
                transition: "transform 600ms ease-out",
              }}
            />
          </div>

          <Mail
            className={`w-4 h-4 transition-colors duration-300 ${
              isHovered ? "text-primary" : "text-muted-foreground/60"
            }`}
            strokeWidth={1.5}
          />
          <span
            className={`hidden sm:inline relative z-10 select-none text-sm font-medium transition-colors duration-300 ${
              isHovered ? "text-primary" : "text-muted-foreground/60"
            }`}
          >
            Let's connect
          </span>
        </div>
      </button>

      {/* Unified Two-Step Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 pb-32 sm:pb-32 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label={
            step === 1 ? "What brings you here?" : "Send your message"
          }
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

          {/* Glass card with internal scroll */}
          <div
            className="relative w-full max-w-lg rounded-xl sm:rounded-2xl border transition-all duration-300 my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-8rem)] flex flex-col"
            style={{
              backdropFilter: "blur(16px)",
              background: "hsl(var(--background) / 0.65)",
              borderColor: "hsl(var(--foreground) / 0.08)",
            }}
          >
            <div className="overflow-y-auto p-4 sm:p-6">
              {/* Step 1: Intent Selection */}
              {step === 1 && (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base sm:text-lg font-semibold">
                        What brings you here?
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Send me a message. I read every one.
                      </div>
                    </div>

                    <button
                      onClick={closeModal}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {FUN_INTENTS.map((opt) => {
                      return (
                        <button
                          key={opt.value}
                          onClick={() => proceedToStep2(opt.value)}
                          onMouseEnter={() => setHoveredIntent(opt.value)}
                          onMouseLeave={() => setHoveredIntent(null)}
                          className="w-full text-left rounded-xl border px-4 py-3 transition-all group overflow-hidden relative"
                          style={{
                            backdropFilter: "blur(12px)",
                            background:
                              hoveredIntent === opt.value
                                ? "hsl(var(--primary) / 0.12)"
                                : "hsl(var(--glass-bg, 0 0% 100%) / 0.05)",
                            borderColor:
                              hoveredIntent === opt.value
                                ? "hsl(var(--primary) / 0.35)"
                                : "hsl(var(--foreground) / 0.08)",
                            boxShadow:
                              hoveredIntent === opt.value
                                ? "0 0 20px hsl(var(--primary) / 0.15), inset 0 1px 1px hsl(var(--primary) / 0.1)"
                                : "none",
                          }}
                        >
                          {/* Hover glow effect */}
                          <div
                            className="absolute inset-0 transition-opacity duration-300"
                            style={{
                              background:
                                hoveredIntent === opt.value
                                  ? "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.2), transparent 70%)"
                                  : "transparent",
                            }}
                            aria-hidden="true"
                          />

                          <div className="relative z-10 flex items-center justify-between">
                            <div>
                              <div className="font-medium">{opt.label}</div>
                              <div className="text-sm text-muted-foreground mt-0.5">
                                {opt.blurb}
                              </div>
                            </div>

                            {/* Arrow indicator on hover */}
                            <ArrowRight
                              className={`w-4 h-4 text-primary ml-3 flex-shrink-0 transition-all duration-300 ${
                                hoveredIntent === opt.value
                                  ? "opacity-100 translate-x-0"
                                  : "opacity-0 -translate-x-2"
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex items-center justify-end">
                    <button
                      onClick={closeModal}
                      className="h-9 px-4 rounded-lg text-sm border bg-transparent transition-colors hover:bg-white/5"
                      style={{
                        borderColor: "hsl(var(--foreground) / 0.12)",
                      }}
                    >
                      Not now
                    </button>
                  </div>
                </>
              )}

              {/* Step 2: Message Form */}
              {step === 2 && (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base sm:text-lg font-semibold">
                        Send your message
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {
                          FUN_INTENTS.find((i) => i.value === selectedIntent)
                            ?.label
                        }
                      </div>
                    </div>

                    <button
                      onClick={closeModal}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {/* Honeypot (hidden anti-spam field) */}
                    <input
                      type="text"
                      name="company"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      className="hidden"
                      aria-hidden="true"
                    />

                    {/* Hidden fields */}
                    <input
                      type="hidden"
                      name="formGoogleSheetName"
                      value="responses"
                    />
                    <input
                      type="hidden"
                      name="intent"
                      value={
                        FUN_INTENTS.find((i) => i.value === selectedIntent)
                          ?.label ?? ""
                      }
                    />

                    {/* Email Input */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-2"
                      >
                        Your email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-2.5 rounded-lg border bg-glass-bg/20 text-sm transition-all focus:outline-none focus:border-primary/40 focus:bg-primary/5"
                        style={{
                          backdropFilter: "blur(12px)",
                          borderColor: "hsl(var(--foreground) / 0.12)",
                        }}
                      />
                    </div>

                    {/* Message Input */}
                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium mb-2"
                      >
                        Your message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell me more..."
                        rows={5}
                        className="w-full px-4 py-2.5 rounded-lg border bg-glass-bg/20 text-sm transition-all focus:outline-none focus:border-primary/40 focus:bg-primary/5 resize-none"
                        style={{
                          backdropFilter: "blur(12px)",
                          borderColor: "hsl(var(--foreground) / 0.12)",
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={backToStep1}
                        disabled={isLoading}
                        className="h-9 px-4 rounded-lg text-sm border bg-transparent transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          borderColor: "hsl(var(--foreground) / 0.12)",
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="h-9 px-4 rounded-lg text-sm border transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{
                          borderColor: "hsl(var(--primary) / 0.35)",
                          background: "hsl(var(--primary) / 0.12)",
                        }}
                      >
                        <Sparkles
                          className={`w-4 h-4 text-primary transition-transform ${
                            isLoading ? "animate-spin" : ""
                          }`}
                        />
                        {isLoading ? "Sending..." : "Send message"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
