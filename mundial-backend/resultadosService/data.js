'use strict'

const {PubSub} = require('@google-cloud/pubsub');
const {Firestore} = require('@google-cloud/firestore');
const {ExecutionsClient} = require('@google-cloud/workflows');

const client = new ExecutionsClient();

const db = new Firestore();

var http = require('http');
const request = require('request');

var partidos = [];
var equipos = [];

exports.getEquipos = async function () {
    await callGetEquipos();
    return equipos;
}

function callGetEquipos() {
    return new Promise((resolve, reject) => {
        request("http://equiposservice:8080/equipos", (error, response, body) => {
            if (error) reject(error);
            equipos = JSON.parse(body);
            resolve(body);
        });
    });
}

function callGetPartidos() {
    return new Promise((resolve, reject) => {
        request("http://partidosservice:8080/partidos", (error, response, body) => {
            if (error) reject(error);
            partidos = JSON.parse(body);
            resolve(body);
        });
    });
}


exports.getPartidos = async function () {
    await callGetPartidos();
    return partidos;
}

exports.calcularResultadosGrupos = async function () { 
    await callGetEquipos();
    await callGetPartidos();
      
    
    for (let i = 0; i < equipos.length; i++) { 
        equipos[i].jugados = 0;
        equipos[i].ganados = 0;
        equipos[i].empatados = 0;
        equipos[i].perdidos = 0;
        equipos[i].golesAFavor = 0;
        equipos[i].golesEnContra = 0;
        equipos[i].puntos = 0;
    } 
    for (let i = 0; i < partidos.length; i++) {
      if (partidos[i].jugado === true) {
          var equipo1 = equipos.findIndex(equipo => equipo.nombre === partidos[i].equipo1);
          var equipo2 = equipos.findIndex(equipo => equipo.nombre === partidos[i].equipo2);

          if (equipo1 > -1) {
           // Equipo 1 (Local)
             equipos[equipo1].jugados = equipos[equipo1].jugados + 1;
             equipos[equipo1].golesAFavor = equipos[equipo1].golesAFavor + partidos[i].golesLocal;
             equipos[equipo1].golesEnContra = equipos[equipo1].golesEnContra + partidos[i].golesVisitante;
             if (partidos[i].resultado == 'L') { equipos[equipo1].ganados = equipos[equipo1].ganados + 1;
                                                 equipos[equipo1].puntos = equipos[equipo1].puntos + 3;  }
             if (partidos[i].resultado == 'E') { equipos[equipo1].empatados = equipos[equipo1].empatados + 1; 
                                                 equipos[equipo1].puntos = equipos[equipo1].puntos + 1;}
             if (partidos[i].resultado == 'V') { equipos[equipo1].perdidos = equipos[equipo1].perdidos + 1; }
           }
          // Equipo 2 (Visitante)
          if (equipo2 > -1) {
             equipos[equipo2].jugados = equipos[equipo2].jugados + 1;
             equipos[equipo2].golesAFavor = equipos[equipo2].golesAFavor + partidos[i].golesVisitante;
             equipos[equipo2].golesEnContra = equipos[equipo2].golesEnContra + partidos[i].golesLocal;
             if (partidos[i].resultado == 'V') { equipos[equipo2].ganados = equipos[equipo2].ganados + 1;
                                                 equipos[equipo2].puntos = equipos[equipo2].puntos + 3;  }
             if (partidos[i].resultado == 'E') { equipos[equipo2].empatados = equipos[equipo2].empatados + 1; 
                                                 equipos[equipo2].puntos = equipos[equipo2].puntos + 1;}
             if (partidos[i].resultado == 'L') { equipos[equipo2].perdidos = equipos[equipo2].perdidos + 1; }
          }
      }
    }

    for (let i = 0; i < equipos.length; i++) {
        const res = db.collection('equipos').doc(equipos[i].nombre).set(equipos[i]);
    }

    var equiposOrd = [];
    const equiposRef = db.collection('equipos');
    const snapshotE = await equiposRef.orderBy('puntos','desc').get();
    if (snapshotE.empty) {
       console.log('No matching documents.');
    } 
 
    snapshotE.forEach(doc => {
         equiposOrd.push(doc.data());
      }); 

    return equiposOrd;
    
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
