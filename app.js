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

var dynamodbDoc = new AWS.DynamoDB.DocumentClient();


app.use(express.static('public'));
app.use(express.static('../../node_modules/bootstrap/'));
app.use(express.static('socket.io'));
app.use(express.static('public/resumeMain'));


server.listen(8080);
console.log("listening on Port: 8080");

app.get('/', function(req, res) {
    res.sendFile(path + 'index.html');
});

app.get('/form', function(req, res) {
    res.sendFile(path + 'form.html');
})





io.on('connection', function(socket) {
    socket.on('login', function (data) {
        // authenticate(data.u, data.p);
        console.log(data.u);
        console.log(data.p);
        authenticate(data.u, data.p,socket);
    });

    socket.on('register', function (data) {
    	console.log(data.u);
        console.log(data.p);
    	addToDatabase(data.u, data.p,data.n,data.e);
    });
});



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
            console.log("Query succeeded.");
            // console.log(data);
            if(data.Count > 0){
                console.log("user id already exists!");
            }
            else {
                console.log("Adding a new item...");
                dynamodbDoc.put(params, function(err, data) {
                    if (err) {
                        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        console.log("Insert successfully");
                    }
                });
            }
        }
    });
}



function authenticate(user_id,password,socket){
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
            console.log("Query succeeded.");
            var found = false;
            data.Items.forEach(function(item) {
                if(item.password === password){
                    console.log("Found match in database!");
                    found = true;
                    socket.emit('reply', {url: 'resumeMain/index.html'} )
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


