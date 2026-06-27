import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Download,
  Linkedin,
  MapPin,
} from "lucide-react";
import { profile } from "@/data/profile";

const LOOKING_THING = [
  "ML systems",
  "real products",
  "AI agents",
  "tools that ship",
  "ambitious problems",
];
const LOOKING_WITH = [
  "ambitious teams",
  "curious builders",
  "great engineers",
  "people who care",
  "thoughtful makers",
];

export const HeroSectionMobile = () => {
  const [thingIdx, setThingIdx] = useState(0);
  const [withIdx, setWithIdx] = useState(0);

  useEffect(() => {
    let toggle = 0;
    const id = window.setInterval(() => {
      if (toggle === 0) {
        setThingIdx((s) => (s + 1) % LOOKING_THING.length);
      } else {
        setWithIdx((s) => (s + 1) % LOOKING_WITH.length);
      }
      toggle ^= 1;
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  const scrollToNext = () => {
    document
      .getElementById("philosophy")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const surnameRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = surnameRef.current;
    if (!el) return;
    const fit = () => {
      const parent = el.parentElement;
      if (!parent) return;
      el.style.fontSize = "";
      let size = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > parent.clientWidth && size > 10) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement!);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="relative w-full min-h-[100svh] flex flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      {/* Availability */}
      <div className="inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.28em] text-foreground/70">
        <span className="relative flex h-1.5 w-1.5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400/70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
        </span>
        <span>Open to opportunities</span>
      </div>

      {/* Identity */}
      <h1
        className="mt-5 font-display leading-[0.88] font-light tracking-tight w-full"
        style={{ textShadow: "0 0 60px hsl(var(--primary) / 0.08)" }}
      >
        <span className="block text-[clamp(3.6rem,17vw,6rem)] bg-gradient-to-b from-foreground to-primary bg-clip-text text-transparent font-extralight tracking-wider">
          Lorenzo
        </span>
        <span
          ref={surnameRef}
          className="block whitespace-nowrap text-[clamp(1.55rem,7vw,2.5rem)] bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent font-normal tracking-tight mt-2"
        >
          {profile.name.last}
        </span>
      </h1>

      <p className="mt-3 text-[15px] leading-snug text-foreground/85">
        Leading the AI shift at{" "}
        <span className="text-primary font-medium">BPIfrance</span>{" "}
        <span className="text-foreground/55">with</span>{" "}
        <a
          href="https://www.theodo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-2 hover:underline"
        >
          @theodo
        </a>
      </p>

      <span
        className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] text-foreground/65"
        style={{
          background: "hsl(0 0% 100% / 0.04)",
          border: "1px solid hsl(var(--foreground) / 0.12)",
        }}
      >
        <MapPin className="w-3 h-3" strokeWidth={1.7} />
        Paris · SF-bound
      </span>

      {/* Rotating sentence */}
      <div className="my-12 font-display text-[1.35rem] leading-[1.5] tracking-tight text-foreground/70 flex flex-col gap-1.5">
        <div>
          <span>Building </span>
          <RotatingSlot items={LOOKING_THING} index={thingIdx} />
        </div>
        <div>
          <span>with </span>
          <RotatingSlot items={LOOKING_WITH} index={withIdx} />
          <span className="text-foreground/35">.</span>
        </div>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <CTATile
          href={profile.links.linkedin}
          icon={<Linkedin className="w-4 h-4" strokeWidth={1.7} />}
          kicker="Let's connect"
          label="LinkedIn"
          trail={<ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.8} />}
          tone="primary"
          external
        />
        <CTATile
          href="/Lorenzo%20Perrier%20de%20La%20Bathie%20Resume.pdf"
          icon={<Download className="w-4 h-4" strokeWidth={1.7} />}
          kicker="Get my resume"
          label="PDF"
          trail={<ArrowDown className="w-3.5 h-3.5" strokeWidth={1.8} />}
          tone="muted"
          download
        />
      </div>

      <button
        type="button"
        onClick={scrollToNext}
        className="mt-8 flex flex-col items-center gap-1.5 text-muted-foreground active:text-primary transition-colors"
        aria-label="Scroll to next section"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
      </button>
    </section>
  );
};

type RotatingSlotProps = {
  items: string[];
  index: number;
};

const RotatingSlot = ({ items, index }: RotatingSlotProps) => {
  const sampleRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = sampleRef.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
  }, [index]);

  return (
    <span
      className="relative inline-block overflow-hidden align-top"
      style={{
        height: "1.5em",
        lineHeight: "1.5em",
        width: width != null ? `${width}px` : undefined,
        transition: "width 500ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <span
        ref={sampleRef}
        aria-hidden
        className="invisible whitespace-nowrap absolute left-0 top-0"
      >
        {items[index]}
      </span>
      <span
        className="absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateY(-${index * 1.5}em)` }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            className="block whitespace-nowrap bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent"
            style={{ height: "1.5em", lineHeight: "1.5em" }}
          >
            {item}
          </span>
        ))}
      </span>
    </span>
  );
};

type CTATileProps = {
  href: string;
  icon: React.ReactNode;
  kicker: string;
  label: string;
  trail: React.ReactNode;
  tone: "primary" | "muted";
  download?: boolean;
  external?: boolean;
};

const CTATile = ({
  href,
  icon,
  kicker,
  label,
  trail,
  tone,
  download,
  external,
}: CTATileProps) => {
  const isPrimary = tone === "primary";
  return (
    <a
      href={href}
      {...(download ? { download: true } : {})}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="liquid-glass-fx group relative flex flex-col justify-between rounded-2xl px-4 py-3.5 overflow-hidden active:scale-[0.98] transition-transform"
      style={{
        background: isPrimary
          ? "linear-gradient(135deg, hsl(var(--primary) / 0.22) 0%, hsl(var(--primary) / 0.06) 100%)"
          : "linear-gradient(135deg, hsl(0 0% 100% / 0.05) 0%, hsl(220 20% 6% / 0.45) 100%)",
        border: isPrimary
          ? "1px solid hsl(var(--primary) / 0.42)"
          : "1px solid hsl(var(--foreground) / 0.14)",
        boxShadow: isPrimary
          ? "0 10px 30px -12px hsl(var(--primary) / 0.45), inset 0 1px 0 hsl(0 0% 100% / 0.12)"
          : "inset 0 1px 0 hsl(0 0% 100% / 0.06)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
            isPrimary
              ? "bg-primary/20 text-primary"
              : "bg-foreground/10 text-foreground/80"
          }`}
        >
          {icon}
        </span>
        <span className={isPrimary ? "text-primary" : "text-foreground/60"}>
          {trail}
        </span>
      </div>
      <div className="mt-3">
        <div className="text-[13.5px] font-medium text-foreground leading-tight">
          {kicker}
        </div>
        <div className="text-[10.5px] uppercase tracking-[0.22em] text-foreground/55 mt-1">
          {label}
        </div>
      </div>
    </a>
  );
};

export default HeroSectionMobile;
