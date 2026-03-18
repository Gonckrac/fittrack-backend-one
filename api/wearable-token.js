export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { provider, code, redirectUri } = req.body;

  const configs = {
    oura: {
      tokenUrl: 'https://api.ouraring.com/oauth/token',
      clientId: process.env.OURA_CLIENT_ID,
      clientSecret: process.env.OURA_CLIENT_SECRET,
    },
  };

  const cfg = configs[provider];
  if (!cfg) return res.status(400).json({ error: 'Provider inválido' });

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
  });

  const response = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await response.json();
  return res.status(response.ok ? 200 : 400).json(data);
}
```

Pusheás ese repo.

**Paso 4 — Variables de entorno en Vercel**

En el dashboard de `fittrack-backend-one` en Vercel → Settings → Environment Variables agregás:
```
OURA_CLIENT_ID = tu client_id
OURA_CLIENT_SECRET = tu client_secret