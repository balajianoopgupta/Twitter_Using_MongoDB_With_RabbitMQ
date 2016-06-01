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

exports.calculateValues = function(req, msg, callback) 
{
	var res = {};
	console.log("In calculateValues function -> homepage.js");

	loginCollection.findOne({username : msg.username},function(err, user) 
	{
		console.log("Passed the query with username: "+ msg.username);
		if (user) 
		{
			console.log("Fetched the user details successfully -> homepage.js");
			// console.log(JSON.stringify(user));
			callback(req, user);
		}
		if (err) 
		{
			console.log("Unable to fetch the user details -> homepage.js");
			console.log(err);
			throw err;
		}
	});
};

exports.renderTweets = function(req, msg, callback) 
{
	var res = {};
	console.log("In renderTweets function -> homepage.js");
	loginCollection.findOne({username : msg.username},function(err, user) 
	{
		console.log("found the users whose tweets are to be rendered for the username: "+ msg.username);
		if (user) 
		{
			var userFollowingList = [];
			for (var i = 0; i < user.following.length; i++) 
			{
				userFollowingList[i] = user.following[i].username;
			}
			userFollowingList[i] = user.username;

			console.log("List of people whose tweets are to be rendered:"+ userFollowingList);

			tweetsCollection.find({username : {$in : userFollowingList}}, {'username' : 0,'_id' : 0}).toArray(function(err, data) 
			{
				if (data) 
				{
					console.log("Fetched the tweets successfully\n");
					console.log("Length of Data Recieved is: "+ data.length);
					console.log(JSON.stringify(data));

					for (var i = 0; i < data.length; i++) 
					{
						var arrayWithHashes = [];
						var userTweets = [];
						userTweets = data[i].tweets;
						console.log("usertweet is "+ userTweets);
						
						for (var j = 0; j < userTweets.length; j++) 
						{
							arrayWithHashes = findHashtags(userTweets[j].tweet);
							console.log("array with hashes has "+ arrayWithHashes);

							for (var k = 0; k < arrayWithHashes.length; k++) 
							{
								var str = (userTweets[j].tweet).toString();
								console.log("str has: "+ str);
								console.log(arrayWithHashes[k].length);
								console.log(arrayWithHashes[k].toString().length);
								var str1 = str.substring(str.indexOf('#'),(str.indexOf('#')+ arrayWithHashes[k].length + 1));
								console.log("str1 has "+ str1);
								var str2 = str.toLowerCase();
								console.log("str2 has "+ str2);

								console.log("Array has "+ arrayWithHashes[k]);
								var src = '#'+ arrayWithHashes[k].toString();
								console.log("src has "+ src);

								var dest = "<a href=\"#\">"+ str1.toLowerCase()+ "</a>";
								console.log("dest has "+ dest);

								var newTweet = str.replace(str1,dest);
								console.log("New Tweet is: "+ newTweet);
								data[i].tweets[j].tweet = newTweet;
							}
						}
					}

					// res.send(data);
					console.log("Sending this data back from renderTweets->homepage.js"+ JSON.stringify(data));
					callback(req, data);
				} 
				else 
				{
					console.log("Not able to fetch the Tweets");
				}
			});
			
		} 
		else 
		{
			console.log("Insertion of new user failed. returned false");
		
		}
	});
};

exports.addTweet = function(req, msg, callback) {
	var res = {};
	console.log("In addTweet function -> homepage.js");

	var tDate = new Date();
	var tDocument = {
		tweet : req.param("tweetval"),
		date : tDate
	};
	tweetsCollection.find({
		"username" : msg.username
	}, function(err, doc) {
		console.log("Query1 -> addTweet ->homepage.js");
		if (doc) {
			// db.tweets.update({"username":"balaji@gmail.com"},{$push:{tweets:{$each:[{"tweet":"Balaji
			// is now on
			// #twitter","date":"2016-04-15T23:35:20.714Z"}],$position:0}}})
			tweetsCollection.update({
				username : msg.username
			}, {
				$push : {
					tweets : {
						$each : [ tDocument ],
						$position : 0
					}
				}
			}, function(err, tdoc) {
				console.log("Update query worked");
				if (tdoc) {
					// console.log(tdoc);
					json_responses = {
						"statusCode" : 200
					};
					// res.send(json_responses);
					callback(req, json_responses);
				}
			});
		}
		if (err) {
			console.log("An error occured:" + err);
			throw err;
		}
	});
};

