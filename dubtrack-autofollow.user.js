/*
 * dubtrack-autofollow
 *
 * For more information and installation instructions, please see:
 * https://github.com/ronaldojf/dubtrack-autofollow/
*/

// ==UserScript==
// @name         dubtrack-autofollow
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Automatically watch if there's users in the current room to follow.
// @author       Ronaldo Fuzinato
// @site         https://github.com/ronaldojf/dubtrack-autofollow/
// @match        *://dubtrack.fm/*
// @match        *://www.dubtrack.fm/*
// @grant        none
// @updateURL    https://github.com/ronaldojf/dubtrack-autofollow/raw/master/dubtrack-autofollow.user.js
// ==/UserScript==

(function($, console, Dubtrack) {
  'use strict';

  $(function() {
    var followUser = function(userId, callback) {
      var followingUrl = Dubtrack.config.apiUrl + Dubtrack.config.urls.userFollowing.replace(':id', userId);
      Dubtrack.helpers.sendRequest(followingUrl, {}, 'post', callback);
    };

    var followUsersRecursively = function(idsCollection, callback, currentIndex) {
      currentIndex = currentIndex || 0;

      if (idsCollection.length > 0 && currentIndex <= (idsCollection.length - 1)) {
        followUser(idsCollection[currentIndex], function() {
          followUsersRecursively(idsCollection, callback, currentIndex + 1);
        });
      } else {
        callback();
      }
    };

    var setup = function() {
      if (Dubtrack.session.id && ((Dubtrack.room || {}).users || {}).rt_users) {
        var followUrl = Dubtrack.config.apiUrl + Dubtrack.config.urls.userFollow.replace(':id', Dubtrack.session.id);

        Dubtrack.helpers.sendRequest(followUrl, {}, 'get', function(err, response) {
          var toFollow = [];
          var users = Dubtrack.room.users.rt_users;
          var followings = response.data.map(function(follow) { return follow.following; });

          for (var i = 0; i < users.length; i++) {
            if (followings.indexOf(users[i]) === -1) {
              toFollow.push(users[i]);
            }
          }

          console.log('dubtrack-autofollow: Going to follow ' + toFollow.length + ' users now! You already have ' + followings.length + ' followings.');
          followUsersRecursively(toFollow, function() {
            watchForNewFollowings(followings);
          });
        });
      } else {
        console.error('dubtrack-autofollow: Setup failed! Make sure you are signed in and in a room.');
      }
    };

    var watchForNewFollowings = function(followings) {
      Dubtrack.Events.bind('realtime:user-join', function(data) {
        if (followings.indexOf(data.user._id) === -1) {
          followUser(data.user._id, function(err) {
            if (!err) {
              followings.push(data.user._id);
              console.log('dubtrack-autofollow: ' + data.user.username + ' has been followed. You have now ' + followings.length + ' followings.');
            }
          });
        }
      });
    };

    setTimeout(setup, 15 * 1000);
  });

})($, console, Dubtrack);
