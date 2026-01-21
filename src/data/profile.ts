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
  quote2: "Off-screen: slacklining, bouldering, playing the piano and learning (paragliding soon!).",
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
    period: "Feb 2025 - Present",
    location: "Paris, France",
    summary:
      "Full-stack B2C platform for Bpifrance's private equity investment funds.",
    summaryLink: "https://fonds-entreprises.bpifrance.fr/",
    expandedContent: {
      description:
        "Worked on a live, regulated B2C investment platform serving tens of thousands of users, contributing to platform changes that enabled the launch of the $500M Defense Fund.<br><br>The platform supports end-to-end digital onboarding, investment workflows, and regulatory compliance for private equity funds.",
      keyContributions: [
        "Enabled parallel fund lifecycles and asynchronous identity verification workflows under scale.",
        "Owned architectural and quality-critical topics, stabilizing CI workflows, simplifying navigation logic and removing redundant data fetching.",
        "Designed AI agent workflows following a “right the first time” philosophy, with feedback loops improving reliability and team delivery.",
        "Supported team adoption of AI coding agents through internal documentation, knowledge sharing, and hands-on enablement.",
      ],
    },
    tags: ["Angular", "Spring Boot", "TypeScript", "Java"],
    logo: "Logo_Theodo.png",
  },
  {
    role: "AI Engineer",
    company: "BMW Group",
    website: "https://www.bmwgroup.com/",
    period: "May - Oct 2024",
    location: "Munich, Germany",
    summary:
      "Plan-and-execute multi-agent LLM system for internal data access.",
    expandedContent: {
      description:
        "Designed a multi-agent LLM system as an early adoption of agentic AI, centered on structured reasoning over complex internal engineering data.<br><br>Implemented a plan-and-execute execution graph coordinating specialized agents across multiple data sources, allowing real-time interaction in a production web interface.",
      keyContributions: [
        "Research and implementation of agentic reasoning loops (ReAct, CoT) using LangGraph.",
        "Orchestrated multiple specialized agents to handle complex, domain-specific queries over dense engineering data.",
        "Built real-time interaction layers using asynchronous APIs and WebSocket-based communication.",
      ],
    },
    tags: ["LangGraph", "FastAPI", "Angular", "WebSocket"],
    logo: "BMW_logo.png",
  },
  {
    role: "Computer Vision Research",
    company: "CTA & Bombardier Recreational Products",
    website: "https://www.cta-brp-udes.com/",
    period: "May - Aug 2023",
    location: "Sherbrooke, Canada",
    summary:
      "Real-time LiDAR perception system for autonomous off-road vehicles.",
    expandedContent: {
      description:
        "Worked on real-time perception pipelines for autonomous off-road navigation using LiDAR data.<br><br>The focus was on semantic scene understanding under outdoor constraints, combining high-resolution sensor integration with machine learning models optimized for latency and robustness.",
      keyContributions: [
        "Integrated high-resolution Ouster LiDAR sensors with the Nvidia Drive platform.",
        "Adapted real-time perception models (PointNet, VoxelNet) to meet latency and robustness constraints in outdoor environments.",
      ],
    },
    tags: ["LiDAR", "Computer Vision", "ML"],
    logo: "BRP_logo.png",
  },
  {
    role: "3D & VR Consultant",
    company: "TAEP - ENSTA",
    website:
      "https://www.ensta.fr/campus/vie-associative/clubs-et-associations/taep",
    period: "Nov 2022 - Jun 2023",
    location: "Paris, France",
    summary:
      "Optimized real-time 3D environments for virtual reality experiences.",
    expandedContent: {
      description:
        "Worked for different clients to design and build real-time 3D environments of their premises for immersive virtual reality experiences.",
      keyContributions: [
        "Designed and optimized real-time 3D environments for crossplatform.",
        "Hosted a virtual open house, allowing 50+ participants to explore the school's premises and discover its programs.",
        "Modeled and integrated a detailed 3D replica of ELITYS physical premises for interactive exploration.",
      ],
    },
    tags: ["Unity", "Blender", "VR"],
    logo: "taep_logo.png",
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
        "Worked on an interactive visualization tool for LiDAR-based spatial intelligence systems.<br><br>The focus was on simulating realistic environments and motion patterns, allowing clients to preview how LiDAR sensors would behave in their specific setups.",
      keyContributions: [
        "Implemented traffic and motion simulations using Bézier curves and path generation to model dynamic LiDAR scenes.",
      ],
    },
    tags: ["Unity", "C#", "LiDAR"],
    logo: "outsight_logo.jpeg",
  },
];

export const education = [
  {
    degree: "M.Sc. Artificial Intelligence",
    school: "Institut Polytechnique de Paris",
    period: "2024 - 2025",
  },
  {
    degree: "M.Eng Engineering Diploma",
    school: "ENSTA Paris",
    period: "2021 - 2025",
  },
];

export const skills = {
  languages: ["Python", "Rust", "TypeScript", "Java", "C++"],
  stacks: ["Angular", "React", "Spring Boot", "FastAPI", "Firebase", "Three.js"],
  tools: ["Docker", "Datadog", "Kafka", "GitHub Copilot", "Claude Code"],
  MLtools: ["Pytorch", "TensorFlow", "CUDA", "LangGraph"],
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
