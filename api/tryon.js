// /api/tryon.js — submit a virtual try-on job to FASHN
// Env var required: FASHN_API_KEY  (get one at fashn.ai)
// Docs: https://docs.fashn.ai — current API expects { model_name, inputs: {...} };
// we retry once with the legacy flat body if the new shape is rejected.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { modelImage, garmentImage, category } = req.body || {};
    const FASHN_KEY = (process.env.FASHN_API_KEY || '').trim();
    if (!FASHN_KEY)
      return res.status(500).json({ error: 'FASHN_API_KEY not configured in Vercel (missing or empty)' });
    if (!modelImage || !garmentImage)
      return res.status(400).json({ error: 'modelImage and garmentImage required (data URI or URL)' });

    // FASHN can't fetch site-relative paths like /garments/foo.png (what the
    // catalog sends) — resolve them against this deployment's public origin.
    const origin =
      (req.headers['x-forwarded-proto'] || 'https') + '://' +
      (req.headers['x-forwarded-host'] || req.headers.host);
    const toAbsolute = (img) => (typeof img === 'string' && img.startsWith('/') ? origin + img : img);

    const inputs = {
      model_image: toAbsolute(modelImage),
      garment_image: toAbsolute(garmentImage),
      category: category || 'auto'
    };

    const submit = (body) => fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + FASHN_KEY
      },
      body: JSON.stringify(body)
    });

    let r = await submit({ model_name: 'tryon-v1.6', inputs });
    let data = await r.json().catch(() => ({}));
    // Schema rejection (not auth/quota/rate-limit) → try the legacy flat payload.
    if (!r.ok && r.status >= 400 && r.status < 500 && ![401, 402, 403, 429].includes(r.status)) {
      const r2 = await submit(inputs);
      const data2 = await r2.json().catch(() => ({}));
      if (r2.ok) { r = r2; data = data2; }
    }

    if (!r.ok) {
      const msg = data.error && typeof data.error === 'object'
        ? (data.error.message || JSON.stringify(data.error))
        : (data.error || data.message || JSON.stringify(data));
      console.error('FASHN /v1/run failed:', r.status, msg);
      return res.status(r.status).json({ error: msg });
    }
    return res.status(200).json({ id: data.id });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
