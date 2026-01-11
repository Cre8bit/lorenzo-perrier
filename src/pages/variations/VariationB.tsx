// Variation B: "Immersive Dark"
// Full particle background with content overlaid, more artistic/atmospheric
// Particles everywhere but dimmed, content emerges from the field

import { lazy, Suspense, useState } from "react";
import { profile, experiences, education, philosophy, skills } from "@/data/profile";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { Github, Linkedin, Mail, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const ParticleField3D = lazy(() => import("@/components/ui/particle-field-3d"));

const VariationB = () => {
  const [expandedExp, setExpandedExp] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Full background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-background" />
        <div className="noise-overlay" />
        <AmbientBackground />
        <Suspense fallback={null}>
          <ParticleField3D activePresetIndex={-1} />
        </Suspense>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors tracking-widest uppercase">
            ← Original
          </Link>
          <div className="flex items-center gap-4">
            <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-card/30 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Github className="w-3.5 h-3.5" />
            </a>
            <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-card/30 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero - Centered, minimal */}
        <section className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
          <div className="space-y-6 max-w-3xl">
            <h1 className="font-display text-5xl md:text-7xl font-light tracking-tight">
              <span className="bg-gradient-to-b from-foreground to-primary bg-clip-text text-transparent">
                {profile.name.first}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light">
              {profile.title}
            </p>
            <p className="text-muted-foreground/70 max-w-lg mx-auto">
              {profile.tagline}
            </p>
          </div>

          <button
            onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-12 animate-bounce text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </section>

        {/* About with glass card */}
        <section id="about" className="min-h-screen flex items-center px-8 py-32">
          <div className="max-w-4xl mx-auto">
            <div className="p-8 md:p-12 rounded-3xl bg-card/20 backdrop-blur-xl border border-border/20">
              <h2 className="text-xs text-primary tracking-widest uppercase mb-8">About</h2>
              <p className="text-xl md:text-2xl font-light leading-relaxed text-foreground/90 mb-12">
                {profile.summary}
              </p>
              
              {/* Philosophy as flowing text */}
              <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-border/20">
                {philosophy.map((p, i) => (
                  <div key={i} className="space-y-2">
                    <h4 className="text-sm font-medium text-primary/80">{p.title}</h4>
                    <p className="text-muted-foreground">{p.short}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Experience - Accordion style */}
        <section className="px-8 py-32">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xs text-primary tracking-widest uppercase mb-12">Experience</h2>
            
            <div className="space-y-4">
              {experiences.map((exp, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-card/10 backdrop-blur-sm border border-border/10 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedExp(expandedExp === i ? null : i)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-card/20 transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      {exp.logo && (
                        <img src={exp.logo} alt="" className="w-10 h-10 object-contain opacity-60" />
                      )}
                      <div>
                        <h4 className="font-medium text-lg">{exp.role}</h4>
                        <p className="text-muted-foreground text-sm">{exp.company} · {exp.period}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        expandedExp === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  
                  {expandedExp === i && (
                    <div className="px-6 pb-6 space-y-4">
                      <p className="text-muted-foreground leading-relaxed pl-16">
                        {exp.summary}
                      </p>
                      <div className="flex flex-wrap gap-2 pl-16">
                        {exp.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary/80">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Skills as flowing tags */}
        <section className="px-8 py-32">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xs text-primary tracking-widest uppercase mb-12">Skills</h2>
            
            <div className="flex flex-wrap gap-3">
              {Object.values(skills).flat().map((skill, i) => (
                <span
                  key={i}
                  className="px-4 py-2 rounded-full bg-card/20 backdrop-blur-sm border border-border/20 text-sm text-foreground/80 hover:border-primary/30 hover:text-primary transition-colors cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Education */}
        <section className="px-8 py-32">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xs text-primary tracking-widest uppercase mb-12">Education</h2>
            
            <div className="space-y-6">
              {education.map((edu, i) => (
                <div key={i} className="flex items-start gap-6">
                  <div className="text-sm text-muted-foreground whitespace-nowrap">{edu.period}</div>
                  <div>
                    <h4 className="font-medium">{edu.degree}</h4>
                    <p className="text-muted-foreground">{edu.school}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact - Floating card */}
        <section className="px-8 py-32">
          <div className="max-w-md mx-auto">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-xl border border-primary/20 text-center">
              <h3 className="font-display text-2xl mb-4">Let's connect</h3>
              <p className="text-muted-foreground mb-6">{profile.seeking}</p>
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary/20 hover:bg-primary/30 rounded-full text-primary transition-colors"
              >
                <Mail className="w-4 h-4" />
                {profile.email}
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VariationB;
