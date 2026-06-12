// /api/tryon-status.js — poll a FASHN try-on job (frontend polls every ~2s)
export default async function handler(req, res) {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const r = await fetch('https://api.fashn.ai/v1/status/' + id, {
      headers: { 'Authorization': 'Bearer ' + process.env.FASHN_API_KEY }
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error || JSON.stringify(data) });
    // FASHN: { status: 'starting'|'in_queue'|'processing'|'completed'|'failed', output: [url] }
    return res.status(200).json({ status: data.status, output: data.output || null, error: data.error || null });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
