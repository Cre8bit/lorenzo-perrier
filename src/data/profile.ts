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
  seeking: "Open to San Francisco / Bay Area opportunities",
  email: "lorenzo.perrier@gmail.com",
  links: {
    github: "https://github.com/cre8bit",
    linkedin: "https://www.linkedin.com/in/lorenzoperrier/",
  },
  summary:
    "AI & Software engineer bridging modern AI and machine learning systems with production-grade software engineering.",
  highlights: [
    { label: "$30M+", description: "investment capital processed" },
    { label: "10+", description: "LLM agents orchestrated" },
    { label: "30k+", description: "users served" },
  ],
};

export const experiences = [
  {
    role: "Software Engineer",
    company: "Theodo",
    website: "https://www.theodo.com/",
    period: "Feb 2025 — Present",
    location: "Paris",
    summary:
      "Full-stack B2C platform for Bpifrance's €20M+ private equity fund serving 20k+ users. Async ID verification, parallel fund management, Defense Fund launch.",
    expandedContent:
      "The platform has experienced remarkable growth since launch, with funds collected accelerating from €1.8M in mid-October to over €20M by early December. This exponential trajectory reflects strong market demand and the effectiveness of our scalable architecture in handling increasing transaction volumes and user adoption. Applied Agile and Lean practices with weekly sprints and CI/CD pipelines.",
    tags: ["Angular", "Spring Boot", "TypeScript", "Java"],
    logo: "/logos/Logo_Theodo.png",
  },
  {
    role: "AI Technologies Intern",
    company: "BMW Group",
    website: "https://www.bmwgroup.com/",
    period: "May — Oct 2024",
    location: "Munich",
    summary:
      "Built multi-agent LLM system with 10+ agents for data querying. Designed execution-graph architecture with Plan-and-Execute approach. WebSocket APIs for real-time interaction.",
    expandedContent:
      "Dramatically improved data accessibility for BMW engineers by implementing a sophisticated multi-agent system capable of orchestrating 10+ specialized agents. Designed an execution-graph architecture to optimize LLM reasoning using a Plan-and-Execute approach, enabling complex queries to be decomposed and solved efficiently. Integrated the system into a production-ready web application using BMW's design library.",
    tags: ["LangGraph", "FastAPI", "React", "WebSocket"],
    logo: "/logos/BMW_logo.png",
  },
  {
    role: "CV Research Intern",
    company: "CTA & University of Sherbrooke",
    website: "https://www.usherbrooke.ca/",
    period: "May — Aug 2023",
    location: "Canada",
    summary:
      "Scene semantic segmentation for autonomous off-road vehicles using LiDAR. Integrated Ouster LiDAR with Nvidia Drive and real-time ML models.",
    expandedContent:
      "Conducted cutting-edge research on scene semantic segmentation for autonomous off-road navigation. Integrated high-resolution Ouster LiDAR sensors with Nvidia Drive platform, implementing state-of-the-art real-time segmentation models optimized for outdoor terrain classification and obstacle detection.",
    tags: ["LiDAR", "Computer Vision", "ML"],
  },
  {
    role: "3D & VR Consultant",
    company: "TAEP – ENSTA",
    website: "https://www.ensta-paris.fr/",
    period: "Nov 2022 — Jun 2023",
    location: "Paris",
    summary:
      "Created optimized 3D environments and VR experiences. Hosted virtual open house with 50+ participants in 3D replica of ENSTA Paris.",
    expandedContent:
      "Designed and developed immersive 3D environments and VR experiences optimized for cross-platform deployment. Successfully hosted a virtual open house event with 50+ concurrent participants exploring a meticulously crafted 3D replica of ENSTA Paris' campus, demonstrating expertise in real-time rendering optimization and multiplayer VR networking.",
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
