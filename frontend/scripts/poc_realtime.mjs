// Standalone POC: proves Supabase Realtime two-client sync + upsert + persistence.
// Run:  set -a; . .env.local; set +a; node scripts/poc_realtime.mjs
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const TABLE = "deliverable_status";
const TEST_ID = "intro-prelim";
const STATES = ["not_started", "filming", "editing", "delivered"];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // NOTE: `transport: ws` is ONLY needed for this Node test script.
  // The real browser app uses the platform's native WebSocket (no `ws`).
  const writer = createClient(url, anon, {
    auth: { persistSession: false },
    realtime: { transport: ws },
  });
  const reader = createClient(url, anon, {
    auth: { persistSession: false },
    realtime: { transport: ws },
  });

  let received = null;
  let receivedAt = 0;
  let anyMessage = 0;

  const channel = reader
    .channel("poc-room-" + Date.now())
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE },
      (payload) => {
        anyMessage++;
        receivedAt = Date.now();
        received = payload.new;
        console.log(`[READER] postgres_changes (${payload.eventType}):`, JSON.stringify(payload.new));
      }
    );

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("subscribe timeout")), 15000);
    channel.subscribe((status, err) => {
      console.log("[READER] channel status:", status, err ? "ERR=" + err.message : "");
      if (status === "SUBSCRIBED") {
        clearTimeout(t);
        resolve();
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        clearTimeout(t);
        reject(new Error("channel error: " + status + (err ? " / " + err.message : "")));
      }
    });
  });

  // give the realtime server a moment to register the postgres_changes binding
  await wait(2000);

  // ---- Test 1: UPDATE event (row exists from a prior run) ----
  const newStatus = STATES[Math.floor(Math.random() * STATES.length)];
  const sentAt = Date.now();
  console.log(`\n[WRITER] upsert ${TEST_ID} -> ${newStatus}`);
  const { data, error } = await writer
    .from(TABLE)
    .upsert({
      id: TEST_ID,
      status: newStatus,
      updated_by: "POC",
      updated_at: new Date().toISOString(),
    })
    .select();
  if (error) {
    console.error("[WRITER] upsert error:", error);
    process.exit(2);
  }
  console.log("[WRITER] upsert ok:", JSON.stringify(data));

  for (let i = 0; i < 60 && !received; i++) await wait(100);

  // read back to prove persistence
  const { data: readback } = await writer
    .from(TABLE)
    .select("*")
    .eq("id", TEST_ID)
    .single();
  console.log("[READBACK] persisted row:", JSON.stringify(readback));

  let code = 0;
  if (received && received.status === newStatus) {
    console.log(`\n\u2705 PASS \u2014 realtime received in ~${receivedAt - sentAt}ms, status=${received.status}`);
  } else {
    console.log(`\n\u274c FAIL \u2014 realtime not received (anyMessage=${anyMessage}). received=${JSON.stringify(received)}`);
    code = 3;
  }
  if (readback && readback.status === newStatus) {
    console.log("\u2705 PASS \u2014 persistence confirmed");
  } else {
    console.log("\u274c FAIL \u2014 persistence mismatch");
    code = code || 4;
  }

  await reader.removeChannel(channel);
  process.exit(code);
}

main().catch((e) => {
  console.error("POC crashed:", e);
  process.exit(9);
});
