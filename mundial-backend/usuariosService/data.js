'use strict'

const {PubSub} = require('@google-cloud/pubsub');
const {Firestore} = require('@google-cloud/firestore');
const {ExecutionsClient} = require('@google-cloud/workflows');

const client = new ExecutionsClient();

const db = new Firestore();

var http = require('http');


exports.nuevoUsuario = async function (dataUsuario) {
    var usuario = {};
    
    usuario.apellido = dataUsuario.apellido;
    usuario.nombre = dataUsuario.nombre;
    usuario.email = dataUsuario.usuario;
    usuario.puntos = 0;
    usuario.usuario = dataUsuario.usuario;
    
 
    const res = db.collection('usuarios').doc(usuario.usuario).set(usuario); 
}

exports.getUsuario = async function (email) {  
    if (!email) return null;
    const docRef = db.collection('usuarios').doc(email);
    const doc = await docRef.get();
    if (!doc.exists) {
        return null;
    }
    return doc.data();
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
