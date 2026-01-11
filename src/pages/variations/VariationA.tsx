// Variation A: "Editorial Minimal"
// Clean two-column layout, particles only in corner, strong typography focus
// Inspired by: clean editorial design with clear hierarchy

import { useState } from "react";
import { profile, experiences, education, philosophy } from "@/data/profile";
import { ConstellationMinimal } from "@/components/ui/constellation-minimal";
import { Github, Linkedin, Mail, ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const VariationA = () => {
  const [activeExp, setActiveExp] = useState(0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to original
          </Link>
          <div className="flex items-center gap-6">
            <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
            <button className="px-4 py-2 text-sm border border-foreground/20 rounded-full hover:bg-foreground hover:text-background transition-all">
              Resume
            </button>
          </div>
        </nav>
      </header>

      {/* Hero - Editorial style */}
      <section className="min-h-screen flex items-center relative overflow-hidden pt-20">
        <ConstellationMinimal region="corner" dotCount={35} />
        
        <div className="max-w-7xl mx-auto px-8 w-full grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-light tracking-tight">
                {profile.name.first}
              </h1>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extralight text-muted-foreground tracking-tight">
                {profile.name.last.split(' ')[0]}
              </h2>
            </div>
            
            <p className="text-xl text-muted-foreground font-light max-w-md">
              {profile.title} — {profile.tagline}
            </p>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                {profile.location}
              </span>
              <span className="w-1 h-1 rounded-full bg-primary" />
              <span className="text-primary">{profile.seeking}</span>
            </div>

            <div className="flex gap-4 pt-4">
              <a href="#work" className="group flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-full hover:gap-4 transition-all">
                View Work
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href={`mailto:${profile.email}`} className="flex items-center gap-2 px-6 py-3 border border-foreground/20 rounded-full hover:border-foreground/40 transition-colors">
                <Mail className="w-4 h-4" />
                Contact
              </a>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4">
            {profile.highlights.map((h, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50"
              >
                <div className="text-3xl font-display font-light text-primary mb-2">
                  {h.label}
                </div>
                <div className="text-sm text-muted-foreground">{h.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy - Horizontal scroll hints */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-sm text-muted-foreground tracking-widest uppercase mb-12">
            How I think
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {philosophy.map((p, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl border border-border/30 hover:border-primary/30 hover:bg-card/20 transition-all cursor-default"
              >
                <div className="text-xs text-primary/60 mb-4">0{i + 1}</div>
                <h4 className="font-display text-xl mb-3 group-hover:text-primary transition-colors">
                  {p.title}
                </h4>
                <p className="text-muted-foreground text-sm">{p.short}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience - Interactive timeline */}
      <section id="work" className="py-32 px-8 bg-card/20">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-sm text-muted-foreground tracking-widest uppercase mb-12">
            Experience
          </h3>

          <div className="grid lg:grid-cols-[1fr,2fr] gap-12">
            {/* Timeline nav */}
            <div className="space-y-1">
              {experiences.map((exp, i) => (
                <button
                  key={i}
                  onClick={() => setActiveExp(i)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    activeExp === i
                      ? "bg-primary/10 border-l-2 border-primary"
                      : "hover:bg-card/50 border-l-2 border-transparent"
                  }`}
                >
                  <div className="text-sm text-muted-foreground">{exp.period}</div>
                  <div className={`font-medium ${activeExp === i ? "text-primary" : ""}`}>
                    {exp.company}
                  </div>
                </button>
              ))}
            </div>

            {/* Active experience detail */}
            <div className="p-8 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/30">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h4 className="text-2xl font-display mb-2">
                    {experiences[activeExp].role}
                  </h4>
                  <div className="text-muted-foreground">
                    {experiences[activeExp].company} · {experiences[activeExp].location}
                  </div>
                </div>
                {experiences[activeExp].logo && (
                  <img
                    src={experiences[activeExp].logo}
                    alt={experiences[activeExp].company}
                    className="h-10 w-auto opacity-50"
                  />
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {experiences[activeExp].summary}
              </p>
              <div className="flex flex-wrap gap-2">
                {experiences[activeExp].tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Education */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-sm text-muted-foreground tracking-widest uppercase mb-12">
            Education
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {education.map((edu, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border/30">
                <div className="text-sm text-primary mb-2">{edu.period}</div>
                <h4 className="font-display text-xl mb-1">{edu.degree}</h4>
                <div className="text-muted-foreground">{edu.school}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-24 px-8 bg-card/20">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="font-display text-4xl mb-6">Let's build something together</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Open to opportunities in San Francisco and the Bay Area.
          </p>
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-foreground text-background rounded-full hover:gap-4 transition-all"
          >
            Get in touch
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default VariationA;
