var express = require('express')
var app = express();
var server = require('http').Server(app);
var path = __dirname + '/public/';
var path2 = __dirname = '/public/resumeMain';
var config = require('./config.json');
var io = require('socket.io')(server)

var AWS = require("aws-sdk");
var S3Bucket = require( "ee-aws-s3-bucket" );
var s3 = new AWS.S3();

AWS.config.update({
  region: "us-east-1",
});

require('dotenv').load();

var sns = new AWS.SNS();


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
        console.log("ip is: " + ip);
        //webClientSockets[ip] = socket;
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

    
    socket.emit('key', {k:process.env.aws_access_key_id, s:process.env.aws_secret_access_key});
    
    socket.on('resumeSNS', function (data) {
        publishSNS(data.s);
        webClientSockets[ip] = socket;
        getUserFile3(data.uid, socket);
        
    })

    socket.on('sendToIOS', function(data) {
        console.log('sending url: '+data.url);
        webClientSockets[ip] = socket;
        iosClientSockets[ip].emit('sendResume', {data: data.url});
    });

    socket.on('waiting', function (data) {
        webClientSockets[ip] = socket;
        console.log("client watiting for resume");
    })
    socket.on('receiveResume', function(data) {
        console.log('received from '+ data.id+ ' url: '+ data.url);
        console.log(ip);
        console.log("this is valid: " + webClientSockets[ip].handshake.address);
        webClientSockets[ip].emit('newResume', {url: data.url});
        console.log('sent new resume to client at url: '+data.url);
    });

    socket.on('search', function(data){
        FindCandidates(data.u, socket);
    })
});


// publish sns to sqs
function publishSNS(mesg) {
  var publishParams = {
    TopicArn : config.TopicArn,
    Message: mesg
  };
  sns.publish(publishParams, function(err, data) {
    process.stdout.write("published to newResume topic\n");
  });
}


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

                    if (typeof iosSocket !== 'undefined'){
                        iosSocket.emit('uid', {user: user_id});
                        console.log('sent uid: '+user_id);
                    }


                    var params = {
                        TableName : "resumeSenderAccounts",
                        // ProjectionExpression: "#user_id",
                        KeyConditionExpression: "#uid = :user_id",  // retrieve tweets which has tweet_id greater than 0 (all tweets)
                        ExpressionAttributeNames:{
                            "#uid": "user_id",
                        },
                        ExpressionAttributeValues: {
                            ":user_id": user_id
                        }
                    };

                    dynamodbDoc.query(params, function(err, data) {
                        if (err) {
                            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("Query succeeded.");
                            data.Items.forEach(function(item) {
                                // if(item.type === 'Employer Representative'){
                                //     socket.emit('reply', {url: 'resumeMain/index_employer.html', type: item.type, userId: user_id} )
                                // }
                                // else if(item.type === 'Prospective Employee'){
                                //     socket.emit('reply', {url: 'resumeMain/index_employee.html', type: item.type, userId: user_id} )
                                // }
                                console.log(user_id, item.type)
                                getUserFile2(user_id, item.type, socket);
                                //socket.emit('reply', {url: 'resumeMain/index.html', type: item.type, userId: user_id} )
                            });
                        }
                    });

                    // socket.emit('reply', {url: 'resumeMain/index.html', session: sessionID} )

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



function findAccountType(userId){

    var params = {
        TableName : "resumeSenderAccounts",
        // ProjectionExpression: "#user_id",
        KeyConditionExpression: "#uid = :user_id",  // retrieve tweets which has tweet_id greater than 0 (all tweets)
        ExpressionAttributeNames:{
            "#uid": "user_id",
        },
        ExpressionAttributeValues: {
            ":user_id": userId
        }
    };

    dynamodbDoc.query(params, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            console.log("Query succeeded.");
            data.Items.forEach(function(item) {
                console.log(" -", item.type );
            });
        }
    });


}


