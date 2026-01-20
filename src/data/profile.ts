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
  quote:
    "I enjoy building AI systems that move past experimentation and become part of real products.",
  highlights: [
    { label: "$50M+", description: "raised on platform" },
    { label: "20+", description: "LLM agents orchestrated" },
    { label: "35k+", description: "users served" },
  ],
};

export const experiences = [
  {
    role: "Software Engineer",
    company: "Theodo",
    website: "https://www.theodo.com/",
    period: "Feb 2025 — Present",
    location: "Paris, France",
    summary:
      "Full-stack B2C platform for Bpifrance's private equity investment funds.",
    summaryLink: "https://fonds-entreprises.bpifrance.fr/",
    expandedContent: {
      description:
        "Contributed to the evolution of a live, regulated B2C investment platform serving tens of thousands of users.<br><br>Focused on enabling parallel fund lifecycles and asynchronous identity verification workflows, while maintaining reliability and user clarity under increasing scale.<br><br>Took ownership of architectural and quality-critical topics, improving CI stability, navigation robustness, and data-fetching strategies to reduce unnecessary backend load and improve perceived performance in real usage conditions.",
      keyContributions: [
        "Designed AI agent workflows around a “right the first time” philosophy, with feedback loops that enabled continuous improvement and faster team delivery.",
        "Integrated complex, state-driven identity verification flows within a single-page architecture.",
        "Improved platform performance and UX by simplifying navigation logic and eliminating redundant data fetching.",
      ],
    },
    tags: ["Angular", "Spring Boot", "TypeScript", "Java"],
    logo: "/Logo_Theodo.png",
  },
  {
    role: "AI Engineer",
    company: "BMW Group",
    website: "https://www.bmwgroup.com/",
    period: "May — Oct 2024",
    location: "Munich, Germany",
    summary:
      "Plan-and-execute multi-agent LLM system for internal data access.",
    expandedContent: {
      description:
        "Designed a multi-agent LLM system to improve access to complex internal engineering data.<br><br>The system relied on an explicit plan-and-execute execution graph, enabling queries to be decomposed, coordinated across specialized agents, and resolved efficiently.<br><br>Emphasis was placed on reasoning structure, real-time interaction, and integration into a production-ready web interface used by engineers in daily workflows.",
      keyContributions: [
        "Orchestrated multiple specialized agents to handle complex, domain-specific queries over dense engineering data.",
        "Built real-time interaction layers using asynchronous APIs and WebSocket-based communication.",
      ],
    },
    tags: ["LangGraph", "FastAPI", "Angular", "WebSocket"],
    logo: "/BMW_logo.png",
  },
  {
    role: "Computer Vision Research",
    company: "CTA & University of Sherbrooke",
    website: "https://www.cta-brp-udes.com/",
    period: "May — Aug 2023",
    location: "Sherbrooke, Canada",
    summary:
      "Real-time LiDAR perception system for autonomous off-road vehicles.",
    expandedContent: {
      description:
        "Worked on real-time perception pipelines for autonomous off-road navigation using LiDAR data.<br><br>The focus was on semantic scene understanding under outdoor constraints, combining high-resolution sensor integration with machine learning models optimized for latency and robustness.<br><br>Emphasis was placed on bridging perception research and deployable systems, ensuring models and pipelines could operate reliably in real driving conditions.",
      keyContributions: [
        "Integrated high-resolution Ouster LiDAR sensors with the Nvidia Drive platform.",
        "Adapted real-time perception models to meet latency and robustness constraints in outdoor environments.",
      ],
    },
    tags: ["LiDAR", "Computer Vision", "ML"],
    logo: "/BRP_logo.png",
  },
  {
    role: "3D & VR Consultant",
    company: "TAEP – ENSTA",
    website:
      "https://www.ensta.fr/campus/vie-associative/clubs-et-associations/taep",
    period: "Nov 2022 — Jun 2023",
    location: "Paris, France",
    summary:
      "Optimized real-time 3D environments for virtual reality experiences.",
    expandedContent: {
      description:
        "Designed and built real-time 3D environments for immersive virtual reality experiences.<br><br>The work focused on rendering performance, interaction fidelity, and cross-platform constraints, ensuring environments remained responsive under multi-user conditions.<br><br>This included delivering a large-scale virtual open house, where dozens of participants explored a shared 3D space in real time.",
      keyContributions: [
        "Designed and optimized real-time 3D environments for VR across different hardware constraints.",
        "Built a shared virtual space supporting dozens of concurrent users in real time.",
        "Modeled and integrated a detailed 3D replica of a physical campus for interactive exploration.",
      ],
    },
    tags: ["Unity", "Blender", "VR"],
    logo: "/taep_logo.png",
  },
  {
    role: "Software Engineer",
    company: "OUTSIGHT",
    website: "https://www.outsight.ai/",
    period: "Jul 2022 - Aug 2022",
    location: "Paris, France",
    summary: "Interactive LiDAR visualization and simulation platform.",
    expandedContent: {
      description:
        "Worked on interactive visualization tools for LiDAR-based spatial intelligence systems.<br><br>The focus was on simulating realistic environments and motion patterns, enabling clearer interpretation of LiDAR data in dynamic scenarios.<br><br>This involved bridging algorithmic logic and real-time rendering to support exploratory and debugging workflows around sensor data.",
      keyContributions: [
        "Developed interactive LiDAR visualization features within a real-time 3D environment.",
        "Implemented traffic and motion simulations to model dynamic LiDAR scenes.",
        "Translated algorithmic prototypes into production-ready components for real-time execution.",
      ],
    },
    tags: ["Unity", "C#", "LiDAR"],
    logo: "/outsight_logo.jpeg",
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
