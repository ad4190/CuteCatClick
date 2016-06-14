var AWS = require("aws-sdk");

AWS.config.loadFromPath( '/home/ec2-user/aws-config.json' );

var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "photos",
    KeySchema: [       
        { AttributeName: "iname", KeyType: "HASH"}  //Partition key
    ],
    AttributeDefinitions: [       
        { AttributeName: "iname", AttributeType: "S" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 4));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 4));
    }
});
