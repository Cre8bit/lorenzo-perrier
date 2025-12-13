import { GlassPanel } from "./GlassPanel";
import { FundGrowthChart } from "./FundGrowthChart";
import { useEffect, useRef, useState } from "react";

const fundGrowthData = [
  { date: "2025-10-13T00:00:00Z", amount: 1765500 },
  { date: "2025-10-20T00:00:00Z", amount: 2508700 },
  { date: "2025-10-27T00:00:00Z", amount: 4112200 },
  { date: "2025-11-03T00:00:00Z", amount: 5719600 },
  { date: "2025-11-10T00:00:00Z", amount: 7427300 },
  { date: "2025-11-17T00:00:00Z", amount: 8666800 },
  { date: "2025-11-24T00:00:00Z", amount: 10888100 },
  { date: "2025-12-01T00:00:00Z", amount: 17083900 },
  { date: "2025-12-08T00:00:00Z", amount: 20018600 },
];

const experiences = [
  {
    role: "Software Engineer",
    company: "Theodo",
    website: "#", // Add actual URL later
    period: "Feb. 2025 — Present",
    location: "Paris, France",
    description:
      "Developed a full-stack B2C web app for Bpifrance's €20M+ private equity platform serving 20k+ users. Enabled multiple parallel funds, asynchronous ID-verification workflow, and launch of €450M Defense Fund. Applied Agile and Lean practices, weekly sprints, CI/CD.",
    expandedContent:
      "The platform has experienced remarkable growth since launch, with funds collected accelerating from €1.8M in mid-October to over €20M by early December. This exponential trajectory reflects the strong market demand and the effectiveness of our scalable architecture in handling increasing transaction volumes and user adoption.",
    tags: ["Angular", "Spring Boot", "TypeScript", "Java"],
    showChart: true,
  },
  {
    role: "AI Technologies Intern",
    company: "BMW Group",
    website: "#", // Add actual URL later
    period: "May 2024 — Oct. 2024",
    location: "Munich, Germany",
    description:
      "Built a multi-agent data-querying system using LLMs supporting 10+ agents, dramatically improving data accessibility for BMW engineers. Designed an execution-graph architecture to optimize LLM reasoning using a Plan-and-Execute approach. Developed custom data tools, asynchronous APIs with WebSocket support for real-time interactions. Integrated the multi-agent system in a frontend web application using BMW's design library.",
    expandedContent:
      "Additional technical details about the LLM system architecture, performance metrics, or specific challenges overcome.",
    tags: ["LangGraph", "FastAPI", "Angular", "React", "WebSocket"],
    showChart: false,
  },
  {
    role: "Computer Vision Research Intern",
    company: "CTA & University of Sherbrooke",
    website: "#", // Add actual URL later
    period: "May 2023 — Aug. 2023",
    location: "Sherbrooke, Canada",
    description:
      "Conducted research on scene semantic segmentation for autonomous off-road vehicles using LiDAR data. Integrated Ouster LiDAR with Nvidia Drive and state-of-the-art real-time models.",
    expandedContent:
      "Research findings, model performance metrics, or technical implementation details.",
    tags: ["LiDAR", "Nvidia Drive", "Computer Vision"],
    showChart: false,
  },
  {
    role: "3D & Virtual Reality Consultant",
    company: "TAEP – ENSTA's Junior Enterprise",
    website: "#", // Add actual URL later
    period: "Nov. 2022 — June 2023",
    location: "Paris, France",
    description:
      "Created 3D environments and VR experiences optimized for cross-platform deployment. Hosted a virtual open house event with 50+ participants in a 3D replica of ENSTA Paris' premises.",
    expandedContent:
      "Details about the 3D models created, VR optimization techniques, or event feedback.",
    tags: ["Blender", "Unity", "VR"],
    showChart: false,
  },
  {
    role: "Software Engineer Intern",
    company: "Outsight",
    website: "#", // Add actual URL later
    period: "July 2022 — Aug. 2022",
    location: "Paris, France",
    description:
      "Developed a LiDAR simulator with traffic and path generation using Google Maps 3D models.",
    expandedContent:
      "Technical details about the simulator implementation, algorithms used, or performance metrics.",
    tags: ["Unity", "LiDAR"],
    showChart: false,
  },
];

const education = [
  {
    degree: "M.Sc. Artificial Intelligence & Advanced Visual Computing",
    school: "École Polytechnique",
    period: "2024 — 2025",
    location: "Paris, France",
    description: "Master's program focused on deep learning, computer vision, and advanced graphics.",
  },
  {
    degree: "Engineering Diploma (M.Eng)",
    school: "ENSTA Paris",
    period: "2021 — 2025",
    location: "Paris, France",
    description: "Multidisciplinary engineering with specialization in Computer Science and AI.",
  },
];

