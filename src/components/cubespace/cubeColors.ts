export const CUBE_COLORS = [
  "hsl(12, 70%, 52%)",
  "hsl(34, 40%, 50%)",
  "hsl(57, 75%, 52%)",
  "hsl(79, 60%, 50%)",
  "hsl(102, 45%, 48%)",
  "hsl(125, 45%, 46%)",
  "hsl(147, 35%, 45%)",
  "hsl(170, 40%, 45%)",
  "hsl(192, 55%, 58%)",
  "hsl(215, 35%, 50%)",
  "hsl(237, 35%, 55%)",
  "hsl(260, 30%, 55%)",
  "hsl(282, 45%, 60%)",
  "hsl(305, 50%, 58%)",
  "hsl(327, 55%, 55%)",
  "hsl(350, 35%, 50%)",
];

export const getRandomColor = () =>
  CUBE_COLORS[Math.floor(Math.random() * CUBE_COLORS.length)];
