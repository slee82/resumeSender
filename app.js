var express = require('express')
var app = express();
var server = require('http').Server(app);
var path = __dirname + '/public/';

var io = require('socket.io')(server)


//var io = require('socket.io')(server)



app.use(express.static('public'));
app.use(express.static('../../node_modules/bootstrap/'));
app.use(express.static('socket.io'));




server.listen(8080);
console.log("listening on Port: 8080");

app.get('/', function(req, res) {
    res.sendFile(path + 'index.html');
});

app.get('/form', function(req, res) {
    res.send(reg_form.toHTML(bootstrapField));
})





io.on('connection', function(socket) {
    socket.on('login', function (data) {
        console.log(data.u);
        // console.log(data.p);
        
    });

    // socket.on('register', function (data) {
    // }):
});



