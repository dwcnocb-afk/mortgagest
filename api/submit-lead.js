// /api/submit-lead.js
// Vercel Serverless Function — proxies form submissions to the Airtable
// Workflow webhook. This avoids the browser CORS block (since the browser
// only ever talks to your own domain) and keeps the webhook URL out of
// public page source.

const AIRTABLE_WEBHOOK_URL = 'https://hooks.airtable.com/workflows/v1/genericWebhook/appoHZlthmPG1UF9v/wflNiVAThNj0l4aRQ/wtrfxsEEyqEs9ehez';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};

    // Basic server-side validation (mirrors the client-side checks)
    const { Name, Email, Phone } = body;
    if (!Name || !Email || !Phone) {
      return res.status(400).json({ error: 'Missing required fields: Name, Email, Phone' });
    }

    // Forward to Airtable's webhook — server-to-server, no CORS involved
    const airtableRes = await fetch(AIRTABLE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!airtableRes.ok) {
      const errText = await airtableRes.text().catch(() => '');
      console.error('Airtable webhook error:', airtableRes.status, errText);
      return res.status(502).json({ error: 'Failed to reach Airtable webhook' });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('submit-lead proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
