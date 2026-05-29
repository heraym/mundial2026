var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const cors = require('cors');

var fs = require('fs');
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('sslcert/selfsigned.key', 'utf8');
var certificate = fs.readFileSync('sslcert/selfsigned.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};

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
var httpsServer = https.createServer(credentials, app);
console.log("Escuchando en puertos 8080 y 8443");

httpServer.listen(8080);
httpsServer.listen(8443); 
 
app.get('/', function(req,res,next) {
    res.render("about.html");
}); 


app.post('/appsheet', function(req,res,next) {
    console.log("appsheet:" + JSON.stringify(req.body));
    apuestas.push(req.body.Data);
    res.send("OK");
});


app.get('/partidos', (req, res) => {
    data.getPartidos().then(function(partidos) {  
        res.send(JSON.stringify(partidos));
    });
}); 
app.get('/partidos/proximos', (req, res) => {
    data.getProximosPartidos().then(function(partidos) {  
        res.send(JSON.stringify(partidos));
    });
}); 
app.get('/grupos/resultados', (req, res) => {
    data.calcularResultadosGrupos().then(function(equipos) {  
        res.send(JSON.stringify(equipos));
    });
}); 
app.get('/usuarios', (req, res) => {
    data.getUsuarios().then(function(usuarios) {  
        res.send(JSON.stringify(usuarios));
    });
});

app.post('/usuarios', function(req,res,next) {
    console.log("usuario:" + JSON.stringify(req.body));
    data.ejecutarWorkflow(req.body);
    res.send("OK");
});

/* 



var express = require('express');
var app = express();

// your express configuration here



sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./selfsigned.key -out selfsigned.crt

*/
