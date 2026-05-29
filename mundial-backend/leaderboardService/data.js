'use strict'

const {PubSub} = require('@google-cloud/pubsub');
const {Firestore} = require('@google-cloud/firestore');

const db = new Firestore();

var http = require('http');
var https = require('https');
const request = require('request');

 
var usuarios = [];
var partidos = [];
var apuestas = [];
 
function callGetApuestas() {
    return new Promise((resolve, reject) => {
        request("http://apuestasservice:8080/apuestas", (error, response, body) => {
            if (error) reject(error);
            apuestas = JSON.parse(body);
            resolve(body);
        });
    });
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

function callGetPartidos() {
    return new Promise((resolve, reject) => {
        request("http://partidosservice:8080/partidos", (error, response, body) => {
            if (error) reject(error);
            partidos = JSON.parse(body);
            resolve(body);
        });
    });
}


/*exports.nuevoUsuario = async function (inputUsuario) {
    var usuario = { "usuario": inputUsuario.usuario,
                    "nombre": inputUsuario.nombre,
                    "apellido": inputUsuario.apellido,
                    "area": inputUsuario.area,
                    "puntos": 0 };
    const res = db.collection('usuarios').doc().set(usuario);

    // Notifica evento
    enviarEvento("projects/projectodemos/topics/mundial2022", JSON.stringify({ "evento": "Nuevo Usuario", "usuario" : usuario}));    

}*/

exports.calcularResultadosApuestas = async function () { 
    
    await callGetUsuarios();
    await callGetPartidos();
    await callGetApuestas();


    for (let i = 0; i < apuestas.length; i++) { 
        apuestas[i].golesLocal = parseInt(apuestas[i].golesLocal);
        apuestas[i].golesVisitante = parseInt(apuestas[i].golesVisitante);
    } 
    
    //Inicializo a todos los usuarios en 0
    for (let i = 0; i < usuarios.length; i++) { 
        usuarios[i].puntos = 0;
    } 

    for (let i = 0; i < partidos.length; i++) {
        if (partidos[i].jugado === true) {
        for (let j = 0; j < usuarios.length; j++) {
      
             var apuesta = apuestas.find(apuesta => (apuesta.usuario === usuarios[j].usuario) && (apuesta.partido === partidos[i].id));
             
             if (apuesta != null) {
                 var puntos = 0;
                 var resultado = "";
                 if (apuesta.golesLocal > apuesta.golesVisitante) { resultado = "L"; }
                 else { if (apuesta.golesLocal < apuesta.golesVisitante) { resultado = "V";} 
                         else { resultado = "E";}}
                 console.log("usuario:" + apuesta.usuario + "partido:" + apuesta.partido + "resultado: " + resultado);

                 if (partidos[i].fase === "Grupos") {
                     if (resultado == partidos[i].resultado) { console.log(usuarios[j].usuario + " partido " + apuesta.partido + " resultado OK +1 goles " ); puntos = puntos + 1;}
                     console.log(usuarios[j].usuario + " partido " + apuesta.partido + " golesLocal:" + apuesta.golesLocal + "-" + partidos[i].golesLocal + " golesVisitante:" + apuesta.golesVisitante + "-" + partidos[i].golesVisitante);
                     if ((apuesta.golesLocal == partidos[i].golesLocal) && (apuesta.golesVisitante == partidos[i].golesVisitante)) {
                        console.log(usuarios[j].usuario + " partido " + apuesta.partido + " goles OK +2 ");
                        puntos = puntos + 2;
                        
                        if (parseInt(partidos[i].golesLocal) + parseInt(partidos[i].golesVisitante) > 3) { 
                           console.log(usuarios[j].usuario + " partido " + apuesta.partido + " goles>3 +1 ");
                           puntos = puntos + 1;}
                     }    
                 }
                 if (partidos[i].fase === "Octavos") {
                    if (resultado == partidos[i].resultado) { console.log(usuarios[j].usuario + " partido " + apuesta.partido + " resultado OK +2 goles " ); puntos = puntos + 2;}
                    console.log(usuarios[j].usuario + " partido " + apuesta.partido + " golesLocal:" + apuesta.golesLocal + "-" + partidos[i].golesLocal + " golesVisitante:" + apuesta.golesVisitante + "-" + partidos[i].golesVisitante);
                    if ((apuesta.golesLocal == partidos[i].golesLocal) && (apuesta.golesVisitante == partidos[i].golesVisitante)) {
                       console.log(usuarios[j].usuario + " partido " + apuesta.partido + " goles OK +4 ");
                       puntos = puntos + 4;
                       
                       if (parseInt(partidos[i].golesLocal) + parseInt(partidos[i].golesVisitante) > 3) { 
                          console.log(usuarios[j].usuario + " partido " + apuesta.partido + " goles>3 +1 ");
                          puntos = puntos + 1;}
                    }    
                }
                if (partidos[i].fase === "Cuartos") {
                    if (resultado == partidos[i].resultado) { console.log(usuarios[j].usuario + " partido " + apuesta.partido + " resultado OK +3 goles " ); puntos = puntos + 3;}
                    console.log(usuarios[j].usuario + " partido " + apuesta.partido + " golesLocal:" + apuesta.golesLocal + "-" + partidos[i].golesLocal + " golesVisitante:" + apuesta.golesVisitante + "-" + partidos[i].golesVisitante);
                    if ((apuesta.golesLocal == partidos[i].golesLocal) && (apuesta.golesVisitante == partidos[i].golesVisitante)) {
                       console.log(usuarios[j].usuario + " partido " + apuesta.partido + " goles OK +6 ");
                       puntos = puntos + 6;
                       
                       if (parseInt(partidos[i].golesLocal) + parseInt(partidos[i].golesVisitante) > 3) { 
                          console.log(usuarios[j].usuario + " partido " + apuesta.partido + " goles>3 +1 ");
                          puntos = puntos + 1;}
                    }    
                }
                if (partidos[i].fase === "Finales") {
                    if (resultado == partidos[i].resultado) { console.log(usuarios[j].usuario + " partido " + apuesta.partido + " resultado OK +4 goles " ); puntos = puntos + 4;}
                    console.log(usuarios[j].usuario + " partido " + apuesta.partido + " golesLocal:" + apuesta.golesLocal + "-" + partidos[i].golesLocal + " golesVisitante:" + apuesta.golesVisitante + "-" + partidos[i].golesVisitante);
                    if ((apuesta.golesLocal == partidos[i].golesLocal) && (apuesta.golesVisitante == partidos[i].golesVisitante)) {
                       console.log(usuarios[j].usuario + " partido " + apuesta.partido + " goles OK +8 ");
                       puntos = puntos + 8;
                       
                       if (parseInt(partidos[i].golesLocal) + parseInt(partidos[i].golesVisitante) > 3) { 
                          console.log(usuarios[j].usuario + " partido " + apuesta.partido + " goles>3 +1 ");
                          puntos = puntos + 1;}
                    }    
                }

              usuarios[j].puntos = usuarios[j].puntos + puntos;
             } 
        }   
        }  
      
    }  
     
    for (let i = 0; i < usuarios.length; i++) {
        const res = db.collection('usuarios').doc(usuarios[i].usuario).set(usuarios[i]);
    }
    return usuarios;
}   

exports.getApuestasPendientes = async function () { 
    
    
    var usuarios = [];
    const usuariosRef = db.collection('usuarios');
    const snapshot = await usuariosRef.orderBy('puntos', 'desc').get();
    if (snapshot.empty) {
      console.log('No matching documents.');
       
    }
    

    snapshot.forEach(doc => {
      usuarios.push(doc.data());
    });  

    var partidos = [];
    const partidosRef = db.collection('partidos');
    const snapshotP = await partidosRef.get();
    if (snapshotP.empty) {
      console.log('No matching documents.');
    
    }

    snapshotP.forEach(doc => {
      const data = doc.data();
      data.id = data.partido || doc.id;
      partidos.push(data);
    });  

    var apuestas = [];
    const apuestasRef = db.collection('apuestas');
    const snapshotA = await apuestasRef.get();
    if (snapshotA.empty) {
      console.log('No matching documents.');
    }

    snapshotA.forEach(doc => {
      apuestas.push(doc.data());
    });  
    var faltantes = [];
    let hoy = new Date();
    hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    let maniana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
    

    // Hoy y mañana
    for (let i = 0; i < partidos.length; i++) {
        let diaPartido;
        const rawDia = partidos[i].dia;
        
        if (!rawDia) {
            diaPartido = new Date(0);
        } else if (typeof rawDia === 'string') {
            if (rawDia.includes('/')) {
                var parts = rawDia.split('/');
                diaPartido = new Date(parts[2], parts[1] - 1, parts[0]);
            } else {
                diaPartido = new Date(rawDia);
            }
        } else if (typeof rawDia.toDate === 'function') {
            diaPartido = rawDia.toDate();
        } else if (rawDia._seconds !== undefined) {
            diaPartido = new Date(rawDia._seconds * 1000);
        } else {
            diaPartido = new Date(rawDia);
        }

        // Normalize to the start of the day in local time for precise comparison
        diaPartido = new Date(diaPartido.getFullYear(), diaPartido.getMonth(), diaPartido.getDate()); 
         //console.log("hoy:" + hoy + " partido:" + diaPartido + " p:" + partidos[i].partido);
         if (diaPartido.getTime() == hoy.getTime()) { 
            for (let j = 0; j < usuarios.length; j++) {
                var apuesta = apuestas.find(apuesta => (apuesta.usuario === usuarios[j].usuario) && (apuesta.partido === partidos[i].id));
                if (apuesta == null) {
                  faltantes.push({"usuario": usuarios[j].usuario, "partido": partidos[i].partido});
                }
            };
         }    
         if (diaPartido.getTime() == maniana.getTime()) { 
            for (let j = 0; j < usuarios.length; j++) {
                var apuesta = apuestas.find(apuesta => (apuesta.usuario === usuarios[j].usuario) && (apuesta.partido === partidos[i].id));
                if (apuesta == null) {
                  faltantes.push({"usuario": usuarios[j].usuario, "partido": partidos[i].partido});
                }
            };
         }  
    }    
    return faltantes;
}   

exports.reporteApuestas = async function () { 
    
    
    var usuarios = [];
    const usuariosRef = db.collection('usuarios');
    const snapshot = await usuariosRef.get();
    if (snapshot.empty) {
      console.log('No matching documents.');
    }
    

    snapshot.forEach(doc => {
      usuarios.push(doc.data());
    });    

    var apuestas = [];
    const apuestasRef = db.collection('apuestas');
    const snapshotA = await apuestasRef.get();
    if (snapshotA.empty) {
      console.log('No matching documents.');
    }

    snapshotA.forEach(doc => {
      apuestas.push(doc.data());
    });  

    var totalSheet = 0;
    for (let i = 0; i < usuarios.length; i++) {
        var apuestasSheet = await getApuestasAppsheet(usuarios[i].usuario);
        usuarios[i].sheet = apuestasSheet;
        totalSheet = totalSheet + apuestasSheet.length;
    }
    // Calculo
    var errores = [];
    for (let i = 0; i < usuarios.length; i++) {
        for (let j = 0; j < usuarios[i].sheet.length; j++) {
              var apuesta = apuestas.find(apuesta => (apuesta.usuario === usuarios[i].usuario) && (apuesta.partido === usuarios[i].sheet[j].Partido));
              if (apuesta == null) { 
                  errores.push("No encontre apuesta de " + usuarios[i].usuario + " partido " + usuarios[i].sheet[j].Partido);
              } else {
                  if (apuesta.golesLocal != usuarios[i].sheet[j]["Goles Local"]) {
                    errores.push("Error en apuesta de " + usuarios[i].usuario + " partido " + usuarios[i].sheet[j].Partido);
                  }
                  if (apuesta.golesVisitante != usuarios[i].sheet[j]["Goles Visitante"]) {
                    errores.push("Error en apuesta de " + usuarios[i].usuario + " partido " + usuarios[i].sheet[j].Partido);
                  }
              }
        }
    }      

    var reporte = { "usuarios" : usuarios.length, "apuestas": apuestas.length, "sheet": totalSheet, "errores": errores}; 
    return reporte;
} 

async function getApuestasAppsheet(usuario) {
    var appId = "3d9b8025-0d99-4322-893a-c278ad859fa5";
    var apiKey = "V2-xKKMG-LprjJ-y8Xnj-HcuSA-lbbfU-KTEkm-sAl4A-zbjZd";
    var tableName = "Apuesta";
    var options = {
        host: 'api.appsheet.com',
        path: '/api/v2/apps/' + appId + '/tables/' + tableName + '/Action',
        method: 'POST',
        headers: { 'ApplicationAccessKey': apiKey, 'Content-Type': 'application/json'}
     };
  
    // POST
    var url = "https://api.appsheet.com/api/v2/apps/" + appId + "/tables/"+ tableName + "/Action";

  
    var body = 
     {
      "Action": "Find",
      "Properties": {
         "Locale": "en-US",
         "Location": "47.623098, -122.330184",
         "Timezone": "Pacific Standard Time" ,
         "RunAsUserEmail": usuario
      },
      "Rows": []
      };
    
      async function postAppSheet(url, options, body) {
        return new Promise((resolve, reject) => {
  
           const req = https.request(url, options,(resp) => {
               if (resp.statusCode < 200 || resp.statusCode > 299) {
                  return reject(new Error(`HTTP status code ${res.statusCode}`))
               }
               const body = []
               resp.on('data', (chunk) => body.push(chunk))
               resp.on('end', () => {
                  const resString = Buffer.concat(body).toString()
                  resolve(resString)
               })
           })    
         
           req.on('error', (err) => {
              console.log("error:" + err);
              reject(err)
            })
        
            req.on('timeout', () => {
              req.destroy()
              reject(new Error('Request time out'))
            })
          
            req.write(JSON.stringify(body));
            req.end();
          })   
      }
          
     const res = await postAppSheet(url, options, body);
        
     var respuesta = JSON.parse(res);
     
    return respuesta;

}
 
async function getPartidosAppsheet() {
    var options = {
        host: 'api.appsheet.com',
        path: '/api/v2/apps/' + appId + '/tables/Partidos/Action',
        method: 'POST',
        headers: { 'ApplicationAccessKey': apiKey, 'Content-Type': 'application/json'}
     };
  
    // POST
    var url = "https://api.appsheet.com/api/v2/apps/" + appId + "/tables/Partidos/Action";

  
    var body = 
     {
      "Action": "Find",
      "Properties": {
         "Locale": "en-US",
         "Location": "47.623098, -122.330184",
         "Timezone": "Pacific Standard Time" 
      },
      "Rows": []
      };
    
      async function postAppSheet(url, options, body) {
        return new Promise((resolve, reject) => {
  
           const req = https.request(url, options,(resp) => {
               if (resp.statusCode < 200 || resp.statusCode > 299) {
                  return reject(new Error(`HTTP status code ${res.statusCode}`))
               }
               const body = []
               resp.on('data', (chunk) => body.push(chunk))
               resp.on('end', () => {
                  const resString = Buffer.concat(body).toString()
                  resolve(resString)
               })
           })    
         
           req.on('error', (err) => {
              reject(err)
            })
        
            req.on('timeout', () => {
              req.destroy()
              reject(new Error('Request time out'))
            })
          
            req.write(JSON.stringify(body));
            req.end();
          })   
      }
          
     const res = await postAppSheet(url, options, body);
        
    var respuesta = JSON.parse(res);
     
    return respuesta;

}

exports.auditar = async function () { 
    
    var auditoria = [];
    var usuario = "haymard@google.com";

    var partidos = [];
    const partidosRef = db.collection('partidos');
    const snapshot = await partidosRef.get();
    if (snapshot.empty) {
      console.log('No matching documents.');
    }
    

    snapshot.forEach(doc => {
      partidos.push(doc.data());
    });    

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

    for (let i = 0; i < partidos.length; i++) {
        if (partidos[i].jugado === true) {
         
             var apuesta = apuestas.find(apuesta => (apuesta.usuario === usuario) && (apuesta.partido === partidos[i].id));
             
             if (apuesta != null) {
                 var puntos = 0;
                 var resultado = "";
                 if (apuesta.golesLocal > apuesta.golesVisitante) { resultado = "L"; }
                 else { if (apuesta.golesLocal < apuesta.golesVisitante) { resultado = "V";} 
                         else { resultado = "E";}}
                         

                 if (partidos[i].fase === "Grupos") {
                     if (resultado == partidos[i].resultado) { 
                         auditoria.push( { "usuario": usuario, "partido": partidos[i].partido, "resultado": "+1"});
                         puntos = puntos + 1;}
                     
                     if ((apuesta.golesLocal == partidos[i].golesLocal) && (apuesta.golesVisitante == partidos[i].golesVisitante)) {
                        auditoria.push({ "usuario": usuario,  "partido": partidos[i].partido, "resultado": "+2"});
                        puntos = puntos + 2;
                        
                        if (parseInt(partidos[i].golesLocal) + parseInt(partidos[i].golesVisitante) > 3) { 
                            auditoria.push({ "usuario": usuario,  "partido": partidos[i].partido, "resultado": ">3 +1"});
                           puntos = puntos + 1;}
                     }    
                 }
             } 
        }   
    }  
      
    return auditoria;
}  