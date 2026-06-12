// /api/stylist.js — AI stylist text (Anthropic proxy)
// Env var required: ANTHROPIC_API_KEY  (Vercel → Settings → Environment Variables)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { imageBase64, itemName, itemDesc, itemColor } = req.body || {};
    if (!process.env.ANTHROPIC_API_KEY)
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured in Vercel' });

    const content = [];
    if (imageBase64) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 }
      });
    }
    content.push({
      type: 'text',
      text:
        'You are a warm, expert fashion stylist. ' +
        (imageBase64 ? 'The photo shows the client. ' : '') +
        'They want to try: "' + (itemName || 'this piece') + '" — ' + (itemDesc || '') +
        (itemColor ? ' in ' + itemColor : '') + '. ' +
        'In 2-3 sentences, describe how it would look on them specifically (body shape, skin tone, proportions). ' +
        'Be specific and encouraging, never generic. Then suggest ONE complementary piece. ' +
        'Reply in the same language as the item name if Spanish, otherwise English. Under 90 words.'
    });

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content }]
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'Anthropic error' });
    const text = data.content?.[0]?.text || '';
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