exports.suggestFollowers = function(req, msg, callback) {
	var res = {};
	console.log("In suggestFollowers function -> homepage.js");

	loginCollection
			.findOne(
					{
						username : msg.username
					},
					function(err, user) {
						console.log("In Query-1 -suggestFollowers ");
						if (user) {
							var userFollowingList = [];
							for (var i = 0; i < user.following.length; i++) {
								userFollowingList[i] = user.following[i].username;
							}
							userFollowingList[i] = user.username;

							console
									.log("List of people whose tweets are to be rendered:"
											+ userFollowingList);
							// Using the NOT IN function to simplify the task of
							// filtering out the people
							loginCollection
									.find({
										username : {
											$nin : userFollowingList
										}
									})
									.toArray(
											function(err, data) {
												if (data) {
													console
															.log("Fetched the followers to be suggested successfully -> homepage.js\n");
													console.log(data);
													// res.send(data);
													callback(req, data);
												}
												if (err) {
													console
															.log("Not able to fetch the usernames to suggest followers -> homepage.js");
													console.log(err);
													throw err;
													// res.send(err);
												}
											});
						}
						if (err) {
							console
									.log("Suggestion of users failed. returned false");
							console.log(err);
							// json_responses =
							// {"statusCode" : 401};
							// res.send(json_responses);
						}
					});
};

exports.updateFollowers = function(req, msg, callback) {
	var res = {};
	console.log("In updateFollowers function -> homepage.js");

	loginCollection
			.findOne(
					{
						username : msg.username
					},
					function(err, user) {
						console
								.log("Query1 ->updateFollowers-> homepage.js -> to update the following list of: "
										+ msg.username);
						if (user) {
							loginCollection
									.findOne(
											{
												"thandle" : msg.thandle
											},
											{
												"username" : 1,
												"_id" : 0
											},
											function(err, data) {
												console
														.log("Query 2 -> updateFollowers for user: "
																+ msg.thandle);
												if (data) {
													// db.login.update({"username":"balaji@gmail.com"},{$push:{followers:{$each:[{"username":"swaroop@gmail.com"},{"username":"abhishek@gmail.com"}],$position:0}}});
													loginCollection
															.update(
																	{
																		"thandle" : msg.thandle
																	},
																	{
																		$push : {
																			followers : {
																				$each : [ {
																					"username" : msg.username
																				} ],
																				$position : 0
																			}
																		}
																	},
																	function(
																			err,
																			follow) {
																		console
																				.log("Query 3 -> updateFollowers");
																		if (err) {
																			console
																					.log(err);
																			throw err;
																		} else {
																			console
																					.log(JSON
																							.stringify(follow));
																		}
																	});

													//db.login.update({"username":req.session.username},{$push:{following:{$each:[{"username":req.param}],$position:0}}});
													loginCollection
															.update(
																	{
																		username : msg.username
																	},
																	{
																		$push : {
																			following : {
																				$each : [ data ],
																				$position : 0
																			}
																		}
																	},
																	function(
																			err,
																			followed) {
																		if (err) {
																			console
																					.log(err);
																			throw err;
																		} else {
																			//to add code to update the follower table of the person whom we started following
																			console
																					.log("User Following list updated successfully");
																			json_responses = {
																				"status" : 200
																			};
																			//res.send(json_responses);
																			callback(
																					req,
																					json_responses);
																		}

																	});
												}
												console.log(data);
											});
						}
						if (err) {
							console
									.log("Failed to get the user details of the logged in user");
						}
					});
};

exports.getTweetCount = function(req, msg, callback) {
	var res = {};
	console.log("In getTweetCount function -> homepage.js");

	tweetsCollection.findOne({
		"username" : msg.username
	}, function(err, data) {
		if (err) {
			console.log(err);
		}
		if (data) {
			var tCount = data.tweets.length;
			console.log("Number of tweets by user is: " + tCount);

			//Send any value back to browser for displaying in a JSON response as show below
			json_responses = {
				"tweetCount" : tCount
			};
			console.log(json_responses);
			//res.send(json_responses);
			callback(req, json_responses);
		}

	});
};