import { useEffect, useState } from "react";

interface DataPoint {
  date: string;
  amount: number;
}

interface FundGrowthChartProps {
  data: DataPoint[];
  isVisible: boolean;
}

export const FundGrowthChart = ({ data, isVisible }: FundGrowthChartProps) => {
  const [animatedBars, setAnimatedBars] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isVisible) {
      setAnimatedBars(new Set());
      return;
    }

    // Stagger the animation of each bar
    data.forEach((_, index) => {
      setTimeout(() => {
        setAnimatedBars((prev) => new Set([...prev, index]));
      }, index * 80);
    });
  }, [isVisible, data]);

  const maxAmount = Math.max(...data.map((d) => d.amount));

  const formatAmount = (amount: number) => {
    return `€${(amount / 1_000_000).toFixed(1)}M`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="w-full py-6">
      <div className="flex items-end justify-between gap-2 h-48">
        {data.map((point, index) => {
          const heightPercent = (point.amount / maxAmount) * 100;
          const isAnimated = animatedBars.has(index);

          return (
            <div
              key={point.date}
              className="flex-1 flex flex-col items-center gap-2"
            >
              {/* Bar */}
              <div className="relative w-full h-40 flex items-end">
                {/* Bar */}
                <div
                  className="w-full rounded-t-md relative"
                  style={{
                    height: isAnimated ? `${heightPercent}%` : "0%",
                    transition: `height 600ms cubic-bezier(0.22, 1, 0.36, 1) ${
                      index * 80
                    }ms`,
                    background:
                      "linear-gradient(to top, rgba(59, 130, 246, 0.6), rgba(96, 165, 250, 0.3))",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(96, 165, 250, 0.3)",
                  }}
                >
                  {/* Value pinned to THIS bar's top */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 -top-6 text-xs font-body text-foreground/90 font-medium"
                    style={{
                      opacity: isAnimated ? 1 : 0,
                      transform: isAnimated
                        ? "translate(-50%, 0)"
                        : "translate(-50%, -4px)",
                      transition: `opacity 400ms ease-out ${
                        index * 80 + 600
                      }ms, transform 400ms ease-out ${index * 80 + 600}ms`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatAmount(point.amount)}
                  </div>

                  {/* Shimmer effect */}
                  <div
                    className="absolute inset-0 opacity-0"
                    style={{
                      background:
                        "linear-gradient(to top, transparent, rgba(255,255,255,0.2), transparent)",
                      animation: isAnimated
                        ? "shimmer 1.5s ease-in-out"
                        : "none",
                      animationDelay: `${index * 80 + 300}ms`,
                    }}
                  />
                </div>
              </div>

              {/* Date label */}
              <span
                className="text-xs font-body text-muted-foreground/60 whitespace-nowrap"
                style={{
                  opacity: isAnimated ? 1 : 0,
                  transition: `opacity 400ms ease ${index * 80 + 400}ms`,
                }}
              >
                {formatDate(point.date)}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
