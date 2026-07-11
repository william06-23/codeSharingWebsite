const express = require("express");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const app = express();
const PORT = 3001;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

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
