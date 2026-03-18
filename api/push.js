// api/push.js — FitTrack Web Push endpoint
// Maneja suscripciones y envío de notificaciones push

const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:tu@email.com', // cambiá por tu email
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Almacenamiento temporal en memoria (se resetea entre deploys/cold starts)
const subscriptions = new Map();

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://fittrack-eight-silk.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET /api/push?action=vapid-public-key
  if (req.method === 'GET') {
    const { action } = req.query;
    if (action === 'vapid-public-key') {
      return res.status(200).json({ key: process.env.VAPID_PUBLIC_KEY });
    }
    return res.status(400).json({ error: 'Unknown action' });
  }

  // POST /api/push
  if (req.method === 'POST') {
    const { action } = req.body;

    if (action === 'subscribe') {
      const { subscription, deviceId } = req.body;
      if (!subscription || !deviceId) {
        return res.status(400).json({ error: 'Missing subscription or deviceId' });
      }
      subscriptions.set(deviceId, subscription);
      return res.status(200).json({ ok: true });
    }

    if (action === 'schedule') {
      const { deviceId, title, body, delayMs } = req.body;
      if (!deviceId || !title || !delayMs) {
        return res.status(400).json({ error: 'Missing params' });
      }

      const subscription = subscriptions.get(deviceId);
      if (!subscription) {
        return res.status(404).json({ error: 'No subscription for this device' });
      }

      const delay = Math.min(Math.max(0, delayMs), 10 * 60 * 1000); // max 10 min

      res.status(200).json({ ok: true, scheduledIn: delay });

      setTimeout(async () => {
        try {
          await webpush.sendNotification(subscription, JSON.stringify({ title, body }));
        } catch (err) {
          console.error('[Push] Error enviando:', err.statusCode, err.message);
          if (err.statusCode === 410) subscriptions.delete(deviceId);
        }
      }, delay);

      return;
    }

    if (action === 'cancel') {
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
