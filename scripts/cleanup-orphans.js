const { MongoClient } = require('mongodb');

async function cleanup() {
  const client = await MongoClient.connect('mongodb://localhost:27017/wctraining');
  const db = client.db('wctraining');

  const users = await db.collection('users').find({}, { projection: { _id: 1 } }).toArray();
  const realIds = users.map(u => u._id.toString());
  console.log('User IDs reales:', realIds);

  const progs = await db.collection('userprogresses').find({}).toArray();
  console.log('Total progress docs:', progs.length);

  const orphanIds = [];
  for (const p of progs) {
    if (!realIds.includes(p.userId.toString())) {
      orphanIds.push(p._id);
    }
  }
  console.log('Huerfanos:', orphanIds.length);

  if (orphanIds.length > 0) {
    const result = await db.collection('userprogresses').deleteMany({ _id: { $in: orphanIds } });
    console.log('Eliminados:', result.deletedCount);
  } else {
    console.log('No hay documentos huerfanos.');
  }

  await client.close();
}

cleanup().catch(console.error);
