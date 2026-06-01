const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { listing_id, title } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Закреп объявления — 1 месяц',
            description: title || 'Объявление будет показываться выше всех с золотой пометкой 1 месяц.',
          },
          unit_amount: 500,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://taskmelatvia.com?pinned=success',
      cancel_url: 'https://taskmelatvia.com?pinned=cancel',
      metadata: { listing_id: String(listing_id) },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
