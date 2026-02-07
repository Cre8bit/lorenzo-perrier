/**
 * CubeSpace Flow Metrics - Performance and debugging telemetry
 *
 * Tracks:
 * - buffer_hit_rate: How often the listener arrives before save completes
 * - flow_duration_ms: Time from DROP_CUBE to SAVE_SUCCESS
 * - State transitions for debugging
 *
 * All metrics are correlated by flowId for analysis.
 * DEV-only - zero overhead in production.
 */

export type FlowMetric = {
  flowId: string;
  timestamp: number;
  event:
    | "DROP_CUBE"
    | "SETTLE_CUBE"
    | "SAVE_REQUEST"
    | "SAVE_SUCCESS"
    | "SAVE_FAIL"
    | "ABANDON_FLOW"
    | "LISTENER_SNAPSHOT";
  metadata?: Record<string, unknown>;
};

export type FlowSummary = {
  flowId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  bufferHit: boolean;
  success: boolean;
  events: FlowMetric[];
};

class CubeSpaceMetrics {
  private flows = new Map<string, FlowSummary>();
  private enabled = false;

  enable() {
    if (!import.meta.env.DEV) return;
    this.enabled = true;
    console.log("[CubeSpace Metrics] Enabled");
  }

  disable() {
    this.enabled = false;
    console.log("[CubeSpace Metrics] Disabled");
  }

  isEnabled() {
    return this.enabled;
  }

  startFlow(flowId: string) {
    if (!this.enabled || !import.meta.env.DEV) return;

    this.flows.set(flowId, {
      flowId,
      startTime: performance.now(),
      bufferHit: false,
      success: false,
      events: [],
    });
  }

  recordEvent(
    flowId: string | null,
    event: FlowMetric["event"],
    metadata?: Record<string, unknown>,
  ) {
    if (!this.enabled || !import.meta.env.DEV || !flowId) return;

    const flow = this.flows.get(flowId);
    if (!flow) return;

    flow.events.push({
      flowId,
      timestamp: performance.now(),
      event,
      metadata,
    });

    // Track buffer hit
    if (event === "LISTENER_SNAPSHOT" && !flow.endTime) {
      flow.bufferHit = true;
    }
  }

  endFlow(flowId: string, success: boolean) {
    if (!this.enabled || !import.meta.env.DEV) return;

    const flow = this.flows.get(flowId);
    if (!flow) return;

    flow.endTime = performance.now();
    flow.duration = flow.endTime - flow.startTime;
    flow.success = success;

    // Log summary
    console.log(
      `[CubeSpace] Flow ${flowId.slice(0, 8)} completed in ${flow.duration.toFixed(0)}ms`,
      {
        success,
        bufferHit: flow.bufferHit,
        events: flow.events.length,
      },
    );
  }

  getFlowSummary(flowId: string): FlowSummary | undefined {
    return this.flows.get(flowId);
  }

  getMetrics(): {
    totalFlows: number;
    successRate: number;
    bufferHitRate: number;
    avgDuration: number;
  } {
    if (!this.enabled || !import.meta.env.DEV) {
      return {
        totalFlows: 0,
        successRate: 0,
        bufferHitRate: 0,
        avgDuration: 0,
      };
    }

    const flows = Array.from(this.flows.values()).filter((f) => f.endTime);
    const totalFlows = flows.length;

    if (totalFlows === 0) {
      return {
        totalFlows: 0,
        successRate: 0,
        bufferHitRate: 0,
        avgDuration: 0,
      };
    }

    const successCount = flows.filter((f) => f.success).length;
    const bufferHitCount = flows.filter((f) => f.bufferHit).length;
    const totalDuration = flows.reduce((sum, f) => sum + (f.duration || 0), 0);

    return {
      totalFlows,
      successRate: successCount / totalFlows,
      bufferHitRate: bufferHitCount / totalFlows,
      avgDuration: totalDuration / totalFlows,
    };
  }

  reset() {
    this.flows.clear();
    console.log("[CubeSpace Metrics] Reset");
  }

  // Get all flows for debugging
  getAllFlows() {
    return Array.from(this.flows.values());
  }
}

// Singleton instance
export const cubeSpaceMetrics = new CubeSpaceMetrics();

// Global access for debugging
if (import.meta.env.DEV) {
  // @ts-expect-error - dev-only global
  window.cubeSpaceMetrics = cubeSpaceMetrics;
}