function getUserFile(uid, utype, socket){
    
   // console.log("in get user file")
    var myBucket = new S3Bucket( {
          key: process.env.aws_access_key_id 
        , secret: process.env.aws_secret_access_key
        , bucket: "cloud2015project"
        , maxConcurrent: 10 // generic limit, overrrides the default of 10
        , maxConcurrentDownloads: 100 // limit to 100 concurrent downloads, overrides the generic limit
        , maxConcurrentUploads: 50 // limit to 50 concurrent uploads, overrides the generic limit
        , maxConcurrentDeletes: 200 // limit to 200 concurrent deletes, overrides the generic limit
        , maxConcurrentLists: 5 // limit to 5 concurrent lists, overrides the generic limit
    });


    var handleListResult = function( err, list, next ){
        if ( err ) log.trace( err );
        
        else {
            var fileList = []

            for(var i=0;i<list.length; i++){

                // console.log(list[i].key)
                if((list[i].key).indexOf(uid) > -1){
                    // fileList.push('https://s3.amazonaws.com/cloud2015project/'+list[i].key);
                    console.log("ironman!!" + list[i].key)
                    fileList.push(list[i].key);
                    if (i+1 > 4){
                        break;
                    }
                }
                    
            }
            // console.log(utype, uid)
            var fileListText = ''
            for(var j=0;j<fileList.length;j++){
                fileListText += "?" + fileList[j]
            }
            console.log(fileListText)
            socket.emit('reply', {url: 'resumeMain/index.html', type: utype, userId: uid, files: fileListText} );
            // get the next 1'000 items if available
            // if( next ) next( handleListResult );
                
            // }
        }

    

    }
    myBucket.list( 'r' , handleListResult );
}

function getUserFile2(uid, utype, socket){

    var params = {
      Bucket: 'cloud2015project', /* required */
      Delimiter: '',
      EncodingType: 'url',
      Marker: '',
      MaxKeys: 100,
      Prefix: ''
    };
    s3.listObjects(params, function(err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
      }
      else{
        var fileList = []

        for(var i = 0; i<data.Contents.length; i++){
              if(fileList.length === 4) break;
              if((data.Contents[i].Key).indexOf(uid)>-1){
                fileList.push(data.Contents[i].Key);
              }
        }
        var fileListText = ''
        for(var j=0;j<fileList.length;j++){
            fileListText += "?" + fileList[j]
        }
        console.log(fileListText)
            socket.emit('reply', {url: 'resumeMain/index.html', type: utype, userId: uid, files: fileListText} );
   


      }
    });

}

function getUserFile3(uid, socket){

    var params = {
      Bucket: 'cloud2015project', /* required */
      Delimiter: '',
      EncodingType: 'url',
      Marker: '',
      MaxKeys: 100,
      Prefix: ''
    };
    s3.listObjects(params, function(err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
      }
      else{
        var fileList = []

        for(var i = 0; i<data.Contents.length; i++){
          if(fileList.length === 3) break;
          if((data.Contents[i].Key).indexOf(uid)>-1){
            fileList.push(data.Contents[i].Key);
          }
        }
        var fileListText = ''
        for(var j=0;j<fileList.length;j++){
            fileListText += "?" + fileList[j]
        }
        console.log(fileListText)
            
        socket.emit('updateRest', {files: fileListText} );
      }
    });

}

function FindCandidates(keyword, socket){
    var params = {
        TableName : "ResumeSearch",
        ProjectionExpression: "#url, #a1, #a2, #c1, #c2, #c3, #c4, #d, #f, #g, #h, #i, #j1, #j2, #m1, #m2, #m3, #p1, #p2, #r",
        FilterExpression: "#url <> :url",  // retrieve tweets which has tweet_id greater than 0 (all tweets)
        ExpressionAttributeNames:{
            "#url": "url",
            "#a1": "accounting",
            "#a2": "amazon",
            "#c1": "c",
            "#c2": "c++",
            "#c3": "chinese",
            "#c4": "css",
            "#d":  "database",
            "#f":  "french",
            "#g":  "google",
            "#h":  "html",
            "#i":  "illustrator",
            "#j1": "java",
            "#j2": "javascript",
            "#m1": "marketing",
            "#m2": "matlab",
            "#m3": "modeling",
            "#p1": "photoshop",
            "#p2": "python",
            "#r":  "r"
        },
        ExpressionAttributeValues: {
            ":url": null
        }
    };

    
    

    if (keyword !== 'void' ){
        dynamodbDoc.scan(params, function(err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            } else {
                var arr = []
                console.log("Query succeeded.");
                data.Items.forEach(function(item) {
                    if(item[keyword] === true){
                        arr.push(item.url);
                    }
                });
            }
            console.log(arr)
            socket.emit("searchResult", {r: arr});
        });
        
    }
}



