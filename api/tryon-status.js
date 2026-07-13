// /api/tryon-status.js — poll a FASHN try-on job (frontend polls every ~2s)
export default async function handler(req, res) {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'id required' });
  const FASHN_KEY = (process.env.FASHN_API_KEY || '').trim();
  if (!FASHN_KEY)
    return res.status(500).json({ error: 'FASHN_API_KEY not configured in Vercel (missing or empty)' });
  try {
    const r = await fetch('https://api.fashn.ai/v1/status/' + encodeURIComponent(id), {
      headers: { 'Authorization': 'Bearer ' + FASHN_KEY }
    });
    const data = await r.json().catch(() => ({}));
    // FASHN errors may be an object { name, message } — always hand the frontend a string.
    const errMsg = data.error && typeof data.error === 'object'
      ? (data.error.message || JSON.stringify(data.error))
      : (data.error || null);
    if (!r.ok) {
      console.error('FASHN /v1/status failed:', r.status, errMsg);
      return res.status(r.status).json({ error: errMsg || JSON.stringify(data) });
    }
    // FASHN: { status: 'starting'|'in_queue'|'processing'|'completed'|'failed', output: [url] }
    return res.status(200).json({ status: data.status, output: data.output || null, error: errMsg });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
