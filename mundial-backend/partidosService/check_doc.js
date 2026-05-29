const {Firestore} = require('@google-cloud/firestore');
const db = new Firestore();

async function run() {
  const partidosRef = db.collection('partidos');
  const snapshot = await partidosRef.get();
  snapshot.forEach(doc => {
    console.log(`Document ID: ${doc.id}`);
    console.log(`Data:`, JSON.stringify(doc.data(), null, 2));
  });
}
run();
