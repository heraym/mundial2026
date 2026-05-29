'use strict'

const {PubSub} = require('@google-cloud/pubsub');
const {Firestore} = require('@google-cloud/firestore');
const {ExecutionsClient} = require('@google-cloud/workflows');

const client = new ExecutionsClient();

// Parametros a configurar
// Workflow
const projectId = "projectodemos";
const location = "us-central1";
const workflow = "onboarding_usuario";
// AppSheet
var appId = "f9afa749-c9c0-4188-bf4a-2eba46d3e6b5";
var apiKey = "V2-i0Ymr-7EAzt-f8eh9-OR1Kd-foSsh-6O2Ri-PFDDS-USYyX";


const db = new Firestore();

var https = require('https');
var tableName = "Partidos";

var partidos = [];

exports.getPartidos = async function () {  
        partidos = [];
        const partidosRef = db.collection('partidos');
        const snapshot = await partidosRef.get();
        if (snapshot.empty) {
          console.log('No matching documents.');
          return partidos ;
        }
        
    
        snapshot.forEach(doc => {
          partidos.push(doc.data());
        });  
         
        return partidos;
}

exports.getUsuarios = async function () {  
    var usuarios = [];
    const usuariosRef = db.collection('usuarios');
    const snapshot = await usuariosRef.orderBy('puntos', 'desc').get();
    if (snapshot.empty) {
      console.log('No matching documents.');
      return usuarios;
    }
    

    snapshot.forEach(doc => {
      usuarios.push(doc.data());
    });  
     
    return usuarios;
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

exports.callGetPartidos = async function () {
  var options = {
    host: 'partidosService:8080',
    path: '/',
    method: 'GET' 
  };

  callback = function(response) {
        var str = '';
      
        //another chunk of data has been received, so append it to `str`
        response.on('data', function (chunk) {
          str += chunk;
        });
      
        //the whole response has been received, so we just print it out here
        response.on('end', function () {
          console.log(str);
          partidos = JSON.parse(str);
        });
      }
      
      var req = https.request(options, callback);
      req.write(JSON.stringify(body));
      req.end();

    }

    exports.callGetEquipos = async function () {
        var options = {
          host: 'equiposService:8080',
          path: '/',
          method: 'GET' 
        };
      
        callback = function(response) {
              var str = '';
            
              //another chunk of data has been received, so append it to `str`
              response.on('data', function (chunk) {
                str += chunk;
              });
            
              //the whole response has been received, so we just print it out here
              response.on('end', function () {
                console.log(str);
                partidos = JSON.parse(str);
              });
            }
            
            var req = https.request(options, callback);
            req.write(JSON.stringify(body));
            req.end();
      
          }   

exports.calcularResultadosGrupos = async function () { 
    var lpartidos = [];
    var equipos = [];
    
    //const partidosRef = db.collection('partidos');
    //const snapshotP = await partidosRef.where("jugado", "==", true).get();
    //if (snapshotP.empty) {
    //  console.log('No matching documents.');
    //} 

    
    //snapshotP.forEach(doc => {
    //    partidos.push(doc.data());
    // });
   
    await callGetPartidos();
    
    const equiposRef = db.collection('equipos');
    const snapshotE = await equiposRef.get();
    if (snapshotE.empty) {
       console.log('No matching documents.');
    } 
 
    snapshotE.forEach(doc => {
         equipos.push(doc.data());
      }); 

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
      var equipo1 = equipos.findIndex(equipo => equipo.nombre === partidos[i].equipo1);
      var equipo2 = equipos.findIndex(equipo => equipo.nombre === partidos[i].equipo2);

       // Equipo 1 (Local)
      equipos[equipo1].jugados = equipos[equipo1].jugados + 1;
      equipos[equipo1].golesAFavor = equipos[equipo1].golesAFavor + partidos[i].golesLocal;
      equipos[equipo1].golesEnContra = equipos[equipo1].golesEnContra + partidos[i].golesVisitante;
      if (partidos[i].resultado == 'L') { equipos[equipo1].ganados = equipos[equipo1].ganados + 1;
                                          equipos[equipo1].puntos = equipos[equipo1].puntos + 3;  }
      if (partidos[i].resultado == 'E') { equipos[equipo1].empatados = equipos[equipo1].empatados + 1; 
                                          equipos[equipo1].puntos = equipos[equipo1].puntos + 1;}
      if (partidos[i].resultado == 'V') { equipos[equipo1].perdidos = equipos[equipo1].perdidos + 1; }

      // Equipo 2 (Visitante)

      equipos[equipo2].jugados = equipos[equipo2].jugados + 1;
      equipos[equipo2].golesAFavor = equipos[equipo2].golesAFavor + partidos[i].golesVisitante;
      equipos[equipo2].golesEnContra = equipos[equipo2].golesEnContra + partidos[i].golesLocal;
      if (partidos[i].resultado == 'V') { equipos[equipo2].ganados = equipos[equipo2].ganados + 1;
                                          equipos[equipo2].puntos = equipos[equipo2].puntos + 3;  }
      if (partidos[i].resultado == 'E') { equipos[equipo2].empatados = equipos[equipo2].empatados + 1; 
                                          equipos[equipo2].puntos = equipos[equipo2].puntos + 1;}
      if (partidos[i].resultado == 'L') { equipos[equipo2].perdidos = equipos[equipo2].perdidos + 1; }

    }

    for (let i = 0; i < equipos.length; i++) {
        const res = db.collection('equipos').doc(equipos[i].nombre).set(equipos[i]);
    }
    return equipos;
}   

