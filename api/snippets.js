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
  const id = req.query.id;

  if (method === "GET" && !id) {
    // List all snippets
    const r = await fetch(`${SB}/snippets?select=*&order=created_at.desc`, { headers });
    return res.json(await r.json());
  }

  if (method === "GET" && id) {
    // Get one snippet
    const r = await fetch(`${SB}/snippets?id=eq.${id}&select=*`, { headers });
    const data = await r.json();
    return res.json(data[0] || null);
  }

  if (method === "POST") {
    const { title, description, code, language } = req.body;
    if (!title || !code) return res.status(400).json({ error: "Title and code required." });
    const r = await fetch(`${SB}/snippets`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({ title, description, code, language, author_id: "00000000-0000-0000-0000-000000000000" }),
    });
    return res.json((await r.json())[0]);
  }

  res.status(405).json({ error: "Method not allowed" });
}
