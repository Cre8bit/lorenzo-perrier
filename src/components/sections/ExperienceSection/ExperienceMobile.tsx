import { useState } from "react";
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
import MarqueeBand from "@/components/mobile/MarqueeBand";

const allSkills = [
  ...skills.languages,
  ...skills.stacks,
  ...skills.MLtools,
  ...skills.tools,
];

/**
 * Mobile experience section.
 * - One glass panel per experience, tap to expand.
 * - Single panels for education / skills / links.
 * - SectionZoom adds a subtle scroll-driven scale-in on each card.
 * - Skills appear as a horizontal marquee so the long list never
 *   forces vertical clutter.
 */
export const ExperienceMobile = () => {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <section className="relative w-full pt-24 pb-32 px-5">
      {/* Identity card */}
      <SectionZoom>
        <div className="rounded-3xl border border-border/30 bg-gradient-to-br from-muted/20 to-muted/5 p-6 relative overflow-hidden">
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
      </SectionZoom>

      {/* KPI marquee */}
      <div className="mt-6 -mx-5">
        <MarqueeBand speed={26} className="py-4">
          {profile.highlights.map((h, i) => (
            <div key={i} className="flex items-baseline gap-3 whitespace-nowrap">
              <span className="font-display text-xl text-primary">
                {h.label}
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {h.description}
              </span>
            </div>
          ))}
        </MarqueeBand>
      </div>

      {/* Experience list */}
      <h3 className="mt-12 mb-5 text-[11px] uppercase tracking-[0.3em] text-primary/70 flex items-center gap-2">
        <span className="w-6 h-px bg-primary/50" /> Experience
      </h3>
      <div className="space-y-4">
        {experiences.map((exp, i) => {
          const isOpen = expanded.has(i);
          return (
            <SectionZoom key={i} minScale={0.94} minOpacity={0.55}>
              <article
                className="rounded-2xl border border-border/25 bg-gradient-to-br from-muted/15 to-muted/5 overflow-hidden"
              >
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

                {isOpen && exp.expandedContent && (
                  <div className="px-5 pb-5 -mt-1 border-t border-border/20 pt-4">
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
                )}
              </article>
            </SectionZoom>
          );
        })}
      </div>

      {/* Education */}
      <h3 className="mt-12 mb-5 text-[11px] uppercase tracking-[0.3em] text-primary/70 flex items-center gap-2">
        <span className="w-6 h-px bg-primary/50" /> Education
      </h3>
      <SectionZoom minScale={0.94} minOpacity={0.55}>
        <div className="rounded-2xl border border-border/25 bg-gradient-to-br from-muted/15 to-muted/5 p-5 space-y-4">
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

      {/* Skills */}
      <h3 className="mt-12 mb-5 text-[11px] uppercase tracking-[0.3em] text-primary/70 flex items-center gap-2">
        <span className="w-6 h-px bg-primary/50" /> Technical Skills
      </h3>
      <SectionZoom minScale={0.94} minOpacity={0.55}>
        <div className="rounded-2xl border border-border/25 bg-gradient-to-br from-muted/15 to-muted/5 p-5 overflow-hidden">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-3">
            Stack
          </p>
          <div className="-mx-5">
            <MarqueeBand speed={32}>
              {allSkills.map((s, i) => (
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
            <MarqueeBand speed={36} reverse>
              {allSkills.map((s, i) => (
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

      {/* Links */}
      <h3 className="mt-12 mb-5 text-[11px] uppercase tracking-[0.3em] text-primary/70 flex items-center gap-2">
        <span className="w-6 h-px bg-primary/50" /> Connect
      </h3>
      <SectionZoom minScale={0.94} minOpacity={0.55}>
        <div className="rounded-2xl border border-border/25 bg-gradient-to-br from-muted/15 to-muted/5 p-5 space-y-2">
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
    </section>
  );
};

export default ExperienceMobile;