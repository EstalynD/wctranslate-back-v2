const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/wctraining';

async function check() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const progressCol = db.collection('userprogresses');
  const usersCol = db.collection('users');

  // Últimos 5 progress docs con su userId real
  const recent = await progressCol.find({}).sort({ createdAt: -1 }).limit(5).toArray();
  console.log('Últimos 5 progress docs:');
  for (const d of recent) {
    const userIdStr = d.userId?.toString();
    // Verificar si ese userId existe como un usuario real
    let userExists = false;
    try {
      const user = await usersCol.findOne({ _id: d.userId });
      userExists = !!user;
    } catch { }
    console.log('  ProgressDoc:', d._id?.toString());
    console.log('    userId almacenado:', userIdStr);
    console.log('    userId tipo:', typeof d.userId, d.userId?.constructor?.name);
    console.log('    Usuario existe?:', userExists);
    console.log('    courses.length:', d.courses?.length);
    if (d.courses?.length > 0) {
      console.log('    courseId:', d.courses[0]?.courseId?.toString());
    }
    console.log('');
  }

  // Últimos 3 usuarios creados
  const users = await usersCol.find({}).sort({ createdAt: -1 }).limit(3).toArray();
  console.log('Últimos 3 usuarios:');
  users.forEach(u => {
    console.log('  User _id:', u._id?.toString(), 'email:', u.email);
  });

  await mongoose.disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
