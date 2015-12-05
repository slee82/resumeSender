var express = require('express')
var app = express();
var server = require('http').Server(app);
var path = __dirname + '/public/';
//var io = require('socket.io')(server)



app.use(express.static('public'));
app.use(express.static('../../node_modules/bootstrap/'));




server.listen(8080);
console.log("listening on Port: 8080");

app.get('/', function(req, res) {
    res.sendFile(path + 'index.html');
});








