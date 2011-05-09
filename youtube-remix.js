/*
Copyright (C) 2011 by Ian Dennis Miller

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var video_list = new Array;
var current_video, player;
var player_mode = 'unknown';
var want_to_start = false;
var done = false;
var delta = 0.0;

// parse the list of video segments, according to the Google IO last call specs
function init_sequence() {
  var regex = />[,)]\s*\<*/;
  var video_temp = mash_cfg.sequence.substr(2).split(regex);
  video_temp.pop();
  for (var i in video_temp) {
    var item = video_temp[i];
    item = item.split(/\s*,\s*/);
    item[1] = parseInt(item[1].replace('s', ''));
    item[2] = parseInt(item[2].replace('s', ''));
    video_list.unshift(item);
  }
  mash_cfg.sequence = null;
}

// advance to the next segment in the configuration
function next_in_sequence() {
  if (video_list.length) {
    return video_list.pop()
  }
  else if (mash_cfg.sequence) {
    init_sequence();
    return video_list.pop()
  }
  else {
    return null;
  }
}

// this fires when the youtube iframe API has loaded
function onYouTubePlayerAPIReady() {
  current_video = next_in_sequence();

  player = new YT.Player(mash_cfg.id, {
    height: mash_cfg.height,
    width: mash_cfg.width,
    videoId: current_video[0],
    playerVars: { 
      'wmode': 'transparent',
      'start': current_video[1], 
      'controls': 0, 
      'autoplay': 0 
    }, 
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

// when the youtube player is ready to play, this fires
function onPlayerReady(event) {
  player.seekTo(current_video[1]);
  if (mash_cfg.fade) {
    $("#mash_screen").fadeOut();
  }
}

// the html5 api requires this nasty hack to ensure it seeks properly
function start_at_seek() {
  if (player_mode == "html5") {
    if (want_to_start && (Math.abs(player.getCurrentTime() - current_video[1])>1)) {
      player.seekTo(current_video[1]);
      setTimeout(start_at_seek, 1000);
    }
    else {
      want_to_start = false;
      player.playVideo();
      $("#mash_screen").fadeOut();
    }
  }
}

// right now, only the flash version of the player API specifies video quality.
// take advantage of this to determine if the iframe is in flash or html5 mode.
function detect_mode() {
  if (player.getPlaybackQuality() == "") {
    player_mode = 'html5';
  }
  else {
    player_mode = 'flash';
    delta = 0.1; // make the video last 0.1 seconds longer...  tweak this as necessary
  }  
}

// this fires each time the player switches from play to pause, etc.
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING) {
    if (player_mode == 'unknown') {
      detect_mode(); // do this once, to see which player mode we're using
    }
    if (mash_cfg.fade && (player_mode == "flash")) {
      $("#mash_screen").fadeOut(); // if mode is html5, it fades elsewhere
    }
    watch_for_clip_end();
  }
  else if (done) { // we're done with the last segment
    stopVideo();
    if (mash_cfg.fade && mash_cfg.hide_when_finished) {
      $("#mash_screen").fadeIn();
    }
  }
}

// sometimes the flash player has trouble loading the video, so this retries until it works
function guarantee_start() {
  if (player_mode == "flash") {
    if (want_to_start && (Math.abs(player.getCurrentTime() - current_video[1])>1)) {
      player.loadVideoById(current_video[0], current_video[1]);
      setTimeout(guarantee_start, 1000);
    }
    else {
      want_to_start = false;
    }
  }
}

// get the next segment, then make sure it plays
function start_next_clip() {
  if (mash_cfg.fade) {
    $("#mash_screen").fadeIn('fast');
  }
  player.stopVideo();
  want_to_start = true;
  if (player_mode == "html5") {
    player.cueVideoById(current_video[0], current_video[1]);
    start_at_seek();
  }
  else {
    player.loadVideoById(current_video[0], current_video[1]);
    guarantee_start();
  }
}

// keep checking to see if we're at the specified end of the segment
// NB: an end point longer than the duration of the video will cause trouble here
function watch_for_clip_end() {
  if (current_video && !want_to_start && (player.getCurrentTime() > (current_video[2]+delta))) {
    if (current_video = next_in_sequence()) {
      start_next_clip();
    }
    else {
      done = true;
      stopVideo();
    }
  }
  else if (current_video) {
    setTimeout(watch_for_clip_end, 50);
  }
}

// whatever.
function stopVideo() {
  player.stopVideo();
}

// this sets up the HTML and CSS for the neat fading transition effect
function add_screen() {
  try {
    $("body").prepend($("<div id='mash_screen'>"));
    var pos = $("#"+mash_cfg.id).offset();
    $("#mash_screen").css({
      'width': ''+mash_cfg.width+'px',
      'height': ''+mash_cfg.height+'px',
      'z-index': '99',
      'background': 'white',
      'position': 'absolute',
      'left': pos.left,
      'top': pos.top
    });

    $(window).resize(function() {
      var pos = $("#"+mash_cfg.id).offset();
      $("#mash_screen").css({
        'left': pos.left,
        'top': pos.top
      });
    });
  }
  catch(err) {
    setTimeout(add_screen, 50);
  }
}

// load some javascript prereqs, and get cracking.
var start = function() {
  var tag1 = document.createElement('script');
  tag1.src = "//ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js";
  var tag2 = document.createElement('script');
  tag2.src = "//www.youtube.com/player_api";

  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag1, firstScriptTag);
  firstScriptTag.parentNode.insertBefore(tag2, firstScriptTag);
  if (mash_cfg.fade) {
    add_screen();
  }
}

// get everything moving!
start();

