const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Supabase Client Initialization
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Health Check Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    platform: 'ZUPZO Food Delivery Engine',
    timestamp: new Date().toISOString()
  });
});

// 1. Meta WhatsApp Webhook Handshake (Verification)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('WhatsApp Webhook Verified Successfully!');
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Forbidden');
});

// 2. Incoming WhatsApp Messages & Events
app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const message = changes?.messages?.[0];

    if (message) {
      const from = message.from; // User's WhatsApp number
      const type = message.type;
      console.log(`[ZUPZO] Message from ${from} | Type: ${type}`);

      // Basic Auto-Reply for Testing
      if (type === 'text') {
        const userText = message.text.body;
        console.log(`Message Body: ${userText}`);
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('Webhook Error:', error.message);
    res.status(500).send('ERROR');
  }
});

// 3. API: Fetch All Available Restaurants in a Zone
app.get('/api/restaurants', async (req, res) => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*, menu_categories(*, menu_items(*))')
    .eq('is_open', true);

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true, count: data.length, restaurants: data });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ZUPZO server is running on port ${PORT}`);
});
