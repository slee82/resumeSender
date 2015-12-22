var express = require('express')
var app = express();
var server = require('http').Server(app);
var path = __dirname + '/public/';
var path2 = __dirname = '/public/resumeMain';

var io = require('socket.io')(server)

var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
});

require('dotenv').load();




var dynamodbDoc = new AWS.DynamoDB.DocumentClient();


app.use(express.static('public'));
app.use(express.static('../../node_modules/bootstrap/'));
app.use(express.static('socket.io'));
app.use(express.static('public/resumeMain'));


server.listen(80);
console.log("listening on Port: 80");

app.get('/', function(req, res) {
    res.sendFile(path + 'index.html');
});

app.get('/form', function(req, res) {
    res.sendFile(path + 'form.html');
})


var globalUserInfo = []; 

var iosClientSockets = {};
var webClientSockets = {};

io.on('connection', function(socket) {
    var address = socket.handshake.address;
    var ip = address.split(':')[3];
    console.log(ip);
    
    socket.on('login', function (data) {
        console.log('User Name: ' + data.u);
        console.log('Password: '  + data.p);
        console.log('session ID: '+ data.s);
        
        globalUserInfo.push({
        	sessionID: data.s,
        	userName : data.u
        });
      
        authenticate(data.u, data.p, data.s, socket, iosClientSockets[ip]);
        webClientSockets[ip] = socket;
    });

    socket.on('ios', function (data) {
        console.log('got iOS client');
        iosClientSockets[ip] = socket;
        console.log(iosClientSockets[ip].handshake.address);
    })

    socket.on('register', function (data) {
    	console.log(data.u);
        console.log(data.p);

    	addToDatabase(data.u, data.p,data.n,data.e, data.t);
    });
    
    socket.emit('test', {test: 'hi!!'});
    socket.on('test', function(data) {
        console.log(data.data);
    });

    socket.on('key', function (data) {
        socket.emit('key', {k:process.env.aws_access_key_id, s:process.env.aws_secret_access_key});
    });

    socket.on('sendToIOS', function(data) {
        console.log('sending url: '+data.url);
        iosClientSockets[ip].emit('sendResume', {data: data.url});
    });

    socket.on('receiveResume', function(data) {
        console.log('received from '+ data.id+ ' url: '+ data.url)
        webClientSockets[ip].emit('newResume', {data: data.url});
        console.log('sent new resume to client');
    });
});


// add user information into database
function addToDatabase(user_id,password,name,email){
    var params = {
      TableName: "resumeSenderAccounts",
      Item: {
          "user_id": user_id,
          "password": password,
          "name": name,
          "email": email
      }
    };

    var searchParam = {
        TableName : "resumeSenderAccounts",
        KeyConditionExpression: "#user_id = :ui",
        ExpressionAttributeNames:{
            "#user_id": "user_id"
        },
        ExpressionAttributeValues: {
            ":ui": user_id
        }
    };
    dynamodbDoc.query(searchParam, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            if(data.Count > 0){
                console.log("user id already exists!");
            }
            else {
                console.log("Adding a new item to databse...");
                dynamodbDoc.put(params, function(err, data) {
                    if (err) {
                        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        console.log("Data inserted successfully");
                    }
                });
            }
        }
    });
}


// check if entered user information is valid
function authenticate(user_id, password, sessionID, socket, iosSocket){
    var params = {
        TableName : "resumeSenderAccounts",
        KeyConditionExpression: "#user_id = :ui",
        ExpressionAttributeNames:{
            "#user_id": "user_id"
        },
        ExpressionAttributeValues: {
            ":ui": user_id
        }
    };

    dynamodbDoc.query(params, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            var found = false;
            data.Items.forEach(function(item) {
                if(item.password === password){
                    console.log("Found matched profile in database!");
                    found = true;

                    socket.emit('reply', {url: 'resumeMain/index.html', session: sessionID} )
                    if (typeof iosSocket !== 'undefined'){
                        iosSocket.emit('uid', {user: user_id});
                        console.log('sent uid: '+user_id);
                    }
                }
                 // console.log(" -", item.user_id + ": " + item.password);
            });
            if( !found ){
                socket.emit('reply', {url: 'reindex.html'} )
                console.log("Not found!");
            }
        }
    });


}


