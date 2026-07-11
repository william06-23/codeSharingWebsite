const SUPABASE_URL = process.env.SUPABASE_URL || "https://umksqnwwkdoqpgezhqjb.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_YD3I4V9Gy9ANNCzYGZsAyg_r9buWrxD";
const SB = `${SUPABASE_URL}/rest/v1`;
const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: "Snippet ID required." });

  if (method === "GET") {
    const r = await fetch(`${SB}/comments?snippet_id=eq.${id}&select=*&order=created_at.asc`, { headers });
    return res.json(await r.json());
  }

  if (method === "POST") {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Comment text required." });
    const r = await fetch(`${SB}/comments`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({ snippet_id: id, text, author_id: "00000000-0000-0000-0000-000000000000" }),
    });
    return res.json((await r.json())[0]);
  }

  res.status(405).json({ error: "Method not allowed" });
}
