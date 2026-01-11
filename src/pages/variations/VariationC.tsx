// Variation C: "SF Tech Resume"
// Single-page, information-dense but clean, recruiter-optimized
// Particles only as accent, extremely readable

import { profile, experiences, education, skills, philosophy } from "@/data/profile";
import { ConstellationMinimal } from "@/components/ui/constellation-minimal";
import { Github, Linkedin, Mail, MapPin, ExternalLink, Download } from "lucide-react";
import { Link } from "react-router-dom";

const VariationC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Subtle particle accent */}
      <div className="fixed inset-0 pointer-events-none">
        <ConstellationMinimal region="side" dotCount={25} />
      </div>

      {/* Sticky header with key info */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                ←
              </Link>
              <div>
                <h1 className="font-display text-xl font-medium">{profile.name.first} {profile.name.last.split(' ')[0]}</h1>
                <p className="text-sm text-muted-foreground">{profile.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Github className="w-4 h-4" />
              </a>
              <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href={`mailto:${profile.email}`} className="text-muted-foreground hover:text-foreground">
                <Mail className="w-4 h-4" />
              </a>
              <button className="flex items-center gap-2 px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity">
                <Download className="w-3 h-3" />
                Resume
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 relative z-10">
        {/* Hero summary */}
        <section className="mb-20">
          <div className="flex items-center gap-2 text-sm text-primary mb-4">
            <MapPin className="w-3 h-3" />
            <span>{profile.location}</span>
            <span className="mx-2">·</span>
            <span className="text-muted-foreground">{profile.seeking}</span>
          </div>
          <p className="text-xl md:text-2xl font-light text-foreground/90 max-w-3xl leading-relaxed">
            {profile.summary}
          </p>
          
          {/* Quick stats inline */}
          <div className="flex flex-wrap gap-8 mt-8">
            {profile.highlights.map((h, i) => (
              <div key={i} className="flex items-baseline gap-2">
                <span className="text-2xl font-display text-primary">{h.label}</span>
                <span className="text-sm text-muted-foreground">{h.description}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[2fr,1fr] gap-16">
          {/* Main content */}
          <div className="space-y-16">
            {/* Experience */}
            <section>
              <h2 className="text-sm font-medium text-foreground tracking-wider uppercase mb-8 flex items-center gap-3">
                <span className="w-8 h-px bg-primary" />
                Experience
              </h2>
              
              <div className="space-y-10">
                {experiences.map((exp, i) => (
                  <article key={i} className="group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-medium group-hover:text-primary transition-colors">
                          {exp.role}
                        </h3>
                        <p className="text-muted-foreground">
                          {exp.company}
                          {exp.logo && (
                            <img src={exp.logo} alt="" className="inline-block w-4 h-4 ml-2 opacity-50" />
                          )}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{exp.period}</div>
                        <div>{exp.location}</div>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      {exp.summary}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {exp.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Philosophy as compact list */}
            <section>
              <h2 className="text-sm font-medium text-foreground tracking-wider uppercase mb-8 flex items-center gap-3">
                <span className="w-8 h-px bg-primary" />
                Approach
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {philosophy.map((p, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-primary text-sm mt-0.5">→</span>
                    <div>
                      <h4 className="font-medium text-sm">{p.title}</h4>
                      <p className="text-sm text-muted-foreground">{p.short}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-12">
            {/* Education */}
            <section>
              <h2 className="text-sm font-medium text-foreground tracking-wider uppercase mb-6">
                Education
              </h2>
              <div className="space-y-4">
                {education.map((edu, i) => (
                  <div key={i}>
                    <h4 className="font-medium text-sm">{edu.degree}</h4>
                    <p className="text-sm text-muted-foreground">{edu.school}</p>
                    <p className="text-xs text-muted-foreground/70">{edu.period}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills by category */}
            <section>
              <h2 className="text-sm font-medium text-foreground tracking-wider uppercase mb-6">
                Technical Skills
              </h2>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase mb-2">Languages</h4>
                  <p className="text-sm">{skills.languages.join(" · ")}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase mb-2">Systems</h4>
                  <p className="text-sm">{skills.systems.join(" · ")}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase mb-2">Frontend</h4>
                  <p className="text-sm">{skills.frontend.join(" · ")}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase mb-2">Tools</h4>
                  <p className="text-sm">{skills.tools.join(" · ")}</p>
                </div>
              </div>
            </section>

            {/* Links */}
            <section>
              <h2 className="text-sm font-medium text-foreground tracking-wider uppercase mb-6">
                Links
              </h2>
              <div className="space-y-2">
                <a
                  href={profile.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Github className="w-3 h-3" />
                  GitHub
                  <ExternalLink className="w-2.5 h-2.5 ml-auto" />
                </a>
                <a
                  href={profile.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Linkedin className="w-3 h-3" />
                  LinkedIn
                  <ExternalLink className="w-2.5 h-2.5 ml-auto" />
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

export default VariationC;
