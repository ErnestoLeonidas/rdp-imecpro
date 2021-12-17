require('dotenv').config();

const express = require('express');
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.port || 3000;

var user;

// configuración body parser para permitir json, y url encoded
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ejecuta el index.html
app.use(express.static('public'));

const connection = require('./config/config');
const verify = require('./config/verify');

//Cargar Controladores
//const acta_entrevista = require('./controllers/acta_entrevista');
//const menus = require('./controllers/menus');

// Configurar cabeceras y cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

app.post("/api/login", (req , res) => {
	const run = req.body.run;
    const password = req.body.password;
	// Verificar si cuenta ingresada (run/password) es válida
	const sql = 'SELECT id, primer_nombre AS primer_nombre, apellido_paterno AS apellido_paterno, genero, fecha_nacimiento, direccion, correo, foto, comuna_id  FROM Colaborador WHERE run = "' + run + '" AND pass = "' + password + '" AND estado = 1';
    connection.query(sql, (error, results) => {
        //console.log("Numero login :" +  JSON.parse(JSON.stringify(results)).length);
        if (error) throw error;
        if (JSON.parse(JSON.stringify(results)).length > 0) {
        	user = results[0];
        	//console.log(user);
        	//Verificar la cantidad de establecimientos que tiene asignados el colaborador
            const sql = 'SELECT coes.establecimiento_id as establecimiento_id, est.nombre as nombre_establecimiento, est.logo as logo_establecimiento, est.direccion as direccion_establecimiento, est.rbd as rbd, est.informe_titulo as informe_titulo, est.informe_subtitulo as informe_subtitulo FROM Colaborador_Establecimiento coes JOIN Establecimiento est ON coes.establecimiento_id = est.id WHERE coes.colaborador_id = "'+ user.id +'" AND coes.estado = 1';
			connection.query(sql, (error, results) => {
		        if (error) throw error;
		        cantidad_establecimiento = JSON.parse(JSON.stringify(results)).length;

		        //Si no tiene establecimiento mostrar error de que no tiene establecimiento asignado
		        if (cantidad_establecimiento == 0){
		        	console.log("No tiene establecimiento asignado");		        	
		            res.status(403).send('Usuario no está vinculado a ningun establecimiento');
		        }

		        // Si tiene 1 establecimiento obtener el id, y nombre del establecimiento
		        if (cantidad_establecimiento == 1){
		        	user.establecimiento_id = results[0].establecimiento_id;
		        	user.nombre_establecimiento = results[0].nombre_establecimiento;	
		        	user.logo_establecimiento = 	results[0].logo_establecimiento;
		        	user.rbd = 	results[0].rbd;
		        	user.informe_titulo = 	results[0].informe_titulo;
		        	user.informe_subtitulo = 	results[0].informe_subtitulo;   
		        	user.direccion_establecimiento = 	results[0].direccion_establecimiento;    			   
		            //console.log(user);
		        	//Verificar y obtener cargo de usuario y establecimiento indicado
					const sql = 'SELECT cargo_id FROM Colaborador_Establecimiento WHERE colaborador_id = "'+ user.id +'" AND establecimiento_id = "' + user.establecimiento_id +'" AND estado = 1';
					connection.query(sql, (error, results) => {
						if (error) throw error;
						if (results.length > 0) {
							user.cargo_id = results[0].cargo_id;
							//console.log(user);
							jwt.sign({user}, 'secretkey', {expiresIn: '24h'}, (err, token) => {	
							console.log({user}, {token});	
							//res.json({token,user});
							res.status(200).send({token,user});
					    });
							
						}
						
					})
		        		        	
		        }

		        if (cantidad_establecimiento > 1){
		        	console.log("Tiene mas de 1 establecimiento asignado");
		            res.send(results); 
		        }
		    })
        } else {
        	res.status(403).send('Usuario y/o contraseña incorrecta');
        }
    })
});

app.post("/api/test", verify, (req , res) => {

    jwt.verify(req.token, 'secretkey', (error, authData) => {
        if(error){
            res.status(403).send("Token invalido");
        }else{
            res.json({
                    mensaje: "Verificación de token exitoso",
                    authData
                });
        }
    });
});

app.get("/api/",function(req,res){
	res.send("Bienvenido a API Imecpro");
});

// Se inicia servidor
app.listen(port, function (){
    console.log('Servidor esta corriendo! http://localhost:3000/');
	controladores();
});

function controladores(){
	//Funcion de crear menú
	//app.use('/api_testing/redep/menus', menus.crear_menu);

}

