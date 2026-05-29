'use strict'

const {PubSub} = require('@google-cloud/pubsub');
const {Firestore} = require('@google-cloud/firestore');

const db = new Firestore();

var https = require('https');
var http = require('http');
const request = require('request');



var tableName = "Apuestas";
 
var usuarios = [];
var partidos = [];
var apuestas = [];

exports.getApuestas = async function (usuario) {  
    var apuestas = [];
    const apuestasRef = db.collection('apuestas');
    let query = apuestasRef;
    if (usuario) {
        query = apuestasRef.where('usuario', '==', usuario);
    }
    const snapshot = await query.get();
    if (snapshot.empty) {
      console.log('No matching documents.');
      return apuestas ;
    }
    

    snapshot.forEach(doc => {
      apuestas.push(doc.data());
    });  
     
    return apuestas;
}

exports.nuevaApuesta = async function (datosApuesta) {
        var idApuesta = "";
         
        var resultado = "";
        if (datosApuesta.golesLocal > datosApuesta.golesVisitante) {
            resultado = "L";
        }
        if (datosApuesta.golesLocal == datosApuesta.golesVisitante) {
            resultado = "E";
        }
        if (datosApuesta.golesLocal < datosApuesta.golesVisitante) {
            resultado = "V";
        }

        console.log(JSON.stringify(datosApuesta));

        //Obtengo ID de Apuesta
        const apuestasRef = db.collection('apuestas');
        const snapshotA = await apuestasRef.where('partido', '==', datosApuesta.partido).where('usuario', '==', datosApuesta.usuario).get();
        if (snapshotA.empty) {
          console.log('Nueva Apuesta');
          var apuesta = { "golesLocal": datosApuesta.golesLocal,
                      "golesVisitante": datosApuesta.golesVisitante,
                      "partido": datosApuesta.partido,
                      "resultado": resultado,
                      "usuario": datosApuesta.usuario,
                      "cargado": true};
          const res = db.collection('apuestas').doc().set(apuesta);
        }
        else {
            console.log('Actualiza Apuesta');
            snapshotA.forEach(doc => {
              idApuesta = doc.id;
            });  

            var apuesta = { "golesLocal": datosApuesta.golesLocal,
                            "golesVisitante": datosApuesta.golesVisitante,
                             "partido": datosApuesta.partido,
                             "resultado": resultado,
                             "usuario": datosApuesta.usuario,
                             "cargado": true}; 
         
             const res = db.collection('apuestas').doc(idApuesta).set(apuesta);
        }     

        // Notifica evento
       //enviarEvento("projects/projectodemos/topics/mundial2022", JSON.stringify({ "evento": "Nueva Apuesta", "apuesta" : apuesta}));    

}

function callGetUsuarios() {
    return new Promise((resolve, reject) => {
        request("http://usuariosservice:8080/usuarios", (error, response, body) => {
            if (error) reject(error);
            usuarios = JSON.parse(body);
            resolve(body);
        });
    });
}

 

  

