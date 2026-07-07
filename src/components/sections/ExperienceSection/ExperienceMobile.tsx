import { useCallback, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  MapPin,
} from "lucide-react";
import { education, experiences, profile, skills } from "@/data/profile";
import SectionZoom from "@/components/mobile/SectionZoom";
import MarqueeBand, { BannerMarquee } from "@/components/mobile/MarqueeBand";
import {
  useScrollDriven,
  easeOutQuad,
} from "@/hooks/use-scroll-driven";

const allSkills = [
  ...skills.languages,
  ...skills.stacks,
  ...skills.MLtools,
  ...skills.tools,
];
const skillsTop = allSkills.filter((_, i) => i % 2 === 0);
const skillsBottom = allSkills.filter((_, i) => i % 2 === 1);

export const ExperienceMobile = () => {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const zoomRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const restRef = useRef<HTMLDivElement>(null);
  const lastZoom = useRef({ scale: -1, cardOp: -1, restOn: false });

  const applyZoom = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.max(0, Math.min(1, (vh - rect.top) / (vh * 0.75)));
    const eased = easeOutQuad(p);
    const scale = Math.round((0.82 + eased * 0.26) * 200) / 200;
    const cardOp = Math.round((0.7 + eased * 0.3) * 100) / 100;
    const last = lastZoom.current;
    if (scale !== last.scale || cardOp !== last.cardOp) {
      card.style.transform = `scale(${scale})`;
      card.style.opacity = `${cardOp}`;
      last.scale = scale;
      last.cardOp = cardOp;
    }
    // The rest of the section (marquees included) fades via one CSS
    // transition — per-frame opacity writes here would repaint the whole
    // subtree on every scroll tick and stutter the marquee compositing.
    const restOn = p >= 0.55;
    if (restRef.current && restOn !== last.restOn) {
      restRef.current.dataset.revealed = String(restOn);
      last.restOn = restOn;
    }
  }, []);

  useScrollDriven(zoomRef, applyZoom, {
    leadVh: 1.2,
    rootMargin: "40% 0px 40% 0px",
  });

  return (
    <section className="relative w-full">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(70% 55% at 8% 12%, hsl(192 70% 44% / 0.30), transparent 62%)",
            "radial-gradient(70% 55% at 92% 88%, hsl(186 70% 42% / 0.30), transparent 62%)",
            "radial-gradient(55% 45% at 90% 18%, hsl(200 55% 35% / 0.18), transparent 70%)",
            "radial-gradient(60% 50% at 12% 88%, hsl(195 60% 38% / 0.22), transparent 65%)",
            "linear-gradient(180deg, hsl(220 30% 6%) 0%, hsl(225 32% 9%) 55%, hsl(220 30% 7%) 100%)",
          ].join(", "),
          maskImage:
            "linear-gradient(180deg, transparent 0px, rgba(0,0,0,0.6) 320px, black 560px, black calc(100% - 200px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0px, rgba(0,0,0,0.6) 320px, black 560px, black calc(100% - 200px), transparent 100%)",
        }}
      />

      <div ref={zoomRef} className="relative">
        <div className="flex justify-center pt-12 pb-8 px-5">
          <div
            ref={cardRef}
            className="w-full"
            style={{
              transformOrigin: "center",
              willChange: "transform, opacity",
            }}
          >
            <div
              className="rounded-3xl border border-border/30 p-6 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(160deg, hsl(220 14% 9%) 0%, hsl(220 12% 7%) 100%)",
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
                }}
              />
              <div className="flex items-center gap-4">
                <img
                  src={`${import.meta.env.BASE_URL}Lorenzo_in_vietnam.jpg`}
                  alt={profile.name.first}
                  loading="lazy"
                  decoding="async"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-2xl object-cover border border-primary/20"
                />
                <div>
                  <h2 className="font-display text-2xl">{profile.name.first}</h2>
                  <p className="text-sm text-muted-foreground">{profile.title}</p>
                  <p className="text-xs text-primary/80 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {profile.location}
                  </p>
                </div>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed mt-5">
                {profile.summary}
              </p>
              <div className="mt-5 flex items-start gap-3">
                <div className="w-1 h-12 bg-gradient-to-b from-primary to-primary/20 rounded-full flex-shrink-0" />
                <p
                  className="text-sm italic text-foreground/70 leading-relaxed"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {profile.quote}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div ref={restRef} className="exp-rest relative px-5">
          <div className="-mx-5">
            <BannerMarquee speed={26}>
              {profile.highlights.map((h, i) => (
                <span
                  key={i}
                  className="inline-flex items-baseline gap-2.5 whitespace-nowrap"
                >
                  <span className="font-display text-[1.05rem] leading-none bg-gradient-to-b from-foreground to-primary bg-clip-text text-transparent">
                    {h.label}
                  </span>
                  <span className="text-[10.5px] uppercase tracking-[0.28em] text-foreground/70">
                    {h.description}
                  </span>
                </span>
              ))}
            </BannerMarquee>
          </div>

          <div className="mt-14 mb-6">
            <h3 className="font-display text-[1.7rem] leading-[1.1]">Experience</h3>
          </div>
          <div className="space-y-4">
            {experiences.map((exp, i) => {
              const isOpen = expanded.has(i);
              return (
                <SectionZoom key={i} minScale={0.94} minOpacity={0.55}>
                  <article className="rounded-2xl border border-border/40 bg-gradient-to-br from-muted/35 to-muted/15 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggle(i)}
                      className="w-full text-left p-5 min-h-[48px]"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-base font-medium leading-tight">
                            {exp.role}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                            {exp.company}
                            {exp.logo && (
                              <img
                                src={`${import.meta.env.BASE_URL}${exp.logo}`}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                width={14}
                                height={14}
                                className="w-3.5 h-3.5 opacity-60"
                              />
                            )}
                          </p>
                        </div>
                        <ChevronDown
                          className="w-4 h-4 mt-1 text-muted-foreground transition-transform duration-300 flex-shrink-0"
                          style={{
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="text-primary/80">{exp.period}</span>
                        <span className="opacity-40">·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {exp.location}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
                        {exp.summary}
                      </p>
                    </button>

                    {exp.expandedContent && (
                      <div
                        className="grid transition-[grid-template-rows,opacity] duration-[420ms] ease-out"
                        style={{
                          gridTemplateRows: isOpen ? "1fr" : "0fr",
                          opacity: isOpen ? 1 : 0,
                        }}
                        aria-hidden={!isOpen}
                      >
                        <div className="overflow-hidden">
                          <div className="px-5 pb-5 border-t border-border/20 pt-4">
                            <p
                              className="text-sm text-foreground/75 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: exp.expandedContent.description,
                              }}
                            />
                            <ul className="mt-4 space-y-2.5">
                              {exp.expandedContent.keyContributions.map((k, j) => (
                                <li
                                  key={j}
                                  className="text-xs text-foreground/70 leading-relaxed flex gap-2"
                                >
                                  <span className="text-primary mt-1">→</span>
                                  <span>{k}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="flex flex-wrap gap-1.5 mt-4">
                              {exp.tags.slice(0, 8).map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/80"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                            {exp.website && (
                              <a
                                href={exp.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 mt-4 text-xs text-primary min-h-[48px]"
                              >
                                Visit {exp.company}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                </SectionZoom>
              );
            })}
          </div>

          <div className="mt-14 mb-6">
            <h3 className="font-display text-[1.7rem] leading-[1.1]">Education</h3>
          </div>
          <SectionZoom minScale={0.94} minOpacity={0.55}>
            <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-muted/35 to-muted/15 p-5 space-y-4">
              {education.map((e, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3"
                  style={{
                    borderTop: i ? "1px solid hsl(var(--border) / 0.25)" : "none",
                    paddingTop: i ? "1rem" : 0,
                  }}
                >
                  <div>
                    <p className="text-sm font-medium">{e.degree}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {e.school}
                    </p>
                  </div>
                  <p className="text-[11px] text-primary/80 whitespace-nowrap">
                    {e.period}
                  </p>
                </div>
              ))}
            </div>
          </SectionZoom>

          <div className="mt-14 mb-6">
            <h3 className="font-display text-[1.7rem] leading-[1.1]">
              Skills & tools
            </h3>
          </div>
          <SectionZoom minScale={0.94} minOpacity={0.55}>
            <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-muted/35 to-muted/15 p-5 overflow-hidden">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-3">
                Stack
              </p>
              <div className="-mx-5">
                <MarqueeBand speed={17}>
                  {skillsTop.map((s, i) => (
                    <span
                      key={i}
                      className="text-sm px-3 py-1.5 rounded-full border border-primary/20 text-foreground/85 whitespace-nowrap"
                    >
                      {s}
                    </span>
                  ))}
                </MarqueeBand>
              </div>
              <div className="-mx-5 mt-3">
                <MarqueeBand speed={19} reverse>
                  {skillsBottom.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1 rounded-full text-muted-foreground border border-border/30 whitespace-nowrap"
                    >
                      {s}
                    </span>
                  ))}
                </MarqueeBand>
              </div>
            </div>
          </SectionZoom>

          <div className="mt-14 mb-6">
            <h3 className="font-display text-[1.7rem] leading-[1.1]">Contact</h3>
          </div>
          <SectionZoom minScale={0.94} minOpacity={0.55}>
            <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-muted/35 to-muted/15 p-5 space-y-2">
              {[
                {
                  icon: Github,
                  label: "GitHub",
                  value: "@cre8bit",
                  href: profile.links.github,
                },
                {
                  icon: Linkedin,
                  label: "LinkedIn",
                  value: profile.name.first,
                  href: profile.links.linkedin,
                },
                {
                  icon: Mail,
                  label: "Email",
                  value: profile.email,
                  href: `mailto:${profile.email}`,
                },
              ].map(({ icon: Icon, label, value, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 min-h-[48px] py-2 px-3 -mx-3 rounded-xl hover:bg-primary/5 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-primary/80" />
                    <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      {label}
                    </span>
                  </span>
                  <span className="text-sm text-foreground/90 truncate max-w-[55%] text-right">
                    {value}
                  </span>
                </a>
              ))}
              <a
                href={`${import.meta.env.BASE_URL}Lorenzo%20Perrier%20de%20La%20Bathie%20Resume.pdf`}
                download="Lorenzo Perrier de La Bâthie Resume.pdf"
                className="mt-3 flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-foreground text-background text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download Resume
              </a>
            </div>
          </SectionZoom>

          <footer
            className="mt-16 -mx-5 px-6 pt-5 backdrop-blur-md"
            style={{
              background:
                "linear-gradient(180deg, hsl(220 30% 6% / 0) 0%, hsl(220 30% 6% / 0.55) 40%, hsl(220 30% 6% / 0.75) 100%)",
              paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
            }}
          >
            <div
              aria-hidden
              className="mx-auto mb-3.5 h-px w-12 bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
            />
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-[10px] uppercase tracking-[0.32em] text-foreground/30">
                © 2026 · {profile.name.first}
              </p>
              <p className="text-[9.5px] tracking-[0.18em] text-foreground/20">
                Updated {import.meta.env.VITE_BUILD_DATE} · React · Three.js · Vite
              </p>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
};

export default ExperienceMobile;
