const {Firestore} = require('@google-cloud/firestore');
const db = new Firestore();

async function run() {
  try {
    const snapshot = await db.collection('usuarios').get();
    console.log("Total usuarios:", snapshot.size);
    snapshot.forEach(doc => {
      console.log("RAW USUARIO DOCUMENT:", doc.id, JSON.stringify(doc.data()));
    });
  } catch (error) {
    console.error("Error:", error);
  }
}
run();
