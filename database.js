var AWS = require('aws-sdk');
AWS.config.loadFromPath( '/home/ec2-user/aws-config.json' );

var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

var s3 = new AWS.S3();

var params = {Bucket: 'nodeapps'};
var tparams = {};
var val = 0;

dynamodb.listTables(tparams, function(err, data) {
    if (err)
        console.log(JSON.stringify(err, null, 2));
    else
        console.log(JSON.stringify(data, null, 2));
		var obj = JSON.parse(JSON.stringify(data));
		var tables = obj["TableNames"];
		for(var i=0;i<tables.length;i++){
			if(tables[i] == "photos"){
				val = val +1;
			}
		}
		
		if(val ==1){
			console.log("Updating photos url into DynamoDB. Please wait.");

			s3.listObjects(params, function(err, data){
			var bucketContents = data.Contents;
			for (var i = 0; i < bucketContents.length; i++){
				var urlParams = {Bucket: 'nodeapps', Key: bucketContents[i].Key};
				var urlKey = bucketContents[i].Key;
				s3.getSignedUrl('getObject',urlParams, function(err, url){
				// update url data into the collection
				var updates = {
				TableName: "photos",
				Key: {
				"iname":urlKey
				},
				UpdateExpression: "SET #u = :label1",
				ExpressionAttributeNames: {
				"#u":"url"
				},
				ExpressionAttributeValues: { 
				":label1": url
			},
			ReturnValues: "ALL_NEW"
			};

			docClient.update(updates, function (err, data) {
			if (err)
				console.log(JSON.stringify(err, null, 2));
			else
				console.log(JSON.stringify(data, null, 2));
			});
			 
		});
		}
		});
			
		}
		else {
			console.log("Importing photos into DynamoDB. Please wait.");

			s3.listObjects(params, function(err, data){
			var bucketContents = data.Contents;
			for (var i = 0; i < bucketContents.length; i++){
				var urlParams = {Bucket: 'nodeapps', Key: bucketContents[i].Key};
				var urlKey = bucketContents[i].Key;
				s3.getSignedUrl('getObject',urlParams, function(err, url){
				// insert some intial data into the collection
				var params1 = {
				TableName: "photos",
				Item: {
					"iname":urlKey,
					"url":url,
					"likes":0,
					"dislikes":0
				}
			};

			docClient.put(params1, function (err, data) {
			if (err)
				console.log(JSON.stringify(err, null, 2));
			else
				console.log(JSON.stringify(data, null, 2));
			});
			 
		});
		}
		});
		}

});

