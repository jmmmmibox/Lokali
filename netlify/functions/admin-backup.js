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
    const { adminEmail } = JSON.parse(event.body);

    // Verify admin
    if (adminEmail !== 'nadius76@hotmail.com') {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'No autorizado' }) };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Fetch all data
    const { data: usuarios } = await supabase.from('usuarios').select('*');
    const { data: negocios } = await supabase.from('negocios').select('*');
    const { data: negocio_data } = await supabase.from('negocio_data').select('*');
    const { data: negocio_config } = await supabase.from('negocio_config').select('*');

    const backup = {
      fecha: new Date().toISOString(),
      version: 'v21',
      totales: {
        usuarios: (usuarios || []).length,
        negocios: (negocios || []).length,
        datos: (negocio_data || []).length,
        configs: (negocio_config || []).length,
      },
      usuarios: usuarios || [],
      negocios: negocios || [],
      negocio_data: negocio_data || [],
      negocio_config: negocio_config || [],
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(backup),
    };
  } catch (err) {
    console.error('Backup error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
