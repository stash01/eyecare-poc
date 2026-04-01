import { db } from "./db";

export type ActorType = "patient" | "provider" | "system";

export async function logAuditEvent(
  actorType: ActorType,
  actorId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  ipAddress: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await db.from("audit_log").insert({
      actor_type: actorType,
      actor_id: actorId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      ip_address: ipAddress,
      metadata: metadata ?? null,
    });
  } catch (err) {
    // Audit log failures should never crash the main request, but must be surfaced.
    // In production, route this to an alerting system (e.g., Sentry).
    console.error("[audit] Failed to write audit log entry:", err);
  }
}
