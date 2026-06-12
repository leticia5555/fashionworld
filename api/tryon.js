// /api/tryon.js — submit a virtual try-on job to FASHN
// Env var required: FASHN_API_KEY  (get one at fashn.ai)
// Docs: https://docs.fashn.ai — if this 404s, check the endpoint paths there.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { modelImage, garmentImage, category } = req.body || {};
    if (!process.env.FASHN_API_KEY)
      return res.status(500).json({ error: 'FASHN_API_KEY not configured in Vercel' });
    if (!modelImage || !garmentImage)
      return res.status(400).json({ error: 'modelImage and garmentImage required (data URI or URL)' });

    const r = await fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.FASHN_API_KEY
      },
      body: JSON.stringify({
        model_image: modelImage,
        garment_image: garmentImage,
        category: category || 'auto'
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error || JSON.stringify(data) });
    return res.status(200).json({ id: data.id });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
