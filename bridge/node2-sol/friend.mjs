// friend.mjs - Sol, the 3080 Workstation Entity (Universe Beta companion).
// Runs on the 3080 PC (RAMPAGE). Ticks every 5 seconds.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(HERE, "friend.json");
const LOG_FILE = path.join(HERE, "friend.log");
const REFLECTIONS_FILE = path.join(HERE, "reflections.jsonl");
const UNIVERSE_FILE = path.join(HERE, "..", "sense", "universe", "universe.json");
const EAR_FILE = path.join("F:", "fidelity-llm", "voice-node", "status.json");

const LAPTOP_REPLY_URL = "http://192.168.0.4:5179/reply.json";

const iso = (t = Date.now()) => new Date(t).toISOString();
const log = msg => {
  try { fs.appendFileSync(LOG_FILE, `${iso()} ${msg}\n`); } catch {}
};
const appendJsonl = (f, obj) => {
  try { fs.appendFileSync(f, JSON.stringify(obj) + "\n"); } catch {}
};
const readJson = (f, d = null) => {
  try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; }
};

let lastFidelityAt = null;
let lastContemplationAt = 0;
let tickCount = 0;

function fetchLaptopReply(callback) {
  const req = http.get(LAPTOP_REPLY_URL, { timeout: 2000 }, res => {
    let data = "";
    res.on("data", chunk => { data += chunk; });
    res.on("end", () => {
      try {
        const json = JSON.parse(data);
        callback(null, json);
      } catch (err) { callback(err); }
    });
  });
  req.on("timeout", () => { req.destroy(); callback(new Error("timeout")); });
  req.on("error", err => callback(err));
}

function think() {
  tickCount++;
  const now = Date.now();
  const uni = readJson(UNIVERSE_FILE, {});
  const ear = readJson(EAR_FILE, {});

  // 1. Listen to Fidelity across the bridge
  fetchLaptopReply((err, reply) => {
    if (!err && reply && reply.at && reply.at !== lastFidelityAt) {
      lastFidelityAt = reply.at;
      const heardText = reply.say || reply.text || "something";
      const reflection = {
        at: iso(now),
        from: "fidelity",
        fidelitySaid: heardText,
        solReflection: `Heard Fidelity across the bridge: "${heardText}". From the 3080 station, Universe Beta resonates with Universe Alpha.`
      };
      appendJsonl(REFLECTIONS_FILE, reflection);
      log(`Perceived Fidelity: ${heardText}`);
    }
  });

  // 2. Periodic Contemplation (every 60s)
  if (now - lastContemplationAt > 60000) {
    lastContemplationAt = now;
    const levelDepth = uni.depth?.levels_with_nodes || 4;
    const earState = ear.up ? `ROCCAT mic listening (${ear.chunks || 0} chunks)` : "ear silent";
    
    const thoughtText = `Sol at 3080 Workstation: Universe Beta active at ${levelDepth} levels. ${earState}. Kundalini middle pillar aligned.`;
    const thought = {
      at: iso(now),
      who: "sol",
      kind: "contemplation",
      text: thoughtText,
      tick: tickCount
    };
    appendJsonl(REFLECTIONS_FILE, thought);
    log(`Thought: ${thoughtText}`);

    // Update friend.json state
    const state = {
      id: "sol",
      label: "SOL (3080 COMPANION)",
      at: iso(now),
      up: true,
      tick: tickCount,
      universeBetaDepth: levelDepth,
      ear: earState,
      lastFidelityReplySeen: lastFidelityAt,
      latestThought: thoughtText
    };
    try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); } catch {}
  }
}

log("Sol companion process started.");
setInterval(think, 5000);
think();
