var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const cors = require('cors');

var fs = require('fs');
var http = require('http');
 
var data = require('./data');
 
const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);


// This displays message that the server running and listening to specified port
//app.listen(port, () => console.log(`Listening on port ${port}`)); //Line 6

var httpServer = http.createServer(app); 
console.log("Escuchando en puertos 8080");

httpServer.listen(8080); 
 
app.get('/', function(req,res,next) {
    res.send("OK");
}); 


app.post('/apuesta', (req,res) => {
    console.log("Llega una Nueva Apuesta"); 
    var usuario = req.body.usuario;
    var ganador = req.body.ganador;
    var golesLocal = req.body.golesLocal;
    var golesVisitante = req.body.golesVisitante;
    var partido = req.body.partido;
  
    data.nuevaApuesta({ "usuario": usuario, "ganador": ganador, "golesLocal": golesLocal, "golesVisitante": golesVisitante, "partido": partido});
       
    res.send("OK");
});


app.get('/apuestas', (req, res) => {  
    const usuario = req.query.usuario;
    data.getApuestas(usuario).then(function(apuestas) {
       res.send(JSON.stringify(apuestas));
    });  
});

// prueba cargar apuestas
app.get('/apuestas/generar', (req, res) => { 
    data.cargarApuestas(req.query.usuario).then(function(apuestas) {
       res.send(JSON.stringify(apuestas));
    });  
  }); 

 