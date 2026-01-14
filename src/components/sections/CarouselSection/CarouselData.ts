export interface CarouselContext {
  id: string;
  title: string;
  problem: string;
  signals: string[];
  visualType: "flow" | "network" | "layers";
  // Back card content
  backTitle: string;
  backDetails: string[];
  // Optional: Editorial / Logo info
  companyLine?: string; // e.g., "Bpifrance - B2C Platform"
  logoUrl?: string;
}

export const carouselContexts: CarouselContext[] = [
  {
    id: "production",
    title: "Production Systems at Scale",
    problem:
      "Evolving live B2C platform to support parallel workflows without compounding operational complexity.",
    signals: ["async workflows", "scale", "constraints"],
    visualType: "flow",
    backTitle: "What this looks like",
    backDetails: [
      "Introducing asynchronous ID verification tracks.",
      "Restructuring the flow to support multiple investment assets running in parallel.",
      "Shaping architecture complexity to match real product needs and delivery constraints.",
    ],
    companyLine: "Bpifrance — Investing Platform",
    logoUrl: "logos/logo_BPI.png",
  },
  {
    id: "intelligence",
    title: "AI & Agent-based Systems",
    problem:
      "Turning experimental LLM reasoning workflows into reliable, executable systems.",
    signals: ["agents", "reasoning", "execution"],
    visualType: "network",
    backTitle: "What this looks like",
    backDetails: [
      "Structuring multi-agent systems by separating planning, execution, and tool invocation.",
      "Designing agent tools to safely query and reason over internal engineering databases.",
      "Making LLM reasoning steps observable, interruptible, and debuggable in real time.",
    ],
    companyLine: "BMW Group — LLM Reasoning",
    logoUrl: "logos/BMW_logo.png",
  },
  {
    id: "perception",
    title: "Perception & Real-time",
    problem:
      "Designing systems where latency, accuracy, and resources must be balanced continuously.",
    signals: ["LiDAR", "physics", "real-time"],
    visualType: "layers",
    backTitle: "What this looks like",
    backDetails: [
      "Optimizing models and applications to meet strict real-time performance budgets.",
      "Designing spatial data pipelines where latency directly affects perception and interaction.",
      "Balancing model complexity, accuracy, and responsiveness under hardware constraints.",
    ],
    companyLine:
      "Applied across VR & Simulation",
  },
];

export const sectionTitle = "Where this mindset is applied";
