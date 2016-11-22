/*
 * dubtrack-autofollow
 *
 * For more information and installation instructions, please see:
 * https://github.com/ronaldojf/dubtrack-autofollow/
*/

// ==UserScript==
// @name         dubtrack-autofollow
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Automatically checks if there's users in the current room to follow.
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
    var followUsersRecursively = function(idsCollection, currentIndex) {
      currentIndex = currentIndex || 0;

      if (idsCollection.length > 0 && currentIndex <= (idsCollection.length - 1)) {
        var followingUrl = Dubtrack.config.apiUrl + Dubtrack.config.urls.userFollowing.replace(':id', idsCollection[currentIndex]);

        Dubtrack.helpers.sendRequest(followingUrl, {}, 'post', function() {
          followUsersRecursively(idsCollection, currentIndex + 1);
        });
      }
    };

    var refreshFollows = function() {
      if (Dubtrack.session.id && ((Dubtrack.room || {}).users || {}).rt_users) {
        var followUrl = Dubtrack.config.apiUrl + Dubtrack.config.urls.userFollow.replace(':id', Dubtrack.session.id);

        Dubtrack.helpers.sendRequest(followUrl, {}, 'get', function(err, response) {
          var toFollow = [];
          var users = Dubtrack.room.users.rt_users;
          var follows = response.data.map(function(follow) { return follow.following; });

          for (var i = 0; i < users.length; i++) {
            if (follows.indexOf(users[i]) === -1) {
              toFollow.push(users[i]);
            }
          }

          console.log('dubtrack-autofollow: Going to follow ' + toFollow.length + ' users now! You already have ' + follows.length + ' follows.');
          followUsersRecursively(toFollow);
        });
      }
    };

    setInterval(refreshFollows, 20 * 60 * 1000);
    setTimeout(refreshFollows, 15 * 1000);
  });

})($, console, Dubtrack);
