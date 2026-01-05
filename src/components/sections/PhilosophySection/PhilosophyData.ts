export interface PhilosophyItem {
  title: string;
  subtitle: string;
  description: string;
  keywords: string[]; // Words that will glow on hover
}

export const philosophyItems: PhilosophyItem[] = [
  {
  title: "Systems & Architecture",
  subtitle: "Structure in Design",
  description:
    "Built to scale. Built to last.",
  keywords: ["scale", "last"],
},
{
  title: "User-Centered Systems",
  subtitle: "Shipping to Reality",
  description:
    "Production is the product.",
  keywords: ["Production", "product"],
},
{
  title: "AI & Production",
  subtitle: "From Research to Execution",
  description:
    "AI belongs in systems, not notebooks.",
  keywords: ["systems", "AI"],
},
{
  title: "Reactivity & Adaptation",
  subtitle: "Time as a Dimension",
  description:
    "Systems improve through continuous response.",
  keywords: ["continuous", "improve"],
},
];
