// Variation D: "Stacked Cards"
// Career journey shown as stacked timeline cards
// Inspired by the career path visualization

import { useState } from "react";
import { profile, experiences, education, philosophy, skills } from "@/data/profile";
import { ConstellationMinimal } from "@/components/ui/constellation-minimal";
import { Github, Linkedin, Mail, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const VariationD = () => {
  const [hoveredExp, setHoveredExp] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[hsl(180,15%,8%)] text-foreground">
      {/* Subtle particles */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <ConstellationMinimal region="full" dotCount={30} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back
          </Link>
          <div className="flex items-center gap-3">
            {[
              { icon: Github, href: profile.links.github },
              { icon: Linkedin, href: profile.links.linkedin },
              { icon: Mail, href: `mailto:${profile.email}` },
            ].map(({ icon: Icon, href }, i) => (
              <a
                key={i}
                href={href}
                target={href.startsWith("mailto") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[hsl(170,30%,20%)] flex items-center justify-center text-[hsl(170,40%,60%)] hover:bg-[hsl(170,30%,25%)] transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero - Large name with role */}
        <section className="min-h-[70vh] flex items-end px-8 pb-20 pt-32">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-end">
              <div>
                <h1 className="font-display text-5xl md:text-7xl font-light mb-4">
                  {profile.name.first}
                  <br />
                  <span className="text-muted-foreground">{profile.name.last.split(' ')[0]}</span>
                </h1>
                <p className="text-xl text-[hsl(170,40%,60%)]">{profile.title}</p>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                {profile.tagline}
              </p>
            </div>
          </div>
        </section>

        {/* Career Journey - Stacked cards inspired by reference */}
        <section className="px-8 py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-sm text-[hsl(170,40%,60%)] tracking-widest uppercase mb-16">
              Career Path
            </h2>
            
            <div className="relative">
              {/* Cards stacked ascending */}
              <div className="space-y-4">
                {experiences.map((exp, i) => {
                  const isHovered = hoveredExp === i;
                  return (
                    <div
                      key={i}
                      className={`relative transition-all duration-300 cursor-pointer`}
                      style={{
                        marginLeft: `${i * 3}%`,
                        zIndex: hoveredExp === i ? 10 : i,
                      }}
                      onMouseEnter={() => setHoveredExp(i)}
                      onMouseLeave={() => setHoveredExp(null)}
                    >
                      <div
                        className={`p-6 md:p-8 rounded-2xl transition-all duration-300 ${
                          isHovered
                            ? "bg-[hsl(170,25%,18%)] shadow-xl shadow-[hsl(170,40%,30%)/0.2]"
                            : "bg-[hsl(170,20%,14%)]"
                        }`}
                        style={{
                          transform: isHovered ? "translateY(-4px) scale(1.02)" : "none",
                        }}
                      >
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <h3 className="font-display text-xl text-[hsl(170,40%,80%)]">
                                {exp.company}
                              </h3>
                              {exp.logo && (
                                <img src={exp.logo} alt="" className="h-6 opacity-60" />
                              )}
                            </div>
                            <p className="text-[hsl(170,30%,50%)] mb-2">{exp.role}</p>
                            {isHovered && (
                              <p className="text-muted-foreground text-sm mt-4 animate-fade-in">
                                {exp.summary}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-display text-2xl text-[hsl(170,40%,70%)]">
                              {exp.period.split(' ')[0].replace(',', '')}
                            </span>
                          </div>
                        </div>
                        {isHovered && (
                          <div className="flex flex-wrap gap-2 mt-4 animate-fade-in">
                            {exp.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-3 py-1 text-xs rounded-full bg-[hsl(170,30%,25%)] text-[hsl(170,40%,70%)]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy */}
        <section className="px-8 py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-sm text-[hsl(170,40%,60%)] tracking-widest uppercase mb-12">
              How I Think
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {philosophy.map((p, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-[hsl(170,20%,12%)] border border-[hsl(170,20%,20%)] hover:border-[hsl(170,30%,30%)] transition-colors"
                >
                  <h3 className="text-[hsl(170,40%,75%)] font-medium mb-2">{p.title}</h3>
                  <p className="text-muted-foreground text-sm">{p.short}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Skills grid */}
        <section className="px-8 py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-sm text-[hsl(170,40%,60%)] tracking-widest uppercase mb-12">
              Technical Stack
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(skills).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-xs text-muted-foreground uppercase tracking-wider">
                    {category}
                  </h4>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div key={item} className="text-sm text-[hsl(170,30%,70%)]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Education */}
        <section className="px-8 py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-sm text-[hsl(170,40%,60%)] tracking-widest uppercase mb-12">
              Education
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {education.map((edu, i) => (
                <div key={i} className="p-6 rounded-2xl bg-[hsl(170,20%,12%)]">
                  <div className="text-sm text-[hsl(170,40%,50%)] mb-2">{edu.period}</div>
                  <h3 className="text-lg text-[hsl(170,40%,80%)] mb-1">{edu.degree}</h3>
                  <p className="text-muted-foreground">{edu.school}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-8 py-32">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="font-display text-4xl mb-6 text-[hsl(170,40%,80%)]">
              Let's build together
            </h2>
            <p className="text-muted-foreground mb-8">{profile.seeking}</p>
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[hsl(170,30%,25%)] hover:bg-[hsl(170,30%,30%)] text-[hsl(170,40%,80%)] rounded-full transition-colors"
            >
              Get in touch
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default VariationD;
