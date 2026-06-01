const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  let event;
  let rawBody = '';

  await new Promise((resolve, reject) => {
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', resolve);
    req.on('error', reject);
  });

  try {
    event = stripe.webhooks.constructEvent(
      rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const listingId = session.metadata?.listing_id;
    console.log('Payment completed! listing_id:', listingId);
    if (listingId) {
      const { error } = await supabase
        .from('listings')
        .update({ pinned: true })
        .eq('id', listingId);
      if (error) console.error('Supabase error:', error);
      else console.log('✅ Listing pinned:', listingId);
    }
  }

  res.json({ received: true });
};

module.exports.config = { api: { bodyParser: false } };
