var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const cors = require('cors');
var fs = require('fs');
var http = require('http');
var data = require('./data');

// Importar SDK de Firebase Admin
const admin = require('firebase-admin');

// Inicializar Firebase Admin
try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
    console.log("Firebase Admin SDK inicializado exitosamente.");
} catch (e) {
    console.warn("Firebase Admin no se pudo inicializar con credenciales por defecto de aplicación.", e.message);
    console.warn("Asegúrate de configurar la variable de entorno GOOGLE_APPLICATION_CREDENTIALS si estás corriendo en un entorno local.");
}

var apuestas = [];

const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

var httpServer = http.createServer(app); 
console.log("Escuchando en puertos 8080");
httpServer.listen(8080); 

app.get('/', function(req,res,next) {
    res.render("about.html");
}); 

// Endpoint para obtener el perfil del usuario autenticado actual
app.get('/usuarios/me', async (req, res) => {
    let email = null;
    
    // 1. Intentar validar Token de Firebase desde la cabecera Authorization (Portador Bearer)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            email = decodedToken.email;
        } catch (error) {
            console.error("Error al decodificar y validar el ID Token de Firebase:", error.message);
            return res.status(401).json({ error: 'Token de autenticación de Firebase inválido o vencido.' });
        }
    }
    
    // 2. Fallback a cabeceras de Google IAP (Identity-Aware Proxy en producción)
    if (!email) {
        email = req.headers['x-goog-authenticated-user-email'];
        if (email && email.startsWith('accounts.google.com:')) {
            email = email.substring('accounts.google.com:'.length);
        }
    }
    
    // 3. Fallback a simulación de desarrollo local (móck email)
    if (!email) {
        email = req.headers['x-mock-user-email'] || req.query.mockEmail;
    }
    
    if (!email) {
        return res.status(401).json({ error: 'No se encontró ninguna cabecera o token de autenticación válido.' });
    }
    
    try {
        const usuario = await data.getUsuario(email);
        if (usuario) {
            res.json({ email: email, registrado: true, usuario: usuario });
        } else {
            res.json({ email: email, registrado: false });
        }
    } catch (err) {
        console.error("Error al obtener datos de Firestore para el email " + email + ":", err);
        res.status(500).send("Error interno de servidor al procesar Firestore.");
    }
});

app.get('/usuarios', (req, res) => {
    data.getUsuarios().then(function(usuarios) {  
        res.send(JSON.stringify(usuarios));
    });
});

app.post('/usuario', (req, res) => {
    console.log({ "operacion": "usuario", "dato": req.body});
    var usuario = req.body.Data.Usuario;
    var nombre = req.body.Data.Nombre;
    var apellido = req.body.Data.Apellido; 
  
    data.nuevoUsuario({ "usuario": usuario, "nombre": nombre, "apellido": apellido});
       
    res.send("OK");
}); 

