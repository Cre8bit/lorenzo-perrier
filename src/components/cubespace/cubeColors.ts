export const CUBE_COLORS = [
  "hsl(185, 40%, 45%)",
  "hsl(220, 35%, 50%)",
  "hsl(260, 30%, 55%)",
  "hsl(340, 35%, 50%)",
  "hsl(30, 40%, 50%)",
  "hsl(160, 35%, 45%)",
  "hsl(45, 75%, 52%)",
  "hsl(12, 70%, 52%)",
  "hsl(200, 55%, 58%)",
  "hsl(280, 45%, 60%)",
  "hsl(95, 45%, 48%)",
  "hsl(325, 55%, 55%)",
];

export const getRandomColor = () =>
  CUBE_COLORS[Math.floor(Math.random() * CUBE_COLORS.length)];
