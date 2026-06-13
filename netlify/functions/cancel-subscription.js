const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const { userId } = JSON.parse(event.body);
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Get user subscription ID
    const { data: user, error: fetchError } = await supabase
      .from('usuarios')
      .select('stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (fetchError || !user || !user.stripe_subscription_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No se encontró una suscripción activa' }),
      };
    }

    // Cancel subscription at period end (not immediately)
    const subscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Get the end date of the current period
    const cancelDate = new Date(subscription.current_period_end * 1000).toISOString().split('T')[0];

    // Update user - keep active but mark cancellation date
    await supabase
      .from('usuarios')
      .update({ cancela_el: cancelDate })
      .eq('id', userId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, cancela_el: cancelDate }),
    };
  } catch (err) {
    console.error('Cancel error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