const skills = [
  { category: "Languages", items: ["TypeScript", "Python", "Rust", "Go"] },
  {
    category: "Systems",
    items: ["Distributed Architecture", "Real-time Processing", "ML Pipelines"],
  },
  {
    category: "Tools",
    items: ["React", "Node.js", "TensorFlow", "Kubernetes"],
  },
];

export const ExperienceSection = () => {
  const [activeSection, setActiveSection] = useState("about");
  const [isVisible, setIsVisible] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const contentHeightsRef = useRef<Map<number, number>>(new Map());
  const contentRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const aboutRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

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
    // Measure content heights after mount so we can animate to exact max-heights
    experiences.forEach((_, idx) => {
      const el = contentRefs.current.get(idx);
      if (el) {
        // reset any inline maxHeight to get natural scrollHeight
        el.style.maxHeight = "none";
        const h = el.scrollHeight;
        contentHeightsRef.current.set(idx, h);
        // collapse back
        el.style.maxHeight = "0px";
      }
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const aboutTop = aboutRef.current?.getBoundingClientRect().top || 0;
      const experienceTop =
        experienceRef.current?.getBoundingClientRect().top || 0;
      const projectsTop = projectsRef.current?.getBoundingClientRect().top || 0;

      const windowMid = window.innerHeight / 2;

      if (projectsTop < windowMid) {
        setActiveSection("projects");
      } else if (experienceTop < windowMid) {
        setActiveSection("experience");
      } else {
        setActiveSection("about");
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen px-6 py-32"
      style={{ zIndex: 10 }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
          {/* Left Fixed Sidebar */}
          <div className="lg:w-1/3 lg:sticky lg:top-32 lg:self-start">
            <div
              className={`transition-all duration-1000 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: "200ms" }}
            >
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-foreground mb-6">
                Lorenzo
              </h1>
              <h2 className="font-display text-2xl md:text-3xl font-light text-muted-foreground mb-12">
                Software & AI Engineer
              </h2>

              <nav className="space-y-4">
                {[
                  { id: "about", label: "About" },
                  { id: "experience", label: "Experience" },
                  { id: "projects", label: "Projects" },
                ].map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 transition-all duration-300 ${
                      activeSection === item.id
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    <div
                      className={`h-px transition-all duration-300 ${
                        activeSection === item.id
                          ? "w-16 bg-foreground"
                          : "w-8 bg-muted-foreground/40"
                      }`}
                    />
                    <span className="font-body text-xs tracking-widest uppercase">
                      {item.label}
                    </span>
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Right Scrollable Content */}
          <div className="lg:w-2/3 space-y-32">
            {/* About Section */}
            <div ref={aboutRef} id="about" className="scroll-mt-32">
              <p className="font-body text-muted-foreground font-light text-lg leading-relaxed mb-8">
                Passionate software engineer and AI enthusiast with hands-on
                experience in LLM systems, real-time ML, and 3D/VR development.
                I thrive in fast-paced, purpose-driven teams where ambition
                meets action. I am skilled in building scalable, user-focused
                systems from backend APIs to immersive interfaces. Always open
                to opportunities where strong vision meets real-world impact! My
                background combines a solid academic foundation in AI/ML with
                strong software development skills, honed through valuable
                professional experiences at leading companies such as BMW Group,
                Outsight and Theodo.
              </p>
            </div>

            {/* Experience Section with Timeline */}
            <div
              ref={experienceRef}
              id="experience"
              className="scroll-mt-32"
            >
              <h3 className="font-display text-3xl text-foreground mb-12">Experience</h3>
              
              {/* Timeline container */}
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-0 top-0 bottom-0 w-px">
                  <div className="h-full bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
                </div>
                
                {/* Experience items */}
                <div className="space-y-8">
                  {experiences.map((exp, index) => {
                    const isExpanded = expandedCards.has(index);
                    return (
                      <div key={exp.company} className="relative pl-8">
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-2 -translate-x-1/2">
                          <div className="relative">
                            {/* Glow */}
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary/30 blur-sm" />
                            {/* Dot */}
                            <div className="w-3 h-3 rounded-full bg-primary/60 border border-primary/40" />
                          </div>
                        </div>
                        
                        <GlassPanel delay={index * 150}>
                          <div className="flex flex-col gap-4">
                            <span className="font-body text-xs text-primary/70 tracking-wider font-medium">
                              {exp.period}
                            </span>
                            <div>
                              <h3 className="font-display text-2xl text-foreground mb-1">
                                {exp.role}
                              </h3>
                              <p className="font-body text-sm tracking-wide mb-3">
                                <a
                                  href={exp.website}
                                  className="text-primary/80 hover:text-primary transition-all duration-300 relative inline-block group"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <span className="relative">
                                    {exp.company}
                                    <span className="absolute bottom-0 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
                                  </span>
                                </a>
                                <span className="text-muted-foreground/60">
                                  {" "}
                                  · {exp.location}
                                </span>
                              </p>
                              <p className="font-body text-muted-foreground font-light text-sm leading-relaxed mb-2">
                                {exp.description}
                              </p>

                              {/* Read More / Show Less Button */}
                              <button
                                onClick={() => toggleExpanded(index)}
                                className="group font-body text-xs text-primary/50 hover:text-primary tracking-wide mb-4 inline-flex items-center gap-2 transition-all duration-500"
                              >
                                <span>{isExpanded ? "Show less" : "Show more"}</span>
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

                              {/* Expanded Content */}
                              <div
                                ref={(el) => contentRefs.current.set(index, el)}
                                className="overflow-hidden mb-4"
                                style={{
                                  maxHeight: isExpanded
                                    ? `${contentHeightsRef.current.get(index) ?? 480}px`
                                    : "0px",
                                  opacity: isExpanded ? 1 : 0,
                                  transform: isExpanded
                                    ? "translateY(0)"
                                    : "translateY(-6px)",
                                  transition:
                                    "max-height 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 450ms ease, transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
                                }}
                              >
                                <div className="pt-2 pb-2">
                                  <p className="font-body text-muted-foreground/80 font-light text-sm leading-relaxed mb-4">
                                    {exp.expandedContent}
                                  </p>
                                  {exp.showChart && (
                                    <FundGrowthChart
                                      data={fundGrowthData}
                                      isVisible={isExpanded}
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Tech Tags */}
                              <div className="flex flex-wrap gap-2">
                                {exp.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="font-body text-xs px-3 py-1 rounded-full bg-primary/10 text-primary/80 border border-primary/20"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </GlassPanel>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Education Section */}
            <div className="scroll-mt-32">
              <h3 className="font-display text-3xl text-foreground mb-12">Education</h3>
              
              {/* Timeline container */}
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-0 top-0 bottom-0 w-px">
                  <div className="h-full bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
                </div>
                
                {/* Education items */}
                <div className="space-y-8">
                  {education.map((edu, index) => (
                    <div key={edu.school + edu.degree} className="relative pl-8">
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-2 -translate-x-1/2">
                        <div className="relative">
                          {/* Glow */}
                          <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary/30 blur-sm" />
                          {/* Dot */}
                          <div className="w-3 h-3 rounded-full bg-primary/60 border border-primary/40" />
                        </div>
                      </div>
                      
                      <GlassPanel delay={index * 150 + 600}>
                        <div className="flex flex-col gap-3">
                          <span className="font-body text-xs text-primary/70 tracking-wider font-medium">
                            {edu.period}
                          </span>
                          <div>
                            <h4 className="font-display text-xl text-foreground mb-1">
                              {edu.degree}
                            </h4>
                            <p className="font-body text-sm text-primary/80 mb-2">
                              {edu.school}
                              <span className="text-muted-foreground/60"> · {edu.location}</span>
                            </p>
                            <p className="font-body text-muted-foreground font-light text-sm leading-relaxed">
                              {edu.description}
                            </p>
                          </div>
                        </div>
                      </GlassPanel>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills */}
            <GlassPanel delay={800}>
              <h3 className="font-display text-2xl text-foreground mb-8">
                Technical Fluency
              </h3>
              <div className="grid gap-8">
                {skills.map((skill) => (
                  <div key={skill.category}>
                    <h4 className="font-body text-xs text-primary/70 tracking-widest uppercase mb-4">
                      {skill.category}
                    </h4>
                    <ul className="flex flex-wrap gap-3">
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

            {/* Projects Section */}
            <div ref={projectsRef} id="projects" className="scroll-mt-32">
              <GlassPanel delay={700}>
                <h3 className="font-display text-2xl text-foreground mb-8">
                  Selected Work
                </h3>
                <p className="font-body text-muted-foreground/60 text-sm mb-4">
                  Interested in collaboration?
                </p>
                <a
                  href="mailto:hello@lorenzo.dev"
                  className="font-display text-2xl text-foreground hover:text-primary transition-colors duration-500 text-glow"
                >
                  hello@lorenzo.dev
                </a>
              </GlassPanel>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
