// Variation selector page - links to all 5 design variations

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const variations = [
  {
    id: "a",
    name: "Editorial Minimal",
    description: "Clean two-column layout with particles in corner, strong typography focus, recruiter-friendly structure.",
  },
  {
    id: "b",
    name: "Immersive Dark",
    description: "Full particle background with glass cards, atmospheric and artistic, content emerges from the field.",
  },
  {
    id: "c",
    name: "SF Tech Resume",
    description: "Information-dense single page, extremely readable, optimized for quick scanning by recruiters.",
  },
  {
    id: "d",
    name: "Stacked Timeline",
    description: "Career journey as ascending stacked cards, teal color scheme, career path visualization.",
  },
  {
    id: "e",
    name: "Bento Grid",
    description: "Modern bento-box layout with mixed content blocks, particles as hero accent, interactive skills.",
  },
];

const VariationsIndex = () => {
  return (
    <div className="min-h-screen bg-background text-foreground px-8 py-16">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-12 inline-block">
          ← Back to original
        </Link>
        
        <h1 className="font-display text-4xl md:text-5xl font-light mb-4">
          Design Variations
        </h1>
        <p className="text-muted-foreground text-lg mb-16">
          5 different approaches to the portfolio design. Each keeps the particle aesthetic while exploring different layouts and information architecture.
        </p>

        <div className="space-y-6">
          {variations.map((v) => (
            <Link
              key={v.id}
              to={`/variations/${v.id}`}
              className="group block p-8 rounded-2xl border border-border/30 hover:border-primary/30 hover:bg-card/20 transition-all"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-primary/60 font-mono uppercase">
                      Var {v.id.toUpperCase()}
                    </span>
                    <h2 className="font-display text-xl group-hover:text-primary transition-colors">
                      {v.name}
                    </h2>
                  </div>
                  <p className="text-muted-foreground">{v.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VariationsIndex;
