// Variation E: "Bento Grid"
// Modern bento-box layout with mixed content blocks
// Particles as a decorative hero element only

import { useState } from "react";
import { profile, experiences, education, philosophy, skills } from "@/data/profile";
import { ConstellationMinimal } from "@/components/ui/constellation-minimal";
import { Github, Linkedin, Mail, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const VariationE = () => {
  const [activeSkillCategory, setActiveSkillCategory] = useState<string>("languages");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Original
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={profile.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-card transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href={profile.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-card transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="ml-2 px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
            >
              Contact
            </a>
          </div>
        </nav>
      </header>

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Bento Grid */}
          <div className="grid grid-cols-12 gap-4 auto-rows-[minmax(120px,auto)]">
            
            {/* Hero block - Large */}
            <div className="col-span-12 lg:col-span-8 row-span-3 relative rounded-3xl bg-card/30 border border-border/30 overflow-hidden p-8 lg:p-12">
              <ConstellationMinimal region="corner" dotCount={40} />
              <div className="relative z-10 h-full flex flex-col justify-end">
                <h1 className="font-display text-5xl md:text-7xl font-light tracking-tight mb-4">
                  {profile.name.first}
                  <br />
                  <span className="text-primary">{profile.name.last.split(' ')[0]}</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  {profile.title} — {profile.tagline}
                </p>
              </div>
            </div>

            {/* Stats block */}
            <div className="col-span-12 lg:col-span-4 row-span-3 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-8 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Highlights</span>
              </div>
              <div className="space-y-6">
                {profile.highlights.map((h, i) => (
                  <div key={i}>
                    <div className="text-4xl font-display font-light text-foreground">{h.label}</div>
                    <div className="text-sm text-muted-foreground">{h.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* About block */}
            <div className="col-span-12 lg:col-span-6 row-span-2 rounded-3xl bg-card/20 border border-border/20 p-8">
              <h2 className="text-xs text-primary tracking-widest uppercase mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed">
                {profile.summary}
              </p>
            </div>

            {/* Skills interactive block */}
            <div className="col-span-12 lg:col-span-6 row-span-2 rounded-3xl bg-card/20 border border-border/20 p-8">
              <h2 className="text-xs text-primary tracking-widest uppercase mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.keys(skills).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveSkillCategory(cat)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      activeSkillCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {skills[activeSkillCategory as keyof typeof skills].map((skill) => (
                  <span key={skill} className="px-3 py-1.5 text-sm rounded-lg bg-card border border-border/50">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Philosophy cards */}
            {philosophy.map((p, i) => (
              <div
                key={i}
                className="col-span-6 lg:col-span-3 rounded-2xl bg-card/10 border border-border/10 p-6 hover:bg-card/20 hover:border-primary/20 transition-colors cursor-default"
              >
                <div className="text-xs text-primary/60 mb-2">0{i + 1}</div>
                <h3 className="font-medium text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground">{p.short}</p>
              </div>
            ))}

            {/* Experience timeline */}
            <div className="col-span-12 rounded-3xl bg-card/20 border border-border/20 p-8">
              <h2 className="text-xs text-primary tracking-widest uppercase mb-8">Experience</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {experiences.map((exp, i) => (
                  <div key={i} className="group">
                    <div className="flex items-center gap-3 mb-3">
                      {exp.logo ? (
                        <img src={exp.logo} alt="" className="w-8 h-8 object-contain opacity-60 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary/10" />
                      )}
                      <div className="text-xs text-muted-foreground">{exp.period}</div>
                    </div>
                    <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">{exp.role}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{exp.company}</p>
                    <p className="text-xs text-muted-foreground/70 line-clamp-2">
                      {exp.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="col-span-12 lg:col-span-6 rounded-3xl bg-card/20 border border-border/20 p-8">
              <h2 className="text-xs text-primary tracking-widest uppercase mb-6">Education</h2>
              <div className="space-y-4">
                {education.map((edu, i) => (
                  <div key={i} className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{edu.degree}</h3>
                      <p className="text-sm text-muted-foreground">{edu.school}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{edu.period}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA block */}
            <div className="col-span-12 lg:col-span-6 rounded-3xl bg-gradient-to-br from-foreground to-foreground/90 text-background p-8 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl mb-2">Let's connect</h2>
                <p className="text-background/70 text-sm">{profile.seeking}</p>
              </div>
              <a
                href={`mailto:${profile.email}`}
                className="flex items-center gap-2 px-6 py-3 bg-background text-foreground rounded-full hover:gap-3 transition-all shrink-0"
              >
                <Mail className="w-4 h-4" />
                Email me
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VariationE;
