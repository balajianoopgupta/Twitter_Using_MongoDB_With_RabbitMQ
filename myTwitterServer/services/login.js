var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/twitter";

var loginCollection;
var tweetsCollection;
var json_responses;
var tweetsdocument;

mongo.connect(mongoURL, function() {
	console.log('Connected to mongo at: ' + mongoURL);
	loginCollection = mongo.collection('login');
	tweetsCollection = mongo.collection('tweets');
});

exports.checkLogin = function(req, msg, callback) 
{
	var res = {};
	console.log("In checkLogin request -> server.js");

	loginCollection.findOne({username:msg.username, password : msg.password}, function(err, user) 
	{
		console.log("Connected");
		if (user) 
		{
			// This way subsequent requests will know the user is logged in.
			//req.session.username = user.username;
			console.log("User value fetched is:" + JSON.stringify(user));

			//console.log("checklogin" + req.session.username+ "is logged in the session");
			res.code = "200";
			res.value = "Success Login";
			console.log("My Response is:"+JSON.stringify(res));
			callback(req, res);
		} 
		else 
		{
			console.log("Username and Password doesn't match. returned false");
			res.code = "401";
			res.value = "Failed Login";
			callback(req, res);
		}
	});
};

exports.addUser = function(req, msg, callback) 
{
	var response = {};
	console.log("In addUser request -> server.js");

	loginCollection.findOne({username : msg.username}, function(err, user) 
	{
		console.log("Inside Query1 - addUser");
		if(err)
		{
			console.log("Error in addUser Query1");
			throw err;
		}	
		if (user) 
		{
			console.log("Username already exists:" + user);
			//res.send("Username already exists");
			//json_responses = { "statusCode" : "Username already exists" };
			//res.send(json_responses);
			response.code = "422";
			response.value = "Username already exists";
		} 
		else 
		{
			console.log("Inside Query2 - addUser");
			loginCollection.findOne({thandle : msg.thandle}, function(err, handler) 
			{
				if(err)
				{
					console.log("Error in addUser Query2");
					throw err;
				}
				if (handler) 
				{
					console.log("Twitter handler exists - addUser");
					//json_responses = {"statusCode" : "Twitter handler exists"};
					//res.send(json_responses);
					response.code = "422";
					response.value = "Twitter Handler already exists";
				} 
				else 
				{
					console.log("A New User can be created now  - addUser");
					var document = {
						firstname 	: msg.firstname,
						lastname 	: msg.lastname,
						username 	: msg.username,
						password 	: msg.password,
						thandle 	: msg.thandle,
						birthday 	: "",
						location 	: "",
						phone 		: "",
						followers 	: [],
						following 	: []
					};
					// Save is similar to 'Insert'. So, we are inserting values into the
					// LOGIN collection of the TWITTER database
					loginCollection.save(document, function(err, doc) 
					{
						console.log("A New User has been created now - addUser");
						if(err)
						{
							console.log("Error in addUser - 3");
						}
						if (doc) 
						{
							tweetsdocument = {
								firstname : msg.firstname,
								lastname : msg.lastname,
								username : msg.username,
								thandle : msg.thandle,
								tweets : []
							};

							tweetsCollection.save(tweetsdocument, function(err,tdoc) 
							{
								if(err)
								{
									console.log("Error in save - addUser");
									throw err;
								}
								else
								{
									console.log("user added successfully");
									//json_responses = {"statusCode" : 200};
									//res.send(json_responses);
									response.code = "200";
									response.value = "User Added Successfully";
									console.log("Response from addUser: "+(response));
								}
							});
						} 
					});
				}
			});
		}
	});
	callback(req, response);
};