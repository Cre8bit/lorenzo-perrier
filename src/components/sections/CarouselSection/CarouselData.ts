export interface CarouselContext {
  id: string;
  title: string;
  problem: string;
  signals: string[];
  visualType: "flow" | "network" | "layers";
  // Back card content
  backTitle: string;
  backDetails: string[];
}

export const carouselContexts: CarouselContext[] = [
  {
    id: "production",
    title: "Production Systems at Scale",
    problem:
      "Evolving live systems to support parallel workflows without compounding operational complexity.",
    signals: ["async workflows", "scale", "constraints"],
    visualType: "flow",
    backTitle: "What this looks like",
    backDetails: [
      "Introducing asynchronous ID verification tracks.",
      "Restructuring the flow to support multiple investment assets running in parallel.",
      "Shaping architecture complexity to match real product needs and delivery constraints.",
    ],
  },
  {
    id: "intelligence",
    title: "Intelligent & Agent-based Systems",
    problem:
      "Designing reasoning architectures where agents coordinate, adapt, and execute with precision.",
    signals: ["agents", "execution graphs", "real-time"],
    visualType: "network",
    backTitle: "What this looks like",
    backDetails: [
      "Multi-agent coordination with shared memory",
      "Dynamic task graphs with real-time replanning",
      "Hybrid reasoning: symbolic + neural approaches",
    ],
  },
  {
    id: "perception",
    title: "Perception & Real-time Constraints",
    problem:
      "Creating systems that perceive, process, and respond faster than conscious thought.",
    signals: ["LiDAR", "physics", "real-time"],
    visualType: "layers",
    backTitle: "What this looks like",
    backDetails: [
      "Sub-millisecond sensor fusion pipelines",
      "GPU-accelerated point cloud processing",
      "Predictive state estimation under uncertainty",
    ],
  },
];

export const sectionTitle = "Where this mindset is applied";
