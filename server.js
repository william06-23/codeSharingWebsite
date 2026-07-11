const express = require("express");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const app = express();
const PORT = 3001;

const SUPABASE_URL = "https://umksqnwwkdoqpgezhqjb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YD3I4V9Gy9ANNCzYGZsAyg_r9buWrxD";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(__dirname));

app.get("/api/config", (_req, res) => {
  res.json({ supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_ANON_KEY });
});

// ── Supabase REST helpers ──
const SB = `${SUPABASE_URL}/rest/v1`;
const SB_HEADERS = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

// GET /api/snippets — list all snippets
app.get("/api/snippets", async (_req, res) => {
  try {
    const r = await fetch(`${SB}/snippets?select=*&order=created_at.desc`, { headers: SB_HEADERS });
    const data = await r.json();
    res.json(data);
  } catch { res.status(500).json({ error: "Failed to fetch snippets." }); }
});

// GET /api/snippets/:id — get one snippet
app.get("/api/snippets/:id", async (req, res) => {
  try {
    const r = await fetch(`${SB}/snippets?id=eq.${req.params.id}&select=*`, { headers: SB_HEADERS });
    const data = await r.json();
    res.json(data[0] || null);
  } catch { res.status(500).json({ error: "Failed to fetch snippet." }); }
});

// POST /api/snippets — create snippet
app.post("/api/snippets", async (req, res) => {
  const { title, description, code, language } = req.body;
  if (!title || !code) return res.status(400).json({ error: "Title and code required." });
  try {
    const r = await fetch(`${SB}/snippets`, {
      method: "POST", headers: { ...SB_HEADERS, "Prefer": "return=representation" },
      body: JSON.stringify({ title, description, code, language, author_id: "00000000-0000-0000-0000-000000000000" }),
    });
    const data = await r.json();
    res.json(data[0]);
  } catch { res.status(500).json({ error: "Failed to create snippet." }); }
});

// GET /api/snippets/:id/comments
app.get("/api/snippets/:id/comments", async (req, res) => {
  try {
    const r = await fetch(`${SB}/comments?snippet_id=eq.${req.params.id}&select=*&order=created_at.asc`, { headers: SB_HEADERS });
    res.json(await r.json());
  } catch { res.status(500).json({ error: "Failed to fetch comments." }); }
});

// POST /api/snippets/:id/comments
app.post("/api/snippets/:id/comments", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Comment text required." });
  try {
    const r = await fetch(`${SB}/comments`, {
      method: "POST", headers: { ...SB_HEADERS, "Prefer": "return=representation" },
      body: JSON.stringify({ snippet_id: req.params.id, text, author_id: "00000000-0000-0000-0000-000000000000" }),
    });
    res.json((await r.json())[0]);
  } catch { res.status(500).json({ error: "Failed to post comment." }); }
});

// Execute Python code and return stdout/stderr
app.post("/api/run/python", (req, res) => {
  const { code } = req.body;

  if (typeof code !== "string" || code.trim().length === 0) {
    return res.status(400).json({ error: "No code provided." });
  }

  const tmpFile = path.join(os.tmpdir(), `py_${Date.now()}.py`);

  fs.writeFile(tmpFile, code, "utf8", (writeErr) => {
    if (writeErr) {
      return res.status(500).json({ error: "Failed to write temp file." });
    }

    // Try python3 first, then python
    const cmd = process.platform === "win32" ? "python" : "python3";

    execFile(cmd, [tmpFile], { timeout: 10000, maxBuffer: 1024 * 512 }, (err, stdout, stderr) => {
      // Clean up temp file
      fs.unlink(tmpFile, () => {});

      if (err && err.killed) {
        return res.json({ output: "", error: "Execution timed out (10s limit)." });
      }

      res.json({
        output: stdout || "",
        error: stderr || (err ? err.message : ""),
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
