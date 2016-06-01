//super simple rpc server example
var amqp = require('amqp'), util = require('util');

//Defining the different services
var login = require('./services/login');
var homepage = require('./services/homepage');
var userprofile = require('./services/userprofile');

var cnn = amqp.createConnection({
	host : '127.0.0.1',
	port : 5672
});

cnn.on('ready', function() 
{
	cnn.queue('login_queue', function(req, res) 
	{
		console.log("listening on login_queue");
		
		req.subscribe(function(message, headers, deliveryInfo, m) 
		{
			util.log(util.format(deliveryInfo.routingKey, message));
			util.log("Message: " + JSON.stringify(message));
			util.log("DeliveryInfo: " + JSON.stringify(deliveryInfo));

			if (message.type === "checkLogin") 
			{
				console.log("message type matched to - checklogin");
				
				login.checkLogin(req, message, function(err, res) 
				{
					cnn.publish(m.replyTo, res, 
					{
						contentType : 'application/json',
						contentEncoding : 'utf-8',
						correlationId : m.correlationId
					});
				});
			}
			
			if (message.type === "addUser") 
			{
				console.log("message type matched to - addUser");
				
				login.addUser(req, message, function(err, res) 
				{
					cnn.publish(m.replyTo, res, 
					{
						contentType : 'application/json',
						contentEncoding : 'utf-8',
						correlationId : m.correlationId
					});
				});
			}	
		});
	});

	cnn.queue('homepage_queue', function(req, res) 
	{
		console.log("listening on homepage_queue");
		req.subscribe(function(message, headers, deliveryInfo, m) 
		{
			util.log(util.format(deliveryInfo.routingKey, message));
			util.log("Message: " + JSON.stringify(message));
			util.log("DeliveryInfo: " + JSON.stringify(deliveryInfo));

			if (message.type === "calculateValues") 					 
			{
				console.log("message type matched to - calculateValues");
				
				homepage.calculateValues(req, message, function(err, res) 
				{
					cnn.publish(m.replyTo, res, 
					{
						contentType : 'application/json',
						contentEncoding : 'utf-8',
						correlationId : m.correlationId
					});
				});
			}//End of calculateValues message.type
			
			if (message.type === "renderTweets") 					 
			{
				console.log("message type matched to - renderTweets");
				
				homepage.renderTweets(req, message, function(err, res) 
				{
					cnn.publish(m.replyTo, res, 
					{
						contentType : 'application/json',
						contentEncoding : 'utf-8',
						correlationId : m.correlationId
					});
				});
			}
			
			//addTweet
			if (message.type === "addTweet") 					 
			{
				console.log("message type matched to - addTweet");
				
				homepage.addTweet(req, message, function(err, res) 
				{
					cnn.publish(m.replyTo, res, 
					{
						contentType : 'application/json',
						contentEncoding : 'utf-8',
						correlationId : m.correlationId
					});
				});
			}
			
			if (message.type === "suggestFollowers") 					 
			{
				console.log("message type matched to - suggestFollowers");
				
				homepage.suggestFollowers(req, message, function(err, res) 
				{
					cnn.publish(m.replyTo, res, 
					{
						contentType : 'application/json',
						contentEncoding : 'utf-8',
						correlationId : m.correlationId
					});
				});
			}
			
			if (message.type === "updateFollowers") 					 
			{
				console.log("message type matched to - updateFollowers");
				
				homepage.updateFollowers(req, message, function(err, res) 
				{
					cnn.publish(m.replyTo, res, 
					{
						contentType : 'application/json',
						contentEncoding : 'utf-8',
						correlationId : m.correlationId
					});
				});
			}
			
			if (message.type === "getTweetCount") 					 
			{
				console.log("message type matched to - getTweetCount");
				
				homepage.getTweetCount(req, message, function(err, res) 
				{
					cnn.publish(m.replyTo, res, 
					{
						contentType : 'application/json',
						contentEncoding : 'utf-8',
						correlationId : m.correlationId
					});
				});
			}
		});
	});
	
	cnn.queue('userprofile_queue', function(req, res) 
	{
		console.log("listening on userprofile_queue");
		req.subscribe(function(message, headers, deliveryInfo, m) 
		{
			util.log(util.format(deliveryInfo.routingKey, message));
			util.log("Message: " + JSON.stringify(message));
			util.log("DeliveryInfo: " + JSON.stringify(deliveryInfo));

			if (message.type === "renderUserTweets") 					 
			{
				console.log("message type matched to - renderUserTweets");
						
				userprofile.renderUserTweets(req, message, function(err, res) 
				{
					cnn.publish(m.replyTo, res, 
					{
						contentType : 'application/json',
						contentEncoding : 'utf-8',
						correlationId : m.correlationId
					});
				});
			}//End of calculateValues message.type
			
			if (message.type === "renderUserFollowing") 					 
			{
				console.log("message type matched to - renderUserFollowing");
						
				userprofile.renderUserFollowing(req, message, function(err, res) 
				{
					cnn.publish(m.replyTo, res, 
					{
						contentType : 'application/json',
						contentEncoding : 'utf-8',
						correlationId : m.correlationId
					});
				});
			}
			
			if (message.type === "renderUserFollowers") 					 
			{
				console.log("message type matched to - renderUserFollowers");
						
				userprofile.renderUserFollowers(req, message, function(err, res) 
				{
					cnn.publish(m.replyTo, res, 
					{
						contentType : 'application/json',
						contentEncoding : 'utf-8',
						correlationId : m.correlationId
					});
				});
			}
			
			if (message.type === "getUserProfile") 					 
			{
				console.log("message type matched to - getUserProfile");
						
				userprofile.getUserProfile(req, message, function(err, res) 
				{
					cnn.publish(m.replyTo, res, 
					{
						contentType : 'application/json',
						contentEncoding : 'utf-8',
						correlationId : m.correlationId
					});
				});
			}
			
		});

	});//End of the userprofile_queue
});