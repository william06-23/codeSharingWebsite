const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { code } = req.body;
  if (!code || !code.trim()) return res.status(400).json({ error: "No code provided." });

  const tmpFile = path.join(os.tmpdir(), `py_${Date.now()}.py`);

  fs.writeFile(tmpFile, code, "utf8", (writeErr) => {
    if (writeErr) return res.status(500).json({ error: "Failed to write temp file." });

    const cmd = process.platform === "win32" ? "python" : "python3";

    execFile(cmd, [tmpFile], { timeout: 10000, maxBuffer: 1024 * 512 }, (err, stdout, stderr) => {
      fs.unlink(tmpFile, () => {});
      if (err && err.killed) return res.json({ output: "", error: "Execution timed out (10s)." });
      res.json({ output: stdout || "", error: stderr || (err ? err.message : "") });
    });
  });
}
