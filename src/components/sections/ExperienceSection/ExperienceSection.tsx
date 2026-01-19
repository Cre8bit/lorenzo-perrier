import { useEffect, useRef, useState } from "react";
import {
  profile,
  experiences,
  education,
  skills,
  philosophy,
} from "@/data/profile";
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

const ExperienceSection = () => {
  const [showSticky, setShowSticky] = useState(false);
  const lastScrollY = useRef(0);
  const isScrollingDown = useRef(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const contentHeightsRef = useRef<Map<number, number>>(new Map());
  const contentRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());

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
    // Measure content heights after mount for smooth animations
    experiences.forEach((_, idx) => {
      const el = contentRefs.current.get(idx);
      if (el) {
        el.style.maxHeight = "none";
        const h = el.scrollHeight;
        contentHeightsRef.current.set(idx, h);
        el.style.maxHeight = "0px";
      }
    });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      isScrollingDown.current = y > lastScrollY.current;
      lastScrollY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = heroSentinelRef.current;
    if (!el) return;

    // Adjust this to match your sticky header height.
    const STICKY_HEIGHT = 72; // px (py-4 + text typically ~64-80)

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only show sticky when scrolling down and sentinel is not visible
        // Always hide when sentinel is visible OR scrolling up
        if (!entry.isIntersecting && isScrollingDown.current) {
          setShowSticky(true);
        } else if (entry.isIntersecting || !isScrollingDown.current) {
          setShowSticky(false);
        }
      },
      {
        root: null,
        threshold: 0,
        // Trigger when the sentinel crosses the top *minus* sticky header height.
        rootMargin: `-${STICKY_HEIGHT}px 0px 0px 0px`,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      {/* Sticky header (mounted always, but invisible until showSticky=true) */}
      <header
        className={[
          "sticky top-0 z-40 border-b border-border/30 bg-background/80 backdrop-blur-xl",
          "transition-all duration-500 ease-out",
          showSticky
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
                  opacity: showSticky ? 1 : 0,
                  transform: showSticky ? "translateX(0)" : "translateX(-8px)",
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
                opacity: showSticky ? 1 : 0,
                transform: showSticky ? "translateX(0)" : "translateX(8px)",
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
                  transitionDelay: showSticky ? "100ms" : "0ms",
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
                  transitionDelay: showSticky ? "150ms" : "0ms",
                }}
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                style={{
                  transitionDelay: showSticky ? "200ms" : "0ms",
                }}
              >
                <Mail className="w-4 h-4" />
              </a>

              {/* Separator */}
              <div className="w-px h-6 bg-border/30 mx-1" />

              {/* Download button */}
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 transition-all duration-300"
                style={{
                  transitionDelay: showSticky ? "250ms" : "0ms",
                }}
              >
                <Download className="w-3 h-3" />
                Resume
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Hero */}
        <Hero showSticky={showSticky} heroSentinelRef={heroSentinelRef} />

        {/* Skills Graph */}
        <section className="mb-20">
          <div className="mb-6">
            <h2 className="text-sm font-medium text-foreground tracking-wider uppercase flex items-center gap-3">
              <span className="w-8 h-px bg-primary" />
              Skill Graph
            </h2>
          </div>

          <SkillsGraph
            experiences={experiences}
            onSkillClick={(skill) => {
              // e.g. scroll to experience list or filter later
              console.log("clicked:", skill);
            }}
          />
        </section>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[2fr,1fr] gap-16">
          {/* Main content */}
          <div className="space-y-8">
            {/* Experience */}
            <section>
              <h2 className="text-sm font-medium text-foreground tracking-wider uppercase mb-8 flex items-center gap-3">
                <span className="w-8 h-px bg-primary" />
                Experience
              </h2>

              <div className="space-y-6">
                {experiences.map((exp, i) => {
                  const isExpanded = expandedCards.has(i);
                  return (
                    <article
                      key={i}
                      className="group relative rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 backdrop-blur-sm border border-border/20 p-6 transition-all duration-500 hover:border-primary/10 hover:shadow-[0_0_30px_hsla(185,50%,55%,0.08)]"
                    >
                      {/* Subtle glow on hover */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-primary/5 to-transparent" />

                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-medium group-hover:text-primary transition-colors duration-300">
                              {exp.role}
                            </h3>
                            <p className="text-muted-foreground">
                              {exp.website ? (
                                <a
                                  href={exp.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary transition-all duration-300 relative inline-block group/link"
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
                          <div className="text-right text-sm text-muted-foreground group-hover:text-primary/70 transition-colors duration-300">
                            <div className="font-medium">{exp.period}</div>
                            <div className="flex items-center justify-end gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{exp.location}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed mb-3 group-hover:text-foreground/90 transition-colors duration-300">
                          {exp.summary}
                        </p>

                        {/* Expandable content */}
                        {exp.expandedContent && (
                          <>
                            <button
                              onClick={() => toggleExpanded(i)}
                              className="group/btn text-xs text-primary/50 hover:text-primary tracking-wide mb-4 inline-flex items-center gap-2 transition-all duration-500"
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
                              className="overflow-hidden mb-4"
                              style={{
                                maxHeight: isExpanded
                                  ? `${contentHeightsRef.current.get(i) ?? 480}px`
                                  : "0px",
                                opacity: isExpanded ? 1 : 0,
                                transform: isExpanded
                                  ? "translateY(0)"
                                  : "translateY(-6px)",
                                transition:
                                  "max-height 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 450ms ease, transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
                              }}
                            >
                              <div className="pt-2 pb-4">
                                <p className="text-muted-foreground/80 leading-relaxed text-sm group-hover:text-foreground/90 transition-colors duration-300">
                                  {exp.expandedContent}
                                </p>
                              </div>
                            </div>
                          </>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {exp.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs rounded bg-muted/50 text-muted-foreground border border-border/10"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
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
                    Languages
                  </h4>
                  <p className="text-sm">{skills.languages.join(" · ")}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase mb-2">
                    Systems
                  </h4>
                  <p className="text-sm">{skills.systems.join(" · ")}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase mb-2">
                    Frontend
                  </h4>
                  <p className="text-sm">{skills.frontend.join(" · ")}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase mb-2">
                    Tools
                  </h4>
                  <p className="text-sm">{skills.tools.join(" · ")}</p>
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
      <footer className="border-t border-border/30 py-12 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © 2025 {profile.name.first}. Open to opportunities.
          </p>
          <a
            href={`mailto:${profile.email}`}
            className="text-sm text-primary hover:underline"
          >
            {profile.email}
          </a>
        </div>
      </footer>
    </div>
  );
};

export default ExperienceSection;
