import { useEffect, type RefObject } from "react";

export type ScrollProgressFn = (progress: number, el: HTMLElement) => void;

interface Options {
  /** Viewport fraction the element must traverse to go 0 → 1. */
  leadVh?: number;
  /** Stop listening once progress first reaches 1. */
  settleOnce?: boolean;
  /** IO rootMargin used to gate scroll work (ignored when `gate` is false). */
  rootMargin?: string;
  /** Skip entirely (e.g. prefers-reduced-motion). */
  disabled?: boolean;
  /**
   * Gate scroll updates behind an IntersectionObserver on the target ref.
   * Disable this when the apply callback writes a transform that moves the
   * target off-screen — IO would then report not-intersecting and stop the
   * animation. Defaults to true.
   */
  gate?: boolean;
}

/**
 * Drives `apply(progress)` on each frame the element is near the viewport.
 * progress = 0 when element center is at viewport bottom, 1 once it has
 * travelled `leadVh` of the viewport upward.
 */
export function useScrollDriven<T extends HTMLElement>(
  ref: RefObject<T>,
  apply: ScrollProgressFn,
  opts: Options = {},
) {
  const {
    leadVh = 0.7,
    settleOnce = false,
    rootMargin = "40% 0px 40% 0px",
    disabled = false,
    gate = true,
  } = opts;

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;

    let raf: number | null = null;
    let visible = !gate;
    let settled = false;
    let io: IntersectionObserver | null = null;

    const detach = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      if (io) io.disconnect();
    };

    const run = () => {
      raf = null;
      if (settled) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Far-bounds short-circuit — cheap when ungated.
      if (!gate && (rect.bottom < -vh || rect.top > vh * 2)) return;
      const center = rect.top + rect.height / 2;
      const p = Math.max(0, Math.min(1, (vh - center) / (vh * leadVh)));
      apply(p, el);
      if (settleOnce && p >= 1) {
        settled = true;
        detach();
      }
    };

    const schedule = () => {
      if (settled || raf != null) return;
      raf = requestAnimationFrame(run);
    };
    const onScroll = () => {
      if (visible) schedule();
    };

    if (gate) {
      io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) schedule();
        },
        { rootMargin, threshold: 0 },
      );
      io.observe(el);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();

    return () => {
      detach();
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [ref, apply, leadVh, settleOnce, rootMargin, disabled, gate]);
}

export const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
export const easeOutQuad = (p: number) => 1 - Math.pow(1 - p, 2);
