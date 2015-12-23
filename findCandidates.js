// Scan through dynamo db and retrieve tweets which contains 'keyword' in text

var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
});

var dynamodbDoc = new AWS.DynamoDB.DocumentClient();








    
function FindCandidates(keyword){
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

    
    var arr = new Array();

    if (keyword !== 'void' ){
        dynamodbDoc.scan(params, function(err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            } else {
                console.log("Query succeeded.");
                data.Items.forEach(function(item) {
                    if(item[keyword] === true){
                    	console.log(item.url);
                    }
                });
            }
            console.log(arr);
        });
        
    }
}

FindCandidates("python")

