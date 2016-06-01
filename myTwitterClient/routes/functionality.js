var ejs = require("ejs");
var mongo = require("./mongo");
var mq_client = require('../rpc/client');

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

var findHashtags = require('find-hashtags');
var path = require("path");
var searchForTweet = "NULL";

var assert = require('assert');
var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10);



// Redirects to the homepage
exports.redirectToHomepage = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	// Checks before redirecting whether the session is valid
	ejs.renderFile('./views/login.ejs', function(err, result) {

		if (!err) {
			res.end(result);
		} else {
			res.end('An error Occureed while fetching values');
			console.log(err);
		}
	});
};

exports.homepage = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	// Checks before redirecting whether the session is valid
	ejs.renderFile('./views/homepage.ejs', function(err, result) 
	{
		if (!err) 
		{
			res.end(result);
		} 
		else 
		{
			res.end('An error Occured');
			console.log(err);
		}
	});
};

exports.signUp = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	ejs.renderFile('./views/signup.ejs', function(err, result) {
		if (!err) {
			console.log("Redirected to SignUp page");
			res.end(result);
		} else {
			res.end("Error Occurred while redirecting to the signup page");
			console.log(err);
		}
	});
};

// Check login - called when '/checklogin' POST call given from AngularJS module in "login.ejs"
exports.checkLogin = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	var username, password;
	username = req.param("username");
	console.log(username);
	password = req.param("password");
	//Encrypting the password using the bcrypt module
	password = bcrypt.hashSync(password, salt);
	console.log(password);
	
	var msg_payload = {"type":"checkLogin","username":username,"password":password};
	mq_client.make_request('login_queue',msg_payload, function(err,results)
	{
		if(err)
		{
			throw err;
		}
		else 
		{
			req.session.username = username;
			console.log("Got back the results for checkLogin -> functionality.js");
			res.send(results);
		}  
	});
	
/*	
	loginCollection.findOne({username : username, password : password}, function(err, user) 
	{
		if (user) 
		{
			// This way subsequent requests will know the user is logged in.

			req.session.username = user.username;
			console.log("User value fetched is:" + user);

			console.log("checklogin" + req.session.username+ "is logged in the session");
			json_responses = {
				"statusCode" : 200
			};
			res.send(json_responses);

		} 
		else 
		{
			console.log("Username and Password doesn't match. returned false");
			json_responses = {
				"statusCode" : 401
			};
			res.send(json_responses);
		}
	});
*/
};

// Add New User into the Database
exports.addUser = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

	var firstname, lastname, username, password, thandle, dob;
	firstname = req.param("firstname");
	console.log(firstname);
	lastname = req.param("lastname");
	console.log(lastname);
	username = req.param("username");
	console.log(username);
	password = req.param("password");
	password = bcrypt.hashSync(password, salt);
	
	console.log(password);
	thandle = req.param("thandle");
	console.log(thandle);
	var json_responses;

	var msg_payload = {"type":"addUser","firstname":firstname,"lastname": lastname,"username":username,"password":password,"thandle":thandle};
	mq_client.make_request('login_queue',msg_payload, function(err,results)
	{
		if(err)
		{
			throw err;
		}
		else 
		{
			if(results.code === 200)
			{
				console.log("Signup successful -> in the functionality.js file");
				//res.send({"login":"Success"});
				json_responses = {
						"statusCode" : 200
					};
				res.send(json_responses);
			}
			else
			{
				console.log("Signup Unsuccessful -> in the functionality.js file");
				//res.send({"login":"Fail"});
				json_responses = {
						"statusCode" : 401
					};
				res.send(json_responses);
			} 
		}  
	});
	
	
/* 
	loginCollection.findOne({username : username}, function(err, user) 
	{
		if (user) 
		{
			console.log("Username already exists:" + user);
			//res.send("Username already exists");
			json_responses = {"statusCode" : "Username already exists"};
			res.send(json_responses);
		} 
		else 
		{
			loginCollection.findOne({thandle : thandle}, function(err, handler) 
			{
				if (handler) 
				{
					console.log("Twitter handler exists");
					json_responses = {"statusCode" : "Twitter handler exists"};
					res.send(json_responses);
				} 
				else 
				{
					var document = {
						firstname 	: firstname,
						lastname 	: lastname,
						username 	: username,
						password 	: password,
						thandle 	: thandle,
						birthday 	: "",
						location 	: "",
						phone		: "",
						followers 	: [],
						following 	: []
					};
					// Save is similar to 'Insert'. So, we are inserting values into the
					// LOGIN collection of the TWITTER database
					loginCollection.save(document, function(err, doc) 
					{
						if(doc) 
						{
							tweetsdocument = {
								firstname : firstname,
								lastname : lastname,
								username : username,
								thandle : thandle,
								tweets : []
							};
							
							tweetsCollection.save(tweetsdocument,function(err,tdoc)
							{
								if(tdoc)
								{
									console.log("user added successfully");
									json_responses = {"statusCode" : 200};
									res.send(json_responses);
								}
							});	
						}
						else 
						{
							console.log("An error occured:" + err);
							res.end(result);
						}
					});
				}

			});
		}
	});
*/
};

exports.fetchValues = function(req, res) {
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	
	ejs.renderFile('./views/homepage.ejs', function(err, result) {
		if (!err) {
			console.log("In FetchValues function");
			res.end(result);
		} else {
			res.end("Error Occurred");
			console.log(err);
		}
	});
};

exports.calculateValues = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	console.log("calculateValues->functionality.js");
	
	var msg_payload = {"type":"calculateValues","username":req.session.username};
	mq_client.make_request('homepage_queue',msg_payload, function(err,results)
	{
		if(err)
		{
			throw err;
		}
		else 
		{
			res.send(results);
		}  
	});
	
/*	
	loginCollection.findOne({username : req.session.username}, function(err, user) 
	{
		if (user) 
		{
				console.log("Fetched the user details successfully");
				res.send(user);
		} 
		if(err) 
		{
				console.log("Unable to fetch the user details");
				console.loh(err);
				throw err;
		}
	});
*/
};

exports.renderTweets = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	console.log("In renderTweets function->functionality.js");
	
	var msg_payload = {"type":"renderTweets","username":req.session.username};
	mq_client.make_request('homepage_queue',msg_payload, function(err,results)
	{
		if(err)
		{
			throw err;
		}
		else 
		{
			res.send(results);
		}  
	});
/*	
	loginCollection.findOne({username : req.session.username}, function(err, user) 
	{
		console.log("found the users whose tweets are to be rendered");
		if (user) 
		{
			var userFollowingList = [];
			for(var i = 0; i< user.following.length; i++)
			{
				userFollowingList[i]= user.following[i].username;
			}
			userFollowingList[i]=user.username;
				
			console.log("List of people whose tweets are to be rendered:"+userFollowingList);
			
			tweetsCollection.find({username:{$in : userFollowingList}}, {'username':0,'_id':0}).toArray(function(err,data)
			{
				if(data)
				{
					console.log("Fetched the tweets successfully\n");
					console.log("Length of Data Recieved is: "+data.length);
					console.log(JSON.stringify(data));
					
					for(var i = 0; i<data.length; i++)
					{
						var arrayWithHashes = [];
						var userTweets = [] ;
						userTweets = data[i].tweets;
						console.log("usertweet is "+userTweets);
						for(var j=0; j<userTweets.length; j++)
						{
							arrayWithHashes = findHashtags(userTweets[j].tweet);
							console.log("array with hashes has "+arrayWithHashes);
							
							for(var k = 0; k<arrayWithHashes.length; k++)
							{
								var str = (userTweets[j].tweet).toString();
								console.log("str has: "+str);
								console.log(arrayWithHashes[k].length);
								console.log(arrayWithHashes[k].toString().length);
								var str1 = str.substring(str.indexOf('#'),(str.indexOf('#')+arrayWithHashes[k].length+1));	//replacing till the hashtag only and not till the end of the string "str"
								console.log("str1 has "+str1);
								var str2 = str.toLowerCase();
								console.log("str2 has "+str2);
								
								console.log("Array has "+arrayWithHashes[k]);
								var src = '#'+arrayWithHashes[k].toString();
								console.log("src has "+ src);
								
								var dest = "<a href=\"#\">"+str1.toLowerCase()+"</a>";
								console.log("dest has "+dest);
								
								var newTweet = str.replace(str1,dest);
								console.log("New Tweet is: "+newTweet);
								data[i].tweets[j].tweet = newTweet;
							}	
						}
					}
					
					res.send(data);
				}
				else
				{
					console.log("Not able to fetch the Tweets");
				}
			});
			//res.send(user);
		} 
		else 
		{
				console.log("Insertion of new user failed. returned false");
				// json_responses =
				// {"statusCode" : 401};
				// res.send(json_responses);
		}
	});
*/
};

exports.addTweet = function(req, res) 
{
	console.log("Inside the addTweet->functionality.js");
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	
	var msg_payload = {"type":"addTweet","username":req.session.username};
	mq_client.make_request('homepage_queue',msg_payload, function(err,results)
	{
		if(err)
		{
			throw err;
		}
		else 
		{
			res.send(results);
		}  
	});
	
/*	
	var tDate = new Date();
	var tDocument = {tweet: req.param("tweetval"), date:tDate};
	tweetsCollection.find({"username":req.session.username}, function(err, doc) 
	{
		console.log("User found in the tweets database");
		if(doc) 
		{	
//db.tweets.update({"username":"balaji@gmail.com"},{$push:{tweets:{$each:[{"tweet":"Balaji is now on #twitter","date":"2016-04-15T23:35:20.714Z"}],$position:0}}})
			tweetsCollection.update({username:req.session.username},{$push:{tweets:{$each:[tDocument],$position:0}}},function(err,tdoc)
			{
				console.log("Update query worked");
				if(tdoc)
				{
					//console.log(tdoc);
					json_responses = {"statusCode" : 200};
					res.send(json_responses);
				}
			});	
		}
		else 
		{
			console.log("An error occured:" + err);
			res.end();
		}
	});
*/
};

exports.renderUserTweets = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	console.log("In renderUserTweets->functionality.js");
	
	var msg_payload = {"type":"renderUserTweets","username":req.session.username};
	mq_client.make_request('userprofile_queue',msg_payload, function(err,results)
	{
		if(err)
		{
			throw err;
		}
		else 
		{
			console.log("Got back the suggestions for Followers -> functionality.js" + results);
			res.send(results);
		}  
	});

/*	
	tweetsCollection.find({username: req.session.username}, {'username':0,'_id':0}).toArray(function(err,data)
	{
		if(data)
		{
			console.log("Fetched the user's tweets successfully\n");
			console.log(data);
			for(var i = 0; i<data.length; i++)
			{
				var arrayWithHashes = [];
				var userTweets = [] ;
				userTweets = data[i].tweets;
				console.log("usertweet is "+userTweets);
				for(var j=0; j<userTweets.length; j++)
				{
					arrayWithHashes = findHashtags(userTweets[j].tweet);
					console.log("array with hashes has "+arrayWithHashes);
					
					for(var k = 0; k<arrayWithHashes.length; k++)
					{
						var str = (userTweets[j].tweet).toString();
						console.log("str has: "+str);
						console.log(arrayWithHashes[k].length);
						console.log(arrayWithHashes[k].toString().length);
						var str1 = str.substring(str.indexOf('#'),(str.indexOf('#')+arrayWithHashes[k].length+1));	//replacing till the hashtag only and not till the end of the string "str"
						console.log("str1 has "+str1);
						var str2 = str.toLowerCase();
						console.log("str2 has "+str2);
						
						console.log("Array has "+arrayWithHashes[k]);
						var src = '#'+arrayWithHashes[k].toString();
						console.log("src has "+ src);
						
						var dest = "<a href=\"#\">"+str1.toLowerCase()+"</a>";
						console.log("dest has "+dest);
						
						var newTweet = str.replace(str1,dest);
						console.log("New Tweet is: "+newTweet);
						data[i].tweets[j].tweet = newTweet;
					}	
				}
			}
			res.send(data);
		}
		else
		{
			console.log("Not able to fetch the Tweets");
		}
					
	});
*/
};

exports.renderUserFollowing = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	console.log("In renderUserFollowing function");
	
	var msg_payload = {"type":"renderUserFollowing","username":req.session.username};
	mq_client.make_request('userprofile_queue',msg_payload, function(err,results)
	{
		if(err)
		{
			throw err;
		}
		else 
		{
			console.log("Got back the suggestions for Followers -> functionality.js" + results);
			res.send(results);
		}  
	});
/*
	loginCollection.findOne({username : req.session.username}, function(err, user) 
	{
		console.log("found the users whose tweets are to be rendered");
		if (user) 
		{
			var userFollowingList = [];
			for(var i = 0; i< user.following.length; i++)
			{
				userFollowingList[i]= user.following[i].username;
			}
				
			console.log("List of people whose tweets are to be rendered:"+userFollowingList);
			
			tweetsCollection.find({username:{$in : userFollowingList}}, {'username':0,'_id':0,'tweets':0}).toArray(function(err,data)
			{
				if(data)
				{
					
					console.log("Fetched the following list successfully\n");
					console.log(data);
					res.send(data);
				}
				else
				{
					console.log("Not able to fetch the following");
				}
			});
			//res.send(user);
		} 
		else 
		{
				console.log("User Not Found while fetching the following list");
				// json_responses =
				// {"statusCode" : 401};
				// res.send(json_responses);
		}
	});
	
*/
};

exports.renderUserFollowers = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	console.log("In renderUserFollowers function");

	var msg_payload = {"type":"renderUserFollowers","username":req.session.username};
	mq_client.make_request('userprofile_queue',msg_payload, function(err,results)
	{
		if(err)
		{
			throw err;
		}
		else 
		{
			console.log("Got back the suggestions for Followers -> functionality.js" + results);
			res.send(results);
		}  
	});
/*
	loginCollection.findOne({username:req.session.username},function(req,user)
	{
		console.log("found the followers to be rendered");
		console.log(user);
		if (user) 
		{
			var userFollowersList = [];
			for(var i = 0; i< user.followers.length; i++)
			{
				userFollowersList[i]= user.followers[i].username;
			}
				
			console.log("List of people whose tweets are to be rendered:"+userFollowersList);
			
			tweetsCollection.find({username:{$in : userFollowersList}}, {'username':0,'_id':0,'tweets':0}).toArray(function(err,data)
			{
				if(data)
				{
					console.log("Fetched the followers list successfully\n");
					console.log(data);
					res.send(data);
				}
				else
				{
					console.log("Not able to fetch the followers");
				}
			});
		} 
		else 
		{
				console.log("User Not Found while fetching the followers list");
				// json_responses =
				// {"statusCode" : 401};
				// res.send(json_responses);
		}
	});
*/	
};

// Suggest Followers to the User
exports.suggestFollowers = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	var msg_payload = {"type":"suggestFollowers","username":req.session.username};
	mq_client.make_request('homepage_queue',msg_payload, function(err,results)
	{
		if(err)
		{
			throw err;
		}
		else 
		{
			console.log("Got back the suggestions for Followers -> functionality.js" + results);
			res.send(results);
		}  
	});
	
