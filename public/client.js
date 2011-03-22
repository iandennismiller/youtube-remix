var done = false;
var video_list = new Array;
var current_video, player;

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

function onPlayerReady(event) {
  player.seekTo(current_video[1]);
  //console.log('starting');
  $("#screen").fadeOut();
}

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING) {
    $("#screen").fadeOut();
    watch_for_clip_end();
  }
  else if (done) {
    stopVideo();
    if (mash_cfg.hide_when_finished) {
      $("#screen").fadeIn();
    }
  }
}

function start_next_clip() {
  $("#screen").fadeIn();
  player.stopVideo();
  player.loadVideoById(current_video[0], current_video[1]);
}

function watch_for_clip_end() {
  if (current_video && (player.getCurrentTime() > (current_video[2]+0.1))) {
    if (current_video = next_in_sequence()) {
      start_next_clip();
    }
    else {
      //console.log("end");
      done = true;
      stopVideo();
    }
  }
  else if (current_video) {
    setTimeout(watch_for_clip_end, 50);
  }
}

function stopVideo() {
  player.stopVideo();
}

function add_screen() {
  try {
    $("body").prepend($("<div id='screen'>"));
    var pos = $("#"+mash_cfg.id).offset();
    $("#screen").css({
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
      $("#screen").css({
        'left': pos.left,
        'top': pos.top
      });
    });
  }
  catch(err) {
    setTimeout(add_screen, 50);
  }
}

var start = function() {
  var tag1 = document.createElement('script');
  tag1.src = "//ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js";
  var tag2 = document.createElement('script');
  tag2.src = "//www.youtube.com/player_api";

  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag1, firstScriptTag);
  firstScriptTag.parentNode.insertBefore(tag2, firstScriptTag);
  add_screen();
}

start();
