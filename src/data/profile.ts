// Centralized profile data for all portfolio variations

export const profile = {
  name: {
    first: "Lorenzo",
    last: "Perrier de La Bâthie",
    full: "Lorenzo Perrier de La Bâthie",
  },
  title: "Software & AI Engineer",
  tagline: "Building systems that think, scale, and ship.",
  location: "Paris, France",
  seeking: "Open to SF / Bay Area opportunities",
  email: "lorenzo@example.com",
  links: {
    github: "https://github.com/cre8bit",
    linkedin: "https://www.linkedin.com/in/lorenzoperrier/",
  },
  summary:
    "Software engineer with deep experience in AI/ML systems, real-time processing, and production-grade applications. From multi-agent LLM architectures at BMW to scaled B2C platforms at Bpifrance, I build systems that work in the real world.",
  highlights: [
    { label: "€20M+", description: "funds collected on platform" },
    { label: "10+", description: "LLM agents orchestrated" },
    { label: "20k+", description: "users served" },
  ],
};

export const experiences = [
  {
    role: "Software Engineer",
    company: "Theodo",
    period: "Feb 2025 — Present",
    location: "Paris",
    summary:
      "Full-stack B2C platform for Bpifrance's €20M+ private equity fund serving 20k+ users. Async ID verification, parallel fund management, Defense Fund launch.",
    tags: ["Angular", "Spring Boot", "TypeScript", "Java"],
    logo: "/logos/logo_BPI.png",
  },
  {
    role: "AI Technologies Intern",
    company: "BMW Group",
    period: "May — Oct 2024",
    location: "Munich",
    summary:
      "Built multi-agent LLM system with 10+ agents for data querying. Designed execution-graph architecture with Plan-and-Execute approach. WebSocket APIs for real-time interaction.",
    tags: ["LangGraph", "FastAPI", "React", "WebSocket"],
    logo: "/logos/BMW_logo.png",
  },
  {
    role: "CV Research Intern",
    company: "CTA & University of Sherbrooke",
    period: "May — Aug 2023",
    location: "Canada",
    summary:
      "Scene semantic segmentation for autonomous off-road vehicles using LiDAR. Integrated Ouster LiDAR with Nvidia Drive and real-time ML models.",
    tags: ["LiDAR", "Computer Vision", "ML"],
  },
  {
    role: "3D & VR Consultant",
    company: "TAEP – ENSTA",
    period: "Nov 2022 — Jun 2023",
    location: "Paris",
    summary:
      "Created optimized 3D environments and VR experiences. Hosted virtual open house with 50+ participants in 3D replica of ENSTA Paris.",
    tags: ["Unity", "Blender", "VR"],
  },
];

export const education = [
  {
    degree: "M.Sc. AI & Visual Computing",
    school: "École Polytechnique",
    period: "2024 — 2025",
  },
  {
    degree: "M.Eng Engineering Diploma",
    school: "ENSTA Paris",
    period: "2021 — 2025",
  },
];

export const skills = {
  languages: ["TypeScript", "Python", "Rust", "Go", "Java"],
  systems: ["Distributed Systems", "Real-time ML", "LLM Orchestration"],
  frontend: ["React", "Angular", "Three.js"],
  tools: ["Kubernetes", "FastAPI", "LangGraph"],
};

export const philosophy = [
  {
    title: "Systems & Architecture",
    short: "Built to scale. Built to last.",
  },
  {
    title: "User-Centered Systems",
    short: "Production is the product.",
  },
  {
    title: "AI in Production",
    short: "AI belongs in systems, not notebooks.",
  },
  {
    title: "Reactivity & Adaptation",
    short: "Systems improve through continuous response.",
  },
];
