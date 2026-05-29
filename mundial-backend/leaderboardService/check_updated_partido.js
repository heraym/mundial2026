const {Firestore} = require('@google-cloud/firestore');
const db = new Firestore();

async function run() {
  try {
    const snapshot = await db.collection('partidos').get();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.jugado) {
        console.log(`Updated Partido Document ID: ${doc.id}`);
        console.log(`Data:`, JSON.stringify(data, null, 2));
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
