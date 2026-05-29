'use strict'

const {PubSub} = require('@google-cloud/pubsub');
const {Firestore} = require('@google-cloud/firestore');
const {ExecutionsClient} = require('@google-cloud/workflows');

const client = new ExecutionsClient();

const db = new Firestore();

var http = require('http');
var tableName = "Partidos";

var partidos = [];
var equipos = [];

exports.nuevoPartido = async function (dataPartido) {
    var partido = {};
    var idPartido = "";
    if (dataPartido.estado === "Finalizado") {
      console.log("El partido estaba Finalizado");
      const partidosRef = db.collection('partidos');
      const snapshot = await partidosRef.where('partido', '=', dataPartido.partido).get();
      if (snapshot.empty) {
          console.log('No matching documents.');
      }
       
      snapshot.forEach(doc => {
          partido = doc.data();
          idPartido = doc.id;
      });  
      
      console.log("El partido es este:" + JSON.stringify(partido));
    
        partido.jugado = true;
        partido.golesLocal = dataPartido.golesLocal;
        partido.golesVisitante = dataPartido.golesVisitante;
        if (dataPartido.resultado === "Local") {
         partido.resultado = "L"; }
        if (dataPartido.resultado === "Empate") {
         partido.resultado = "E"; }
        if (dataPartido.resultado === "Visitante") {
         partido.resultado = "V"; }

 
      const res = db.collection('partidos').doc(idPartido).set(partido);
      console.log("Resultado:" + JSON.stringify(res));
    }
}

exports.getEquipos = async function () {
    await callGetEquipos();
    return equipos;
}
async function callGetEquipos() {
    var options = {
      host: 'equiposservice',
      port: 8080,
      path: '/equipos',
      method: 'GET' 
    };
  
    function callback (response) {
          var str = '';
        
          //another chunk of data has been received, so append it to `str`
          response.on('data', function (chunk) {
            str += chunk;
          });
        
          //the whole response has been received, so we just print it out here
          response.on('end', function () {
            equipos = JSON.parse(str);
          });
        }
        
        var req = http.request(options, callback);
        req.end();
  
      }   

exports.getPartidos = async function () {  
        partidos = [];
        const partidosRef = db.collection('partidos');
        const snapshot = await partidosRef.orderBy('dia').get();
        if (snapshot.empty) {
          console.log('No matching documents.');
          return partidos ;
        }
    
        snapshot.forEach(doc => {
          const firestoreTimestamp = doc.data().dia;

         if (firestoreTimestamp) {
           const jsDate = firestoreTimestamp.toDate();
           const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
           const readableDate = new Intl.DateTimeFormat('es-ES', options).format(jsDate);
            const rawFase = doc.data().fase || doc.data().grupo || "";
            const normalizedFase = (rawFase.length === 1 && rawFase >= 'A' && rawFase <= 'H') ? "Grupos" : rawFase;
            partidos.push({ id: doc.data().partido || doc.id,
                            partido: doc.data().partido || doc.id,
                            fase: normalizedFase,
                            dia: readableDate, 
                            equipo1: doc.data().equipo1, 
                            equipo2: doc.data().equipo2, 
                            golesLocal: doc.data().golesLocal,
                            golesVisitante: doc.data().golesVisitante,
                            grupo: doc.data().grupo,
                            jugado: doc.data().jugado,
                            lugar: doc.data().lugar,
                            resultado: doc.data().resultado,
                            });
        }
        });  
         
        return partidos;
}

exports.getProximosPartidos = async function () {  
    partidos = [];
    const partidosRef = db.collection('partidos');
    const snapshot = await partidosRef.where('jugado', '=', false).orderBy('dia').limit(3).get();
    if (snapshot.empty) {
      console.log('No matching documents.');
      return partidos ;
    }

    snapshot.forEach(doc => {
      partidos.push(doc.data());
    });  

    return partidos;
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
