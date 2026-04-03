const DAILY_API_BASE = "https://api.daily.co/v1";

/**
 * Creates a Daily.co video room for an appointment.
 * Returns the room join URL, or null if DAILY_API_KEY is not configured (no-op in dev).
 * Room expires 2 hours after the scheduled time and ejects participants at expiry.
 */
export async function createDailyRoom(
  appointmentId: string,
  scheduledAt: string
): Promise<string | null> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    console.warn("[daily-co] DAILY_API_KEY not set — skipping room creation");
    return null;
  }

  const appointmentUnix = Math.floor(new Date(scheduledAt).getTime() / 1000);
  const nowUnix = Math.floor(Date.now() / 1000);
  const expireAt = Math.max(appointmentUnix, nowUnix) + 2 * 60 * 60; // +2 hours from appointment or now, whichever is later

  try {
    const res = await fetch(`${DAILY_API_BASE}/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: `klara-${appointmentId}`,
        privacy: "public",
        properties: {
          exp: expireAt,
          eject_at_room_exp: true,
          enable_chat: true,
          enable_screenshare: false,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[daily-co] Room creation failed:", res.status, body);
      return null;
    }

    const data = await res.json();
    return data.url as string;
  } catch (err) {
    console.error("[daily-co] Unexpected error:", err);
    return null;
  }
}

/**
 * Deletes a Daily.co room by appointment ID (e.g. on cancellation).
 * No-op if DAILY_API_KEY is not set.
 */
export async function deleteDailyRoom(appointmentId: string): Promise<void> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) return;

  try {
    await fetch(`${DAILY_API_BASE}/rooms/klara-${appointmentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch (err) {
    console.error("[daily-co] Room deletion error:", err);
  }
}
