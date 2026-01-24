import { useEffect, useRef, useState } from "react";
import { profile, experiences, education, skills } from "@/data/profile";
import {
  Github,
  Linkedin,
  Mail,
  MapPin,
  ExternalLink,
  Download,
  ArrowRight,
} from "lucide-react";
import { SkillsGraph } from "@/components/ui/skills-graph";
import Hero from "./ExperienceHero";
import { useAppContext } from "@/contexts/useAppContext";
import { useIsMobile } from "@/hooks/use-mobile";

const ExperienceSection = () => {
  const { currentSection, isResumeViewVisible, setIsResumeViewVisible } =
    useAppContext();
  const isMobile = useIsMobile();
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const contentRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [showAllExperiences, setShowAllExperiences] = useState(false);
  const [_, setIsHeroSectionVisible] = useState(false);
  const footerRef = useRef<HTMLDivElement | null>(null);

  // This marker decides when the sticky header should appear.
  const heroSentinelRef = useRef<HTMLDivElement | null>(null);

  const toggleExpanded = (index: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const el = heroSentinelRef.current;
    if (!el) return;

    const STICKY_HEIGHT = 72;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const pastHero = !entry.isIntersecting;
        setIsHeroSectionVisible(pastHero);
        // Update context: show resume view when past hero AND in experience section
        setIsResumeViewVisible(pastHero && currentSection === "experience");
      },
      {
        root: null,
        threshold: 0,
        rootMargin: `-${STICKY_HEIGHT}px 0px 0px 0px`,
      },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [setIsResumeViewVisible, currentSection]);

  // Lift footer slightly on overscroll so it moves up but doesn't reveal
  // the page background (use RAF to throttle updates).
  useEffect(() => {
    let rafId: number | null = null;

    const onScroll = () => {
      if (!footerRef.current) return;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const over = Math.max(
          0,
          window.scrollY + window.innerHeight - doc.scrollHeight,
        );
        // translate up a bit proportional to overscroll, clamp to 48px
        const translate = -Math.min(over * 0.6, 48);
        footerRef.current!.style.transform = `translateY(${translate}px)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // run once to ensure correct state on mount
    onScroll();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div>
      {/* Sticky header (mounted always, but invisible until showSticky=true) */}
      <header
        className={[
          "sticky top-0 z-40 border-b border-border/30 bg-background/80 backdrop-blur-xl",
          "transition-all duration-500 ease-out",
          isResumeViewVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none",
        ].join(" ")}
      >
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Name transitions into sticky header */}
              <div
                className="transition-all duration-500 ease-out"
                style={{
                  opacity: isResumeViewVisible ? 1 : 0,
                  transform: isResumeViewVisible
                    ? "translateX(0)"
                    : "translateX(-8px)",
                }}
              >
                <h1 className="font-display text-xl font-medium">
                  {profile.name.first}
                </h1>
                <p className="text-sm text-muted-foreground">{profile.title}</p>
              </div>
            </div>

            {/* Social links and buttons transition in */}
            <div
              className="flex items-center gap-3"
              style={{
                opacity: isResumeViewVisible ? 1 : 0,
                transform: isResumeViewVisible
                  ? "translateX(0)"
                  : "translateX(8px)",
                transition: "all 500ms ease-out",
              }}
            >
              {/* Social links */}
              <a
                href={profile.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                style={{
                  transitionDelay: isResumeViewVisible ? "100ms" : "0ms",
                }}
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href={profile.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                style={{
                  transitionDelay: isResumeViewVisible ? "150ms" : "0ms",
                }}
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                style={{
                  transitionDelay: isResumeViewVisible ? "200ms" : "0ms",
                }}
              >
                <Mail className="w-4 h-4" />
              </a>

              {/* Separator */}
              <div className="w-px h-6 bg-border/30 mx-1" />

              {/* Download button */}
              <a
                href={`${import.meta.env.BASE_URL}Lorenzo%20Perrier%20de%20La%20Bathie%20Resume.pdf`}
                download="Lorenzo Perrier de La Bâthie Resume.pdf"
                className="flex items-center gap-2 px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 transition-all duration-300"
                style={{
                  transitionDelay: isResumeViewVisible ? "250ms" : "0ms",
                }}
              >
                <Download className="w-3 h-3" />
                Resume
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Hero */}
        <Hero
          showSticky={isResumeViewVisible}
          heroSentinelRef={heroSentinelRef}
        />

        {/* Skills Graph */}
        {!isMobile && (
          <section className="mb-20">
            <div className="mb-6">
              <h2 className="text-sm font-medium text-foreground tracking-wider uppercase flex items-center gap-3">
                <span className="w-8 h-px bg-primary" />
                Skill Graph
              </h2>

              <p className="mt-1 text-xs text-muted-foreground ml-11">
                Hover nodes to reveal skills and where I’ve applied them
              </p>
            </div>

            <SkillsGraph
              experiences={experiences}
              onSkillClick={() => {
                // e.g. scroll to experience list or filter later
              }}
            />
          </section>
        )}

        {/* Two-column layout */}
        <div className="grid md:grid-cols-[2fr,1fr] gap-16">
          {/* Main content */}
          <div className="space-y-8">
            {/* Experience */}
            <section>
              <h2 className="text-sm font-medium text-foreground tracking-wider uppercase mb-8 flex items-center gap-3">
                <span className="w-8 h-px bg-primary" />
                Experience
              </h2>

              <div className="space-y-8">
                {(isMobile && !showAllExperiences
                  ? experiences.slice(0, 3)
                  : experiences
                ).map((exp, i) => {
                  const isExpanded = expandedCards.has(i);
                  const isEven = i % 2 === 0;
                  const isHovered = !isMobile && hoveredCardIndex === i;

                  return (
                    <div
                      key={i}
                      className={`relative ${isEven ? "md:mr-12" : "md:ml-12"}`}
                      onMouseEnter={() => {
                        if (!isMobile) setHoveredCardIndex(i);
                      }}
                      onMouseLeave={() => {
                        if (!isMobile) setHoveredCardIndex(null);
                      }}
                    >
                      {/* Connection line */}
                      <div
                        className={`hidden md:block absolute top-8 w-12 h-px bg-gradient-to-${isEven ? "r" : "l"} from-primary/30 to-transparent ${isEven ? "right-full" : "left-full"}`}
                      />

                      <article className="group relative rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 backdrop-blur-sm border border-border/20 p-4 transition-all duration-500 hover:border-primary/10 hover:shadow-[0_0_30px_hsla(185,50%,55%,0.08)]">
                        {/* Subtle glow on hover */}
                        <div
                          className="absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-primary/5 to-transparent"
                          style={{ opacity: isHovered ? 1 : 0 }}
                        />

                        <div className="relative">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3
                                className="text-lg font-medium transition-colors duration-300"
                                style={{
                                  color: isHovered
                                    ? "hsl(var(--primary))"
                                    : undefined,
                                }}
                              >
                                {exp.role}
                              </h3>
                              <p className="text-muted-foreground">
                                {exp.website ? (
                                  <a
                                    href={exp.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="transition-all duration-300 relative inline-block group/link"
                                    style={{
                                      color: isHovered
                                        ? "hsl(var(--foreground) / 0.9)"
                                        : "hsl(var(--muted-foreground))",
                                    }}
                                  >
                                    <span className="relative">
                                      {exp.company}
                                      <span className="absolute bottom-0 left-0 w-0 h-px bg-primary group-hover/link:w-full transition-all duration-300" />
                                    </span>
                                  </a>
                                ) : (
                                  exp.company
                                )}
                                {exp.logo && (
                                  <img
                                    src={exp.logo}
                                    alt=""
                                    className="inline-block w-4 h-4 ml-2 opacity-50"
                                  />
                                )}
                              </p>
                            </div>
                            <div
                              className="text-right text-sm text-muted-foreground transition-colors duration-300"
                              style={{
                                color: isHovered
                                  ? "hsl(var(--primary) / 0.7)"
                                  : undefined,
                              }}
                            >
                              <div className="font-medium">{exp.period}</div>
                              <div
                                className="
                                        grid
                                        grid-flow-col
                                        auto-cols-max
                                        justify-end
                                        items-center
                                        gap-x-1
                                        gap-y-0
                                        text-right
                                        leading-tight
                                      "
                              >
                                <MapPin className="w-3 h-3 mt-[1px]" />
                                <span className="whitespace-normal break-words">
                                  {exp.location}
                                </span>
                              </div>
                            </div>
                          </div>
                          {exp.summaryLink ? (
                            <a
                              href={exp.summaryLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm leading-relaxed transition-colors duration-300 group/summary"
                              style={{
                                color:
                                  isMobile || isHovered
                                    ? "hsl(var(--foreground) / 0.9)"
                                    : "hsl(var(--muted-foreground))",
                              }}
                            >
                              <span className="group-hover/summary:text-primary transition-colors duration-300">
                                {exp.summary}
                              </span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0 transition-all duration-300 group-hover/summary:text-primary group-hover/summary:translate-x-0.5" />
                            </a>
                          ) : (
                            <p
                              className="text-sm text-muted-foreground leading-relaxed transition-colors duration-300"
                              style={{
                                color:
                                  isHovered || isMobile
                                    ? "hsl(var(--foreground) / 0.9)"
                                    : undefined,
                              }}
                            >
                              {exp.summary}
                            </p>
                          )}

                          {/* Expandable content */}
                          {exp.expandedContent && (
                            <>
                              <button
                                onClick={() => toggleExpanded(i)}
                                className="group/btn text-xs text-primary/50 hover:text-primary tracking-wide mb-2 inline-flex items-center gap-2 transition-all duration-500"
                              >
                                <span>
                                  {isExpanded ? "Show less" : "Show more"}
                                </span>
                                <svg
                                  className={`w-3 h-3 transition-transform duration-500 ${
                                    isExpanded ? "rotate-180" : "rotate-0"
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    d="M19 9l-7 7-7-7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>

                              <div
                                ref={(el) => contentRefs.current.set(i, el)}
                                className="overflow-hidden transition-all duration-700"
                                style={{
                                  maxHeight: isExpanded ? "2000px" : "0px",
                                  opacity: isExpanded ? 1 : 0,
                                }}
                              >
                                <h4 className="text-xs font-medium text-foreground/70 uppercase tracking-wider mb-2">
                                  Description
                                </h4>
                                <div className="pt-1 pb-2">
                                  {typeof exp.expandedContent === "string" ? (
                                    <p
                                      className="text-muted-foreground/80 leading-relaxed text-sm transition-colors duration-300 mb-3"
                                      style={{
                                        color:
                                          isHovered || isMobile
                                            ? "hsl(var(--foreground) / 0.9)"
                                            : undefined,
                                      }}
                                    >
                                      {exp.expandedContent}
                                    </p>
                                  ) : (
                                    <>
                                      <div className="mb-4 pl-4 relative">
                                        {/* Vertical connector bar */}
                                        <div className="absolute left-0 top-6 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-transparent via-primary/70 to-transparent" />

                                        <div
                                          className="text-muted-foreground/80 leading-relaxed text-sm transition-colors duration-300"
                                          style={{
                                            color:
                                              isHovered || isMobile
                                                ? "hsl(var(--foreground) / 0.9)"
                                                : undefined,
                                          }}
                                          dangerouslySetInnerHTML={{
                                            __html:
                                              exp.expandedContent.description,
                                          }}
                                        />
                                      </div>

                                      {exp.expandedContent.keyContributions &&
                                        exp.expandedContent.keyContributions
                                          .length > 0 && (
                                          <div className="mb-4">
                                            <h4 className="text-xs font-medium text-foreground/70 uppercase tracking-wider mb-2">
                                              Key Contributions
                                            </h4>
                                            <ul className="space-y-1.5 text-sm text-muted-foreground/80">
                                              {exp.expandedContent.keyContributions.map(
                                                (contribution, idx) => (
                                                  <li
                                                    key={idx}
                                                    className="flex items-start gap-2"
                                                  >
                                                    <span className="text-primary shrink-0">
                                                      •
                                                    </span>
                                                    <span
                                                      className="leading-relaxed transition-colors duration-300"
                                                      style={{
                                                        color:
                                                          isHovered || isMobile
                                                            ? "hsl(var(--foreground) / 0.9)"
                                                            : undefined,
                                                      }}
                                                    >
                                                      {contribution}
                                                    </span>
                                                  </li>
                                                ),
                                              )}
                                            </ul>
                                          </div>
                                        )}

                                      <div>
                                        <h4 className="text-xs font-medium text-foreground/70 uppercase tracking-wider mb-2">
                                          Technologies
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                          {exp.tags.slice(0, 4).map((tag) => (
                                            <span
                                              key={tag}
                                              className="px-2 py-0.5 text-xs rounded bg-muted/50 text-muted-foreground border border-border/10"
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>

              {/* Show more button for mobile */}
              {isMobile && !showAllExperiences && experiences.length > 3 && (
                <button
                  onClick={() => setShowAllExperiences(true)}
                  className="mt-8 w-full px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 border border-primary/30 hover:border-primary/50 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>Show more experiences</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Education - Glass Panel */}
            <section className="rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 backdrop-blur-sm border border-border/20 p-6 transition-all duration-500 hover:border-primary/10 hover:shadow-[0_0_30px_hsla(185,50%,55%,0.08)]">
              <h2 className="text-sm font-medium text-foreground tracking-wider uppercase mb-6">
                Education
              </h2>
              <div className="space-y-4">
                {education.map((edu, i) => (
                  <div key={i}>
                    <h4 className="font-medium text-sm">{edu.degree}</h4>
                    <p className="text-sm text-muted-foreground">
                      {edu.school}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {edu.period}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills by category - Glass Panel */}
            <section className="rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 backdrop-blur-sm border border-border/20 p-6 transition-all duration-500 hover:border-primary/10 hover:shadow-[0_0_30px_hsla(185,50%,55%,0.08)]">
              <h2 className="text-sm font-medium text-foreground tracking-wider uppercase mb-6">
                Technical Skills
              </h2>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase mb-2">
                    Stacks I've Shipped
                  </h4>
                  <p className="text-sm">{skills.stacks.join(" · ")}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase mb-2">
                    Tools I use
                  </h4>
                  <p className="text-sm">{skills.tools.join(" · ")}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase mb-2">
                    ML tools
                  </h4>
                  <p className="text-sm">{skills.MLtools.join(" · ")}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase mb-2">
                    Core languages
                  </h4>
                  <p className="text-sm">{skills.languages.join(" · ")}</p>
                </div>
              </div>
            </section>

            {/* Links - Glass Panel */}
            <section className="rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 backdrop-blur-sm border border-border/20 p-6 transition-all duration-500 hover:border-primary/10 hover:shadow-[0_0_30px_hsla(185,50%,55%,0.08)]">
              <h2 className="text-sm font-medium text-foreground tracking-wider uppercase mb-6">
                Links
              </h2>
              <div className="space-y-3">
                <a
                  href={profile.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group/link"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </a>
                <a
                  href={profile.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group/link"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </a>
              </div>
            </section>

            {/* CTA block */}
            <section>
              <div className="rounded-2xl bg-gradient-to-br from-foreground to-foreground/90 text-background p-6">
                <h2 className="font-display text-lg font-medium mb-2">
                  Let's build something together!
                </h2>
                <p className="text-background/70 text-xs mb-4 leading-relaxed">
                  {profile.seeking}
                </p>
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-background text-foreground rounded-lg hover:gap-3 transition-all text-sm font-medium"
                >
                  <Mail className="w-4 h-4" />
                  Email me
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 px-6 mt-20 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              © 2025 {profile.name.first}. Open to opportunities.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Last updated · {import.meta.env.VITE_BUILD_DATE}
            </p>
          </div>
          <div className="text-[11px] text-muted-foreground/70">
            <span className="opacity-60">Built with</span> React · Three.js ·
            Vite
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExperienceSection;
