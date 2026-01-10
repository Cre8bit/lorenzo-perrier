import { Github, Linkedin, Mail } from "lucide-react";
import { useState } from "react";

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

export const SocialLinks = () => {
  return (
    <div className="fixed top-8 right-8 z-50 flex items-center gap-3">
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

export const ContactLink = () => {
  return (
    <div className="fixed bottom-8 left-8 z-50 flex items-center gap-3">
      <ContactButton />
    </div>
  );
};

const ContactButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href="#"
      aria-label="Contact Me"
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `0ms` }}
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
        className={`relative px-4 h-10 rounded-full flex items-center justify-center gap-2 transition-all duration-500 ${
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
          minWidth: "fit-content",
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
          className={`relative z-10 select-none text-sm font-medium transition-colors duration-300 ${
            isHovered ? "text-primary" : "text-muted-foreground/60"
          }`}
        >
          Let's connect
        </span>
      </div>
    </a>
  );
};
