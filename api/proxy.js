// api/proxy.js
// Vercel Serverless Function — CORS bridge papunta sa Google Apps Script

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Your Google Apps Script Web App URL
  // ⚠️ PALITAN ITO ng iyong aktwal na deployment URL
  const GAS_URL = 'https://script.google.com/macros/s/PASTE_YOUR_DEPLOYMENT_ID_HERE/exec';

  try {
    if (req.method === 'GET') {
      // Health check
      const gasRes = await fetch(GAS_URL, { method: 'GET', redirect: 'follow' });
      const text = await gasRes.text();
      return res.status(200).send(text);
    }

    if (req.method === 'POST') {
      // Forward POST body to GAS as text/plain
      // (GAS doPost expects raw body; JSON.parse happens inside Code.gs)
      const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      const gasRes = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: bodyString,
        redirect: 'follow'
      });

      const text = await gasRes.text();
      return res.status(200).send(text);
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.toString() });
  }
}
