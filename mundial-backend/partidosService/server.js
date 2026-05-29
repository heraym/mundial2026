var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const cors = require('cors');

var fs = require('fs');
var http = require('http');
  
 
var data = require('./data');
 

var apuestas = [];


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
    res.render("about.html");
}); 

app.get('/equipos', (req, res) => {
    data.getEquipos().then(function(equipos) {  
        res.send(JSON.stringify(equipos));
    });
});
app.get('/partidos', (req, res) => {
    data.getPartidos().then(function(partidos) {  
        res.send(JSON.stringify(partidos));
    });
}); 
app.post('/partidos', (req, res) => {
    console.log({ "operacion": "partido", "datos": JSON.stringify(req.body)});
    var ganador = req.body.Data.Ganador;
    var golesLocal = req.body.Data["Goles Local"];
    var golesVisitante = req.body.Data["Goles Visitante"];
    var estado = req.body.Data.Estado;
    var resultado = req.body.Data.Resultado;
    var partido = req.body.Data.Partido;
  
    data.nuevoPartido({ "partido": partido, "ganador": ganador, "golesLocal": golesLocal, "golesVisitante": golesVisitante, "estado": estado, "resultado": resultado});
       
    res.send("OK");
}); 

app.get('/partidos/proximos', (req, res) => {
    data.getProximosPartidos().then(function(partidos) {  
        res.send(JSON.stringify(partidos));
    });
}); 
