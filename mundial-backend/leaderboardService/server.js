var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const cors = require('cors');

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
    //res.render("about.html");
    res.send("Prode Mundial 2022 - Backend de Apuestas");
}); 


app.get('/leaderboard', (req, res) => { 
     
    data.calcularResultadosApuestas().then(function(usuarios) {  
        res.send(JSON.stringify(usuarios));
         
    });
}); 

app.get('/pendientes', (req, res) => {  

    data.getApuestasPendientes().then(function(usuarios) {
       res.send(JSON.stringify(usuarios));
    });  
});

app.get('/reporte', (req, res) => {  

    data.reporteApuestas().then(function(reporte) {
       res.send(JSON.stringify(reporte));
    });  
});

app.get('/auditar', (req, res) => {  

    data.auditar().then(function(auditoria) {
       res.send(JSON.stringify(auditoria));
    });  
});