const {Firestore} = require('@google-cloud/firestore');
const db = new Firestore();

async function run() {
  try {
    const snapshot = await db.collection('apuestas').get();
    console.log("Total apuestas:", snapshot.size);
    snapshot.forEach(doc => {
      console.log("RAW APUESTA DOCUMENT:", doc.id, JSON.stringify(doc.data()));
    });
  } catch (error) {
    console.error("Error:", error);
  }
}
run();
