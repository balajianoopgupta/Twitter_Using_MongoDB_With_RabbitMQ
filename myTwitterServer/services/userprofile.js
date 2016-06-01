var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/twitter";

var loginCollection;
var tweetsCollection;
var json_responses;
var tweetsdocument;

var findHashtags = require('find-hashtags');
var path = require("path");
var searchForTweet = "NULL";

mongo.connect(mongoURL, function() {
	console.log('Connected to mongo at: ' + mongoURL);
	loginCollection = mongo.collection('login');
	tweetsCollection = mongo.collection('tweets');
});

exports.renderUserTweets = function(req, msg, callback) 
{
	var res = {};
	console.log("In renderUserTweets function -> userprofile.js");
	
	tweetsCollection.find({username: msg.username}, {'username':0,'_id':0}).toArray(function(err,data)
	{
		console.log("Query 1 -> renderUserTweets function -> userprofile.js");
		if(data)
		{
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
			//res.send(data);
			console.log("Sending this data back from renderUserTweets->userprofile.js"+ JSON.stringify(data));
			callback(req, data);
		}
		else
		{
			console.log("Not able to fetch the Tweets");
		}					
	});
};


exports.renderUserFollowing = function(req, msg, callback) 
{
	var res = {};
	console.log("In renderUserFollowing function -> userprofile.js");
	
	loginCollection.findOne({username : msg.username}, function(err, user) 
	{
		console.log("Query 1 -> renderUserFollowing -> userprofile.js");
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
				console.log("Query 2 -> renderUserFollowing -> userprofile.js");
				if(data)
				{		
					console.log("Fetched the following list successfully\n");
					console.log(data);
					//res.send(data);
					callback(req, data);
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
};


exports.renderUserFollowers = function(req, msg, callback) 
{
	var res = {};
	console.log("In renderUserFollowers function -> userprofile.js");
	
	loginCollection.findOne({username:msg.username},function(req,user)
	{
		console.log("Query 1 -> renderUserFollowers -> userprofile.js");
		//console.log(user);
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
				console.log("Query 2 -> renderUserFollowers -> userprofile.js");
				if(data)
				{
					console.log("Fetched the followers list successfully\n");
					console.log(data);
					//res.send(data);'
					callback(req, user);
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
};

exports.getUserProfile = function(req, msg, callback) 
{
	var res = {};
	console.log("In getUserProfile function -> userprofile.js");
	
	loginCollection.findOne({username: msg.username},{"username":0,"password":0,"tweets":0,"followers":0,"following":0},function(err,user)
	{
		console.log("Query 1 -> getUserProfile -> userprofile.js");
		if(user)
		{
			console.log("User Profile Info:\n" + user);
			var str = user.birthday;
			var bday = str.toString();
			console.log(bday);

			bday = bday.substring(0, 10);
			user.birthday = bday;
			console.log(user.birthday);
					
			//res.send(user);
			callback(req,user);
		}
		if(err)
		{
			console.log(err);
			throw err;
		}
	});
};