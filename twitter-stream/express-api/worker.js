/*jslint node: true */
'use strict';
var config = require('./config');

// Get dependencies
var Twitter = require('twitter');
var twitterText = require('twitter-text');
var async = require('async');
var stringHash = require('string-hash');
var _ = require('lodash');

// Set up Twitter client
var client = new Twitter(config.twitter);

// Set up connection to Redis
var redis_conn = require("redis");
var redis = redis_conn.createClient(config.redis.url, {detect_buffers: true, no_ready_check: true});

redis.on("error", function (err) {
    console.log("Error: " + err);
});


console.log("Initiating Streaming from", config.app.channels);

/**
 * Stream statuses filtered by keyword
 * number of tweets per second depends on topic popularity
 **/
var twitterSubscribe  = function(channel) {
  client.stream('statuses/filter', {track: channel, lang: 'en'},  function(stream) {
    stream.on('data', function(tweet) {
      var tweetHashChannel = config.store.tweetHash + ':' + channel;
      var tweetSetChannel = config.store.tweetSet + ':' + channel;
      var voteZsetChannel = config.store.voteZset + ':' + channel;
      var hashtagZsetChannel = config.store.hashtagZset + ':' + channel;

      console.log(JSON.stringify(channel, tweet.text, null, 4));

      //Hash with tweet text
      redis.hset(tweetHashChannel, tweet.id_str, tweet.text);

      //Set with tweets id
      redis.sadd(tweetSetChannel, tweet.id_str);

      //Preparing zset vote index
      var tVote = [ voteZsetChannel, 0, tweet.id_str ];
      redis.zadd(tVote);

      var args = [ hashtagZsetChannel ];
      async.forEach(twitterText.extractHashtags(tweet.text),
        function (hashtag, callback) {
          console.log("Found hashtag ", hashtag);
          args.push(stringHash(hashtag));
          args.push(tweet.id_str);
          callback();
        },
        function (err) {
          console.log(JSON.stringify(args, null, 4));
          redis.zadd(args, function (err, response) {
            if (err) {
              console.error("ZADD error ", err);
              return;
            }
          });
        }
      );
    });

    stream.on('error', function(error) {
        console.log(error);
    });
  });
};

_.mapKeys(config.app.channels, twitterSubscribe);
