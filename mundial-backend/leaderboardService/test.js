'use strict'

const {Firestore} = require('@google-cloud/firestore');

const db = new Firestore();


async function auditar() {
var apuestas = [];
    
    var auditoria = ['c3525470', '18517673'];
     
    
    var apuestas = [];
    const apuestasRef = db.collection('apuestas');
    const snapshotA = await apuestasRef.get();
    if (snapshotA.empty) {
      console.log('No matching documents.');
    }

    snapshotA.forEach(doc => {
      apuestas.push(doc.data());
    }); 


    for (let i = 0; i < apuestas.length; i++) { 
        apuestas[i].golesLocal = parseInt(apuestas[i].golesLocal);
        apuestas[i].golesVisitante = parseInt(apuestas[i].golesVisitante);
    } 

    for (let i = 0; i < auditoria.length; i++) {
           
            for (let j = 0; j < apuestas.length; j++) {
                
               if (apuestas[j].partido === auditoria[i]) {
                    console.log(auditoria[i] + "usuario:" + apuestas[j].usuario + " local:" + apuestas[j].golesLocal + " visitante:" + apuestas[j].golesVisitante);
                }
             } 
         
    }
}
auditar();     