export interface PhilosophyItem {
  title: string;
  subtitle: string;
  description: string;
  keyword: string; // The word that will glow on hover
}

export const philosophyItems: PhilosophyItem[] = [
  {
  title: "Systems & Architecture",
  subtitle: "Scale & Structure",
  description:
    "I design scalable, maintainable systems with a clear understanding of their constraints — from software to hardware.",
  keyword: "structure",
},
{
  title: "User-Centered Systems",
  subtitle: "Utility & Ergonomics",
  description:
    "I build systems that serve users first: practical, intuitive, and reliable in real-world conditions.",
  keyword: "users",
},
{
  title: "Intelligence & Reasoning",
  subtitle: "AI & Systems",
  description:
    "I engineer intelligent systems that reason, adapt, and leverage state-of-the-art techniques responsibly.",
  keyword: "intelligent",
},
{
  title: "Flow & Real-Time",
  subtitle: "State & Reactivity",
  description:
    "I design reactive systems where data, state, and decisions flow continuously and respond in real time.",
  keyword: "flow",
},
];