/*	
	loginCollection.findOne({username : req.session.username}, function(err, user)
	{
		console.log("found the users to whom the suggestions are to be made");
		if (user) 
		{
			var userFollowingList = [];
			for(var i = 0; i< user.following.length; i++)
			{
				userFollowingList[i]= user.following[i].username;
			}
			userFollowingList[i]=user.username;
				
			console.log("List of people whose tweets are to be rendered:"+userFollowingList);
			//Using the NOT IN function to simplify the task of filtering out the people
			loginCollection.find({username:{$nin : userFollowingList}}).toArray(function(err,data)
			{
				if(data)
				{
					console.log("Fetched the followers to be suggested successfully\n");
					console.log(data);
					res.send(data);
				}
				if(err)
				{
					console.log("Not able to fetch the usernames to suggest followers");
					console.log(err);
					//res.send(err);
				}
			});
		} 
		if(err) 
		{
				console.log("Suggestion of users failed. returned false");
				console.log(err);
				// json_responses =
				// {"statusCode" : 401};
				// res.send(json_responses);
		}
	});
*/
};

exports.updateFollowers = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	console.log("In updateFollowers function ->functionality.js");
	
	var msg_payload = {"type":"updateFollowers","username":req.session.username,"thandle":req.param('thandle')};
	mq_client.make_request('homepage_queue',msg_payload, function(err,results)
	{
		if(err)
		{
			throw err;
		}
		else 
		{
			console.log("Updated the Following list -> functionality.js" + results);
			res.send(results);
		}  
	});
/*	
	loginCollection.findOne({username : req.session.username}, function(err, user)
	{
		console.log("to update the following list of: "+req.session.username);
		if (user) 
		{
			loginCollection.findOne({"thandle":req.param('thandle')},{"username":1,"_id":0}, function(err,data)
			{
				if(data)
				{
					//db.login.update({"username":"balaji@gmail.com"},{$push:{followers:{$each:[{"username":"swaroop@gmail.com"},{"username":"abhishek@gmail.com"}],$position:0}}});
					loginCollection.update({"thandle":req.param('thandle')},{$push:{followers:{$each:[{"username":req.session.username}],$position:0}}},function(err,follow)
					{
						if(err)
						{
							console.log(err);
							throw err;
						}
						else
						{
							console.log(follow);
						}
					});
					
					
					//db.login.update({"username":req.session.username},{$push:{following:{$each:[{"username":req.param}],$position:0}}});
					loginCollection.update({username : req.session.username},{$push:{following:{$each:[data],$position:0}}},function(err,followed)
					{
						if (err) 
						{
							console.log(err);
							throw err;
						} 
						else
						{
							//to add code to update the follower table of the person whom we started following
							console.log("User Following list updated successfully");
							json_responses = {"status": 200};
							res.send(json_responses);
						}
						
					});
				}				
				console.log(data);
			});			
		}
		if(err)
		{
			console.log("Failed to get the user details of the logged in user");
		}
	});
*/
};

exports.getTweetCount = function(req,res)
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	console.log("In the getTweetCount->functionality.js");
	
	var msg_payload = {"type":"getTweetCount","username":req.session.username};
	mq_client.make_request('homepage_queue',msg_payload, function(err,results)
	{
		if(err)
		{
			throw err;
		}
		else 
		{
			console.log("Got back the suggestions for Followers -> functionality.js" + results);
			res.send(results);
		}  
	});

	/*
	tweetsCollection.findOne({"username":req.session.username},function(err,data)
	{
		if(err)
		{
			console.log(err);
		}
		if(data)
		{
			var tCount = data.tweets.length;
			console.log("Number of tweets by user is: " +tCount);
			
			//Send any value back to browser for displaying in a JSON response as show below
			json_responses = {"tweetCount":tCount};
			console.log(json_responses);
			res.send(json_responses);
		}
		
	});
	*/
};

