const { MongoClient } = require('mongodb');

async function fixAdminStatus() {
  const client = new MongoClient('mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('🔌 Conectado a MongoDB');

    const db = client.db('wctraining');

    const result = await db.collection('users').updateOne(
      { email: 'admin@wctraining.com' },
      {
        $set: {
          status: 'active',           // Minúsculas como el enum
          stage: 'AVANZADO',          // Valor válido del enum
          'subscriptionAccess.plan': 'ELITE'  // Valor válido del enum
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Usuario admin actualizado correctamente');
      console.log('   - status: active');
      console.log('   - stage: AVANZADO');
      console.log('   - plan: ELITE');
    } else {
      console.log('⚠️  No se encontró el usuario o ya estaba actualizado');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

fixAdminStatus();
