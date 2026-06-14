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
    const { adminEmail, userId } = JSON.parse(event.body);

    if (adminEmail !== 'nadius76@hotmail.com') {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'No autorizado' }) };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Delete from usuarios table (cascade deletes negocios, data, config)
    await supabase.from('usuarios').delete().eq('id', userId);

    // Delete from auth.users
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('Delete user error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
