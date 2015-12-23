var AWS = require("aws-sdk");

var s3 = new AWS.S3();


function getUserFile2(uid){

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


        console.log(data.Contents.length)
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
   


      }
    });

}


getUserFile2('ironman')