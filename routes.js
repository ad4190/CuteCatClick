require('./database');

var AWS = require('aws-sdk');
AWS.config.loadFromPath( '/home/ec2-user/aws-config.json' );

var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();
var s3 = new AWS.S3();

var newlist = [];
	
	module.exports = function(app){

	// This is executed before the next two post requests
	app.post('*', function(req, res, next){
		
		// Register the user in the database by ip address

		var params1 = {
		TableName: "users",
		Item: {
        "ip":req.ip,
        "votes": []
    }
};

	docClient.put(params1, function (err, data) {
    if (err)
        console.log(JSON.stringify(err, null, 2));
    else
        console.log(JSON.stringify(data, null, 2));
		next();
	});
		
});


// Homepage
	app.get('/', function(req, res){

// Find all photos
var params2 = {
TableName: "photos"
	};

docClient.scan(params2, function(err, data) {
        var obj = JSON.parse(JSON.stringify(data));
	var items = obj["Items"];
//Find current user
console.log(req.ip);
var findUser = {
 TableName: "users",
 KeyConditionExpression: "ip = :name",
 ExpressionAttributeValues: {
     ":name": req.ip
    }
};
				
docClient.query(findUser, function(err, userdata){
	var voted_on = [];
	if(userdata){
var objs = JSON.parse(JSON.stringify(userdata));
console.log(objs);
var users = objs["Items"];
var user = users[0]["ip"];
voted_on = users[0]["votes"];
	}
var not_voted_on = [];
for(var j=0; j<items.length; j++){
	if(voted_on.indexOf(items[j]["iname"]) == -1) {
		not_voted_on.push(items[j]);
	}
	}
	var image_to_show = null;
	console.log("size: "+not_voted_on.length);
	if(not_voted_on.length > 0){
		// Choose a random image from the array
		image_to_show = not_voted_on[Math.floor(Math.random()*not_voted_on.length)];
	}
	//console.log("show: "+image_to_show["iname"]);
	res.render('home', { photo: image_to_show });
			
	});
			
});

});

	app.get('/standings', function(req, res){

	var params2 = {
	TableName: "photos"
	};
	docClient.scan(params2, function(err, data) {
    if (err)
        console.log("on standings: "+JSON.stringify(err, null, 2));
    else
		var obj = JSON.parse(JSON.stringify(data));
		var items = obj["Items"];
		// Render the standings template and pass the photos
		res.render('standings', { standings: items })
		
	});

	});

	app.post('/notcute', vote);
	app.post('/cute', vote);
	app.post('/sendmail',sendmail);

function vote(req, res){

		// Which field to increment, depending on the path

		var what = {
			'/notcute': "dislike",
			'/cute': "like"
		};

		// Find the photo, increment the vote counter and mark that the user has voted on it.
		
var find = {
    TableName: "photos",
    KeyConditionExpression: "iname = :val",
    ExpressionAttributeValues: {
        ":val": req.body.photo
    }
};

docClient.query(find, function(err, data) {

if(err){
//	console.log(err);
	res.redirect('../');
}
else {

	var obj = JSON.parse(JSON.stringify(data));
	var items = obj["Items"];
	var foundname = items[0]["iname"];
	var likes = items[0]["likes"];
	var dislikes = items[0]["dislikes"];
	var url = items[0]["url"];

	var what_to_inc = what[req.path];
	if(what_to_inc == 'like') {
		likes = likes + 1;
	}
	else {
		dislikes = dislikes + 1;
	}
//Update photos	
    var updates = {
    TableName: "photos",
    Key: {
        "iname":foundname
	 },
    UpdateExpression: "SET likes = :label1, dislikes = :label2",
    ExpressionAttributeValues: { 
        ":label1": likes,
	":label2": dislikes
    },
    ReturnValues: "ALL_NEW"
};
docClient.update(updates, function(err, data) {
    if (err)
        console.log(JSON.stringify(err, null, 2));
    else
        console.log("photos updated");
	//console.log(JSON.stringify(data, null, 2));
});

//Update users
newlist.push(foundname);
 var updateusers = {
    TableName: "users",
    Key: {
        "ip":req.ip
    },
    UpdateExpression: "SET votes = list_append(votes,:label1)",
    ExpressionAttributeValues: { 
        ":label1": newlist
    },
    ReturnValues: "UPDATED_NEW"
};


docClient.update(updateusers, function(err, data) {
//	res.redirect('../');
if (err)
        console.log(JSON.stringify(err, null, 2));
else{
        console.log(JSON.stringify(data, null, 2));
	res.redirect('../');
}
}); 

}	
	
});
		
}

function sendmail(req, res){
		var email   = "agarwal.puja3001@gmail.com";
    	var to_email = req.body.receiver;
		
	// Instantiate SES.
	var ses = new AWS.SES();
	var ses_mail = "From: 'Picture Voting Game' <" + email + ">\n";
    ses_mail = ses_mail + "To: " + to_email + "\n";
    ses_mail = ses_mail + "Subject: Cat Picture Voting Game\n";
    ses_mail = ses_mail + "MIME-Version: 1.0\n";
    ses_mail = ses_mail + "Content-Type: text/html; charset=us-ascii\n\n";
    ses_mail = ses_mail + "Try this cool picture voting game @ http://52.40.251.53/.\n\n";
    
    var params = {
        RawMessage: { Data: new Buffer(ses_mail) },
        Destinations: [ to_email ],
        Source: "'Cool Picture Voting Game' <" + email + ">'"
    };
    
    ses.sendRawEmail(params, function(err, data) {
        if(err) {
            res.send(err);
console.log(err);        
} 
        else {
            res.send(data);
        }           
    });
	res.redirect('../');
	
	}
};




