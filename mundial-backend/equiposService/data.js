'use strict'

const {PubSub} = require('@google-cloud/pubsub');
const {Firestore} = require('@google-cloud/firestore');
const {ExecutionsClient} = require('@google-cloud/workflows');

const client = new ExecutionsClient();

const db = new Firestore();

var https = require('https');
 

exports.getEquipos = async function () {  
    var equipos = [];
    const equiposRef = db.collection('equipos');
    const snapshotE = await equiposRef.get();
    if (snapshotE.empty) {
       console.log('No matching documents.');
    } 
 
    snapshotE.forEach(doc => {
         equipos.push(doc.data());
      }); 

    return equipos
}
 
      // Notificar eventos a Pub/Sub


async function enviarEvento (topico, evento) {
     var pubsub = new PubSub();
    // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
    const dataBuffer = Buffer.from(evento);
  
    try {
      const messageId = await pubsub
        .topic(topico)
        .publish(dataBuffer);
      console.log('Mensaje ' + messageId + ' publicado en topico ' +  topico);
    } catch (error) {
      console.error('Error en publicacion: ' + error.message);
      process.exitCode = 1;
    }
}

  // Notifica evento
//  enviarEvento("projects/projectodemos/topics/mundial", JSON.stringify({ "evento": "Nuevo Partido", "partido" : partido}));    