// Edit User Profile
exports.userProfile = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	console.log("In the userProfile function");
	var viewpath = path.join(__dirname, '../views', 'userprofile.ejs');
	console.log(viewpath);
	ejs.renderFile(viewpath, function(err, result) 
	{
		if (!err) 
		{
			console.log("Rendered the userProfile page successfully");
			res.end(result);
		} 
		else 
		{
			res.end("Error Occurred");
			console.log(err);
		}
	});
};


exports.getUserProfile = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	console.log("In the getUserProfile function");

	var msg_payload = {"type":"getTweetCount","username":req.session.username};
	mq_client.make_request('userprofile_queue',msg_payload, function(err,results)
	{
		if(err)
		{
			throw err;
		}
		else 
		{
			console.log("Got back the suggestions for Followers -> functionality.js" + results);
			res.send(results);
		}  
	});
	
/*	
	//tweetsCollection.find({username:{$in : userFollowingList}}, {'username':0,'_id':0}).toArray(function(err,data)
	loginCollection.findOne({username: req.session.username},{"username":0,"password":0,"tweets":0,"followers":0,"following":0},function(err,user)
	{
		if(user)
		{
			console.log("User Profile Info:\n" + user);
			var str = user.birthday;
			var bday = str.toString();
			console.log(bday);

			bday = bday.substring(0, 10);
			user.birthday = bday;
			console.log(user.birthday);
			
			res.send(user);
		}
		if(err)
		{
			console.log(err);
			throw err;
		}
	});
*/
};

exports.updateUserProfile = function(req,res)
{
	console.log("In the getUserProfile function");
	
	var firstname 	= req.param('firstname');
	var lastname 	= req.param('lastname');
	var birthday	= req.param('birthday');
	var loc			= req.param('loc');
	var phone		= req.param('phone');
	console.log("New values:" + firstname +" " + lastname + " " + birthday + " " + loc + " " + phone);
	//tweetsCollection.find({username:{$in : userFollowingList}}, {'username':0,'_id':0}).toArray(function(err,data)
	loginCollection.update({username: req.session.username},{
			$set:{ "firstname"	: firstname, 
					"lastname"	: lastname,
					"birthday"	: birthday,
					"loc"		: loc,
					"phone"		:phone}
				},function(err,user)
					{
						if(user)
						{
							console.log("User Profile Updated:\n" + user);
							
							
							//res.send(user);
						}
						if(err)
						{
							console.log(err);
							throw err;
						}
					});
};

exports.searchTweets = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	console.log("In the searchTweets function called to search for tweets");
	searchForTweet = req.param('searchText');
	console.log(searchForTweet);
	res.send("Success");
};

exports.searchResults = function(req, res) {
	console.log("In the searchResults function");
	var viewpath = path.join(__dirname, '../views', 'searchResults.ejs');
	ejs.renderFile(viewpath,function(err, result) 
	{
		if (!err) 
		{
			console.log("Now the results are loaded in the page 'searchResults.ejs'");
			res.end(result);
		} 
		else 
		{
			res.end("Error Occurred");
			console.log(err);
		}
	});
};

exports.loadSearchResults = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	console.log("In the loadSearchResults function of the functionality.js file");
	
	
	tweetsCollection.find({$text : {$search : searchName}}).toArray(function(err, docs) 
	{
		var results = JSON.stringify(docs);
		console.log("searched"+results);
		res.send(results);
    });
	
/*	
	var getInfo = "SELECT concat(fname,' ',lname) usrname, usr.twitterhandle, t.tweet "
			+ " from tweets t, users usr "
			+ " where t.username=usr.username and t.tweet like '%"
			+ searchForTweet + "%';";

	console.log("My Query is:" + getInfo);
	mysql.fetchData(function(err, results) {
		console.log(results);
		if (err) {
			throw err;
		} else {
			console.log("fetched the results of the user");
			res.send(results);
		}
	}, getInfo);
*/
};
// Logout the user - invalidate the session
exports.logout = function(req, res) 
{
	res.header('Cache-Control','no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	req.session.destroy();
	res.redirect('/');
};