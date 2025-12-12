import { GlassPanel } from './GlassPanel';

const experiences = [
  {
    role: 'Senior Software Engineer',
    company: 'Neural Systems Inc.',
    period: '2022 — Present',
    description: 'Architecting distributed AI systems and real-time data pipelines. Building interfaces that respond, adapt, and flow.',
  },
  {
    role: 'Full Stack Developer',
    company: 'Flow Dynamics',
    period: '2020 — 2022',
    description: 'Crafted interactive data visualizations and motion-driven interfaces for complex system monitoring.',
  },
  {
    role: 'Software Engineer',
    company: 'Sync Labs',
    period: '2018 — 2020',
    description: 'Developed synchronized multi-platform applications with focus on seamless state management.',
  },
];

const skills = [
  { category: 'Languages', items: ['TypeScript', 'Python', 'Rust', 'Go'] },
  { category: 'Systems', items: ['Distributed Architecture', 'Real-time Processing', 'ML Pipelines'] },
  { category: 'Tools', items: ['React', 'Node.js', 'TensorFlow', 'Kubernetes'] },
];

export const ExperienceSection = () => {
  return (
    <section className="relative py-32 px-6" style={{ zIndex: 10 }}>
      <div className="max-w-5xl mx-auto">
        {/* Section intro */}
        <div className="mb-20 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-light text-foreground mb-4">
            Background
          </h2>
          <p className="font-body text-muted-foreground font-light max-w-md mx-auto">
            A journey through systems that connect, process, and evolve.
          </p>
        </div>

        {/* Experience cards */}
        <div className="space-y-6 mb-20">
          {experiences.map((exp, index) => (
            <GlassPanel key={exp.company} delay={index * 150}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-display text-2xl text-foreground mb-1">
                    {exp.role}
                  </h3>
                  <p className="font-body text-primary/80 text-sm tracking-wide mb-3">
                    {exp.company}
                  </p>
                  <p className="font-body text-muted-foreground font-light text-sm leading-relaxed">
                    {exp.description}
                  </p>
                </div>
                <span className="font-body text-xs text-muted-foreground/50 tracking-wider shrink-0">
                  {exp.period}
                </span>
              </div>
            </GlassPanel>
          ))}
        </div>

        {/* Skills */}
        <GlassPanel delay={500}>
          <h3 className="font-display text-2xl text-foreground mb-8">
            Technical Fluency
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {skills.map((skill) => (
              <div key={skill.category}>
                <h4 className="font-body text-xs text-primary/70 tracking-widest uppercase mb-4">
                  {skill.category}
                </h4>
                <ul className="space-y-2">
                  {skill.items.map((item) => (
                    <li 
                      key={item} 
                      className="font-body text-muted-foreground font-light text-sm"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* Contact hint */}
        <div className="mt-20 text-center">
          <GlassPanel delay={700}>
            <p className="font-body text-muted-foreground/60 text-sm mb-4">
              Interested in collaboration?
            </p>
            <a 
              href="mailto:hello@alexchen.dev" 
              className="font-display text-2xl text-foreground hover:text-primary transition-colors duration-500 text-glow"
            >
              hello@alexchen.dev
            </a>
          </GlassPanel>
        </div>
      </div>
    </section>
  );
};
