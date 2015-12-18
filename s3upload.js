var aws = require('aws-sdk');
var s3 = new aws.S3();
var fs = require('fs');
var BUCKET_NAME = 'cloud2015project';

var fileName = 'Assignment2.pdf';


function getContentTypeByFile(fileName) {
	var rc = 'application/octet-stream';
	var fn = fileName.toLowerCase();

	if (fn.indexOf('.html') >= 0) rc = 'text/html';
	// else if (fn.indexOf('.css') >= 0) rc = 'text/css';
	// else if (fn.indexOf('.json') >= 0) rc = 'application/json';
	// else if (fn.indexOf('.js') >= 0) rc = 'application/x-javascript';
	else if (fn.indexOf('.png') >= 0) rc = 'image/png';
	else if (fn.indexOf('.jpg') >= 0) rc = 'image/jpg';
	else if (fn.indexOf('.pdf') >= 0) rc = 'pdf';

	return rc;
}

function uploadFile(remoteFilename, fileName) {
	var fileBuffer = fs.readFileSync(fileName);
	var metaData = getContentTypeByFile(fileName);

	s3.putObject({
		ACL: 'public-read',
		Bucket: BUCKET_NAME,
		Key: remoteFilename,
		Body: fileBuffer,
		ContentType: metaData
	}, function(error, response) {
		console.log('uploaded file[' + fileName + '] to [' + remoteFilename + '] as [' + metaData + ']');
		console.log(arguments);
	});
}

uploadFile(fileName,fileName)



