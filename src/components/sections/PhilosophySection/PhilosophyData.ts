export interface PhilosophyItem {
  title: string;
  subtitle: string;
  description: string;
  keyword: string; // The word that will glow on hover
}

export const philosophyItems: PhilosophyItem[] = [
  {
    title: "What I Build",
    subtitle: "Systems & Architecture",
    description: "I design systems that remain coherent as they scale.",
    keyword: "coherent",
  },
  {
    title: "Flow & Synchronization",
    subtitle: "Motion & Intent",
    description: "I build interfaces that move with intention, not against it.",
    keyword: "intention",
  },
  {
    title: "Intelligence & Reasoning",
    subtitle: "AI & Precision",
    description: "I shape AI systems that think clearly and act precisely.",
    keyword: "precisely",
  },
  {
    title: "Real-time & Perception",
    subtitle: "Response & Anticipation",
    description:
      "I create experiences that respond before you realize they should.",
    keyword: "respond",
  },
];