// Ejecutar Workflow
exports.ejecutarWorkflow = async function (usuario)  { 
    // Execute workflow
    try {
        const createExecutionRes = await client.createExecution({
          parent: client.workflowPath(projectId, location, workflow),
          execution: {
            argument: JSON.stringify(usuario),
          },   
        });
        const executionName = createExecutionRes[0].name;
        console.log(`Created execution: ${executionName}`);
      
        // Wait for execution to finish, then print results.
        let executionFinished = false;
        let backoffDelay = 1000; // Start wait with delay of 1,000 ms
        console.log('Poll every second for result...');
        while (!executionFinished) {
          const [execution] = await client.getExecution({
            name: executionName,
          });
          executionFinished = execution.state !== 'ACTIVE';
      
          // If we haven't seen the result yet, wait a second.
          if (!executionFinished) {
            console.log('- Waiting for results...');
            await sleep(backoffDelay);
            backoffDelay *= 2; // Double the delay to provide exponential backoff.
          } else {
            console.log(`Execution finished with state: ${execution.state}`);
            console.log(execution.result);
            return execution.result;
          }
        }
      } catch (e) {
        console.error(`Error executing workflow: ${e}`);
      }
    }

/*

var options = {
    host: 'api.appsheet.com',
    path: '/api/v2/apps/' + appId + '/tables/' + tableName + '/Action',
    method: 'POST',
    headers: { 'ApplicationAccessKey': apiKey, 'Content-Type': 'application/json'}
  };

  // POST
  // https://api.appsheet.com/api/v2/apps/{appId}/tables/{tableName}/Action

  var body = 
  {
    "Action": "Find",
    "Properties": {
       "Locale": "en-US",
       "Location": "47.623098, -122.330184",
       "Timezone": "Pacific Standard Time",
       "UserSettings": {
          "Option 1": "value1",
          "Option 2": "value2"
       }
    },
    "Rows": [
    ]
    };

    callback = function(response) {
        var str = '';
      
        //another chunk of data has been received, so append it to `str`
        response.on('data', function (chunk) {
          str += chunk;
        });
      
        //the whole response has been received, so we just print it out here
        response.on('end', function () {
          console.log(str);
          partidos = JSON.parse(str);
        });
      }
      
      var req = https.request(options, callback);
      req.write(JSON.stringify(body));
      req.end();

    }

    */
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
