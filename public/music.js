"use strict";

////////////////////////////////////////////////////////////////////////////////////////////////////
// base ////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// Firebase
var firebaseConfig = {
  "apiKey": "AIzaSyAUvAYQn3Ydv1QzlcX4NIfk5YBb3KJkab4",
  "authDomain": "player-e985a.firebaseapp.com",
  "databaseURL": "https://player-e985a.firebaseio.com",
  "projectId": "player-e985a",
  "storageBucket": "player-e985a.appspot.com",
  "messagingSenderId": "70806897195",
  "appId": "1:70806897195:web:a79dbcc1affa29c458206e"
};
firebase.initializeApp(firebaseConfig); // Authentication

var user;
firebase.auth().onAuthStateChanged(function (response) {
  user = response;
  if (!user) window.location = "/";
}); ////////////////////////////////////////////////////////////////////////////////////////////////////

var app = {};
var ui = {};
var $ui = {};
var cue = {}; // TODO: mover para lugar apropriado

$(function () {
  $ui["library"] = $(".library");
});

var duration = function duration(seconds) {
  return moment.utc(moment.duration(seconds, "seconds").asMilliseconds()).format("m:ss");
}; ////////////////////////////////////////////////////////////////////////////////////////////////////
// core / template engine //////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////


ui.template = function () {
  var $templates = {};
  $(function () {
    $("template").each(function () {
      var $this = $(this);
      var name = $this.attr("id");
      var html = $this.html();
      $templates[name] = $(html);
      $this.remove();
    });
  });

  var render = function render(template, data) {
    if (!$templates[template]) {
      return false;
    }

    var $render = $templates[template].clone();
    $render.data(data);

    $.fn.fillBlanks = function () {
      var $blank = $(this);
      var fill = $blank.data("fill");
      var rules = fill.split(",");

      for (var i = 0; i < rules.length; i++) {
        var pair = rules[i].split(":");
        var dest = pair[1] ? pair[0].trim() : "html";
        var source = pair[1] ? pair[1].trim() : pair[0];
        var value = data[source];
        source = source.split("/");

        if (source.length > 1 && typeof value !== "undefined") {
          value = data[source[0]];

          for (var j = 1; j < source.length; j++) {
            value = value[source[j]] ? value[source[j]] : null;
          }
        }

        if (typeof value !== "undefined" && value !== null) {
          if (dest === "class") {
            $blank.addClass(value);
          } else if (dest === "html") {
            $blank.html(value);
          } else if (dest === "value") {
            $blank.val(value);
          } else {
            $blank.attr(dest, value);
          }
        } else {
          var if_null = $blank.data("fill-null");

          if (if_null === "hide") {
            $blank.hide();
          } else if (if_null === "remove") {
            $blank.remove();
          }
        }
      }

      $blank.removeClass("fill").removeAttr("data-fill").removeAttr("data-fill-null");
    };

    if ($render.hasClass("fill")) {
      $render.fillBlanks();
    }

    $(".fill", $render).each(function () {
      $(this).fillBlanks();
    });
    return $render;
  };

  return {
    render: render
  };
}();

var __render = ui.template.render; ////////////////////////////////////////////////////////////////////////////////////////////////////
// player //////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

var queue = [{
  "title": "Captain Calvin (Original Mix)",
  "artist": "Louk",
  "album": "Chillhop Essentials Winter 2018",
  "length": 140,
  "cover": "https://lh3.googleusercontent.com/JJAK0mX_p5KLf9_efSEr7l2o2oAGyCn7b8-pOsfp8_jf02uvJUIJ1pDtDZx1JsJAfM5YOe2BIEA",
  "file": "/data/files/14 Captain Calvin (Original Mix).mp3"
}, {
  "title": "Tico Tico",
  "artist": "Oscar Peterson",
  "album": "Ultimate Jazz Collections",
  "length": 180,
  "cover": "https://lh5.ggpht.com/hwEKMItKyFyHIgNl28CfbBr-RYLvNhDUj_SFe757m_gH2yNsoRXYmXgWI02tkAoVLKCNIihb",
  "file": "/data/files/30 Tico Tico.m4a"
}, {
  "title": "A Hazy Shade of Winter",
  "artist": "Simon & Garfunkel",
  "album": "Bookends",
  "length": 137,
  "cover": "https://lh3.googleusercontent.com/mfcnZMpqYi2OIslr9U56PecJytP2jQAj9BcOfx7mEkCCBTRI4VxpwzVe5Gur_qS5Xk1kRli5gQ",
  "file": "/data/files/11 A Hazy Shade of Winter.m4a"
}];
var $np;
var $player = document.createElement("audio");

app.Player = function () {
  var queue_position = 0;
  var repeat = "none";
  var repeat_options = ["none", "all", "one"]; ////////////////////////////////////////////////////////////////////////////////////////////////
  // Eventos
  // Define o tempo de duração quando uma música é carregada música

  $player.addEventListener("loadedmetadata", function () {
    var length = duration($player.duration);
    $np.length.text(length);
  }); // Atualiza barra de tempo

  $player.addEventListener("timeupdate", function () {
    var position = duration($player.currentTime);
    $np.position.text(position);
    var percent = $player.currentTime / $player.duration * 100;
    $np.elapsed.css("width", percent + "%");
  }); // Passa para próxima música quando a atual chega ao fim

  $player.addEventListener("ended", function () {
    if (repeat === "one") {
      $player.currentTime = 0;
      app.Player.play();
    } else {
      app.Player.nextTrack();
    }
  }); ////////////////////////////////////////////////////////////////////////////////////////////////

  $(function () {
    $np = $(".now-playing");
    $np.position = $(".now-playing .position");
    $np.length = $(".now-playing .length");
    $np.timeline = $(".now-playing .bar");
    $np.elapsed = $(".now-playing .elapsed");
    $np.song = $(".now-playing .song");
    $np.artist = $(".now-playing .artist");
    $np.album = $(".now-playing .album");
    $np.cover = $(".now-playing .cover");
    $ui["now-playing"] = $(".now-playing");
    $(".play-pause", $ui["now-playing"]).on("click", app.Player.playPause);
    $(".skip-previous", $ui["now-playing"]).on("click", app.Player.previousTrack);
    $(".skip-next", $ui["now-playing"]).on("click", app.Player.nextTrack);
    $(".repeat", $ui["now-playing"]).on("click", app.Player.toggleRepeat); // Cliques na linha do tempo

    $np.timeline.on("click", function (event) {
      var width = $(event.delegateTarget).width();
      var position = event.offsetX;
      var percent = position / width;
      var position_in_seconds = $player.duration * percent;
      app.Player.skipToPosition(position_in_seconds);
    }); // Carrega a primeira música da fila

    app.Player.load(queue[queue_position]);
  }); // const updateTimeline
  ////////////////////////////////////////////////////////////////////////////////////////////////
  // app.Player.skipToPosition()

  var load = function load(song) {
    // Pausa a reprodução, reseta o tempo e carrega a nova música
    app.Player.pause();
    $player.currentTime = 0;
    $player.src = song["file"]; // Atualiza as informações sobre a música em reprodução

    $np.song.text(song["title"]);
    $np.artist.text(song["artist"]);
    $np.album.text(song["album"]);
    $np.cover.css("background-image", "url('" + song["cover"] + "')"); // Atualiza dados da Media Session API

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        "title": song["title"],
        "artist": song["artist"],
        "album": song["album"],
        "artwork": [{
          "src": song["cover"],
          "sizes": "512x512",
          "type": "image/png"
        }]
      });
    } // Inicia a reprodução


    app.Player.play();
  }; ////////////////////////////////////////////////////////////////////////////////////////////////
  // app.Player.skipToPosition()


  var skipToPosition = function skipToPosition(seconds) {
    $player.currentTime = seconds;
  }; ////////////////////////////////////////////////////////////////////////////////////////////////
  // app.Player.play()


  var play = function play() {
    $player.play();
    $np.removeClass("-state--paused").addClass("-state--playing");
  }; ////////////////////////////////////////////////////////////////////////////////////////////////
  // app.Player.pause()


  var pause = function pause() {
    $player.pause();
    $np.removeClass("-state--playing").addClass("-state--paused");
  }; ////////////////////////////////////////////////////////////////////////////////////////////////
  // app.Player.playPause()


  var playPause = function playPause() {
    if ($player.paused) {
      app.Player.play();
    } else {
      app.Player.pause();
    } // console.log("duration", $player.duration);
    // console.log("volume", $player.volume);
    // console.log("buffered", $player.buffered);
    // console.log("networkState", $player.networkState);
    // console.log("played", $player.played);
    // console.log("readyState", $player.readyState);
    // console.log("seekable", $player.seekable);

  }; ////////////////////////////////////////////////////////////////////////////////////////////////
  // app.Player.previousTrack()


  var previousTrack = function previousTrack() {
    // Se tiver após os 5 segundos da música atual, volta para o começo
    if ($player.currentTime > 5) {
      $player.currentTime = 0;
    } else {
      queue_position = (queue_position - 1 + queue.length) % queue.length;
      app.Player.load(queue[queue_position]);
    }
  }; ////////////////////////////////////////////////////////////////////////////////////////////////
  // app.Player.nextTrack()


  var nextTrack = function nextTrack() {
    if (queue_position + 1 < queue.length || repeat === "all") {
      queue_position = (queue_position + 1) % queue.length;
      app.Player.load(queue[queue_position]);
    }
  }; ////////////////////////////////////////////////////////////////////////////////////////////////
  // app.Player.toggleRepeat()


  var toggleRepeat = function toggleRepeat() {
    var current_value = repeat;
    var new_value = repeat_options[repeat_options.indexOf(current_value) + 1];
    repeat = new_value;
    $(".repeat", $ui["now-playing"]).removeClass("-option--" + current_value).addClass("-option--" + new_value);
  }; ////////////////////////////////////////////////////////////////////////////////////////////////


  return {
    load: load,
    skipToPosition: skipToPosition,
    play: play,
    pause: pause,
    playPause: playPause,
    previousTrack: previousTrack,
    nextTrack: nextTrack,
    toggleRepeat: toggleRepeat
  };
}();

if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", app.Player.play);
  navigator.mediaSession.setActionHandler("pause", app.Player.pause); // navigator.mediaSession.setActionHandler("seekbackward", function () { });
  // navigator.mediaSession.setActionHandler("seekforward", function () { });

  navigator.mediaSession.setActionHandler("previoustrack", app.Player.previousTrack);
  navigator.mediaSession.setActionHandler("nexttrack", app.Player.nextTrack);
} ////////////////////////////////////////////////////////////////////////////////////////////////////
// artist //////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////


app.Artist = function () {
  ////////////////////////////////////////////////////////////////////////////////////////////////
  // app.Artist.load()
  var load = function load(artist_id) {
    $.get("data/artists/" + artist_id + ".json").done(function (response) {
      var artist = response;

      var $artist = __render("artist", artist); // Álbuns


      var albums = artist["albums"];
      var $albums = $(".albums", $artist);
      albums.forEach(function (album) {
        album["cover-art"] = "background-image: url('" + album["cover"] + "')";

        var $album = __render("artist-album", album).appendTo($albums);
      }); // Hits

      var hits = artist["hits"];
      var $hits = $(".hits", $artist);
      hits.forEach(function (hit) {
        hit["formatted-length"] = duration(hit["length"]);

        var $hit = __render("artist-hit", hit).appendTo($hits);
      }); // Coloca na tela

      $ui["library"].empty().append($artist);
    });
  }; ////////////////////////////////////////////////////////////////////////////////////////////////


  return {
    load: load
  };
}(); ////////////////////////////////////////////////////////////////////////////////////////////////////
// upload //////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////


var storage = firebase.storage().ref(); // const musicStorage = storage.child("songs");

var $upload = $(".upload");
var dropzone = new Dropzone(".upload", {
  url: "/upload"
}); // Mostra/esconde dropzone ao entrar com arquivo na página

$(window).on("dragenter", function (event) {
  $upload.addClass("-state--active");
});
$(window).on("dragleave", function (event) {
  if ($(event.target).hasClass("upload")) {
    $upload.removeClass("-state--active");
  }
}); // Arquivo adicionado

dropzone.on("addedfile", function (file) {
  console.log(file);
  var uploadTask = storage.child("songs/".concat(user.uid, "/").concat(file.name)).put(file);
  uploadTask.on("state_changed", function (snapshot) {
    var progress = snapshot.bytesTransferred / snapshot.totalBytes * 100;
    console.log("Upload is " + progress + "% done"); // switch (snapshot.state) {
    // 	case "paused":
    // 		console.log("Upload is paused");
    // 		break;
    // 	case "running":
    // 		console.log("Upload is running");
    // 		break;
    // }
  }, function (error) {
    console.log(error);
  }, function () {
    uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
      console.log("File available at", downloadURL);
    });
  });
  jsmediatags.read(file, {
    onSuccess: function onSuccess(tag) {
      console.log(tag);
    },
    onError: function onError(error) {
      console.log(error);
    }
  });
}); ////////////////////////////////////////////////////////////////////////////////////////////////////
// commands ////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

var commands = [{
  "title": "Play/Pause",
  "shortcut": ["k", "space"],
  "function": function _function() {
    app.Player.playPause();
  }
}, {
  "title": "Música anterior",
  "shortcut": [","],
  "function": function _function() {
    app.Player.previousTrack();
  }
}, {
  "title": "Próxima música",
  "shortcut": ["."],
  "function": function _function() {
    app.Player.nextTrack();
  }
}];
commands.forEach(function (command) {
  command["shortcut"].forEach(function (shortcut) {
    Mousetrap.bind(shortcut, function () {
      command["function"]();
      return false;
    });
  });
}); // - J: volta 10 segundos
// - L: avança 10 segundos
// - R: repeat
// - S: shuffle
// - M: mudo
// # Navegação
// - g f: favoritos
// - g l: biblioteca
// - g p: playlists
////////////////////////////////////////////////////////////////////////////////////////////////////
// start ///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

$(function () {
  app.Artist.load("the-beatles");
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhc2UuanMiLCJ0ZW1wbGF0ZS1lbmdpbmUuanMiLCJwbGF5ZXIuanMiLCJhcnRpc3QuanMiLCJ1cGxvYWQuanMiLCJjb21tYW5kcy5qcyIsInN0YXJ0LmpzIl0sIm5hbWVzIjpbImZpcmViYXNlQ29uZmlnIiwiZmlyZWJhc2UiLCJpbml0aWFsaXplQXBwIiwidXNlciIsImF1dGgiLCJvbkF1dGhTdGF0ZUNoYW5nZWQiLCJyZXNwb25zZSIsIndpbmRvdyIsImxvY2F0aW9uIiwiYXBwIiwidWkiLCIkdWkiLCJjdWUiLCIkIiwiZHVyYXRpb24iLCJzZWNvbmRzIiwibW9tZW50IiwidXRjIiwiYXNNaWxsaXNlY29uZHMiLCJmb3JtYXQiLCJ0ZW1wbGF0ZSIsIiR0ZW1wbGF0ZXMiLCJlYWNoIiwiJHRoaXMiLCJuYW1lIiwiYXR0ciIsImh0bWwiLCJyZW1vdmUiLCJyZW5kZXIiLCJkYXRhIiwiJHJlbmRlciIsImNsb25lIiwiZm4iLCJmaWxsQmxhbmtzIiwiJGJsYW5rIiwiZmlsbCIsInJ1bGVzIiwic3BsaXQiLCJpIiwibGVuZ3RoIiwicGFpciIsImRlc3QiLCJ0cmltIiwic291cmNlIiwidmFsdWUiLCJqIiwiYWRkQ2xhc3MiLCJ2YWwiLCJpZl9udWxsIiwiaGlkZSIsInJlbW92ZUNsYXNzIiwicmVtb3ZlQXR0ciIsImhhc0NsYXNzIiwiX19yZW5kZXIiLCJxdWV1ZSIsIiRucCIsIiRwbGF5ZXIiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJQbGF5ZXIiLCJxdWV1ZV9wb3NpdGlvbiIsInJlcGVhdCIsInJlcGVhdF9vcHRpb25zIiwiYWRkRXZlbnRMaXN0ZW5lciIsInRleHQiLCJwb3NpdGlvbiIsImN1cnJlbnRUaW1lIiwicGVyY2VudCIsImVsYXBzZWQiLCJjc3MiLCJwbGF5IiwibmV4dFRyYWNrIiwidGltZWxpbmUiLCJzb25nIiwiYXJ0aXN0IiwiYWxidW0iLCJjb3ZlciIsIm9uIiwicGxheVBhdXNlIiwicHJldmlvdXNUcmFjayIsInRvZ2dsZVJlcGVhdCIsImV2ZW50Iiwid2lkdGgiLCJkZWxlZ2F0ZVRhcmdldCIsIm9mZnNldFgiLCJwb3NpdGlvbl9pbl9zZWNvbmRzIiwic2tpcFRvUG9zaXRpb24iLCJsb2FkIiwicGF1c2UiLCJzcmMiLCJuYXZpZ2F0b3IiLCJtZWRpYVNlc3Npb24iLCJtZXRhZGF0YSIsIk1lZGlhTWV0YWRhdGEiLCJwYXVzZWQiLCJjdXJyZW50X3ZhbHVlIiwibmV3X3ZhbHVlIiwiaW5kZXhPZiIsInNldEFjdGlvbkhhbmRsZXIiLCJBcnRpc3QiLCJhcnRpc3RfaWQiLCJnZXQiLCJkb25lIiwiJGFydGlzdCIsImFsYnVtcyIsIiRhbGJ1bXMiLCJmb3JFYWNoIiwiJGFsYnVtIiwiYXBwZW5kVG8iLCJoaXRzIiwiJGhpdHMiLCJoaXQiLCIkaGl0IiwiZW1wdHkiLCJhcHBlbmQiLCJzdG9yYWdlIiwicmVmIiwiJHVwbG9hZCIsImRyb3B6b25lIiwiRHJvcHpvbmUiLCJ1cmwiLCJ0YXJnZXQiLCJmaWxlIiwiY29uc29sZSIsImxvZyIsInVwbG9hZFRhc2siLCJjaGlsZCIsInVpZCIsInB1dCIsInNuYXBzaG90IiwicHJvZ3Jlc3MiLCJieXRlc1RyYW5zZmVycmVkIiwidG90YWxCeXRlcyIsImVycm9yIiwiZ2V0RG93bmxvYWRVUkwiLCJ0aGVuIiwiZG93bmxvYWRVUkwiLCJqc21lZGlhdGFncyIsInJlYWQiLCJvblN1Y2Nlc3MiLCJ0YWciLCJvbkVycm9yIiwiY29tbWFuZHMiLCJjb21tYW5kIiwic2hvcnRjdXQiLCJNb3VzZXRyYXAiLCJiaW5kIl0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtBQUVBO0FBQ0EsSUFBQUEsY0FBQSxHQUFBO0FBQ0EsWUFBQSx5Q0FEQTtBQUVBLGdCQUFBLDhCQUZBO0FBR0EsaUJBQUEscUNBSEE7QUFJQSxlQUFBLGNBSkE7QUFLQSxtQkFBQSwwQkFMQTtBQU1BLHVCQUFBLGFBTkE7QUFPQSxXQUFBO0FBUEEsQ0FBQTtBQVVBQyxRQUFBLENBQUFDLGFBQUEsQ0FBQUYsY0FBQSxFLENBRUE7O0FBQ0EsSUFBQUcsSUFBQTtBQUVBRixRQUFBLENBQUFHLElBQUEsR0FBQUMsa0JBQUEsQ0FBQSxVQUFBQyxRQUFBLEVBQUE7QUFDQUgsRUFBQUEsSUFBQSxHQUFBRyxRQUFBO0FBQ0EsTUFBQSxDQUFBSCxJQUFBLEVBQUFJLE1BQUEsQ0FBQUMsUUFBQSxHQUFBLEdBQUE7QUFDQSxDQUhBLEUsQ0FLQTs7QUFFQSxJQUFBQyxHQUFBLEdBQUEsRUFBQTtBQUVBLElBQUFDLEVBQUEsR0FBQSxFQUFBO0FBQ0EsSUFBQUMsR0FBQSxHQUFBLEVBQUE7QUFFQSxJQUFBQyxHQUFBLEdBQUEsRUFBQSxDLENBS0E7O0FBQ0FDLENBQUEsQ0FBQSxZQUFBO0FBQ0FGLEVBQUFBLEdBQUEsQ0FBQSxTQUFBLENBQUEsR0FBQUUsQ0FBQSxDQUFBLFVBQUEsQ0FBQTtBQUNBLENBRkEsQ0FBQTs7QUFJQSxJQUFBQyxRQUFBLEdBQUEsU0FBQUEsUUFBQSxDQUFBQyxPQUFBLEVBQUE7QUFDQSxTQUFBQyxNQUFBLENBQUFDLEdBQUEsQ0FBQUQsTUFBQSxDQUFBRixRQUFBLENBQUFDLE9BQUEsRUFBQSxTQUFBLEVBQUFHLGNBQUEsRUFBQSxFQUFBQyxNQUFBLENBQUEsTUFBQSxDQUFBO0FBQ0EsQ0FGQSxDLENDMUNBO0FBQ0E7QUFDQTs7O0FBRUFULEVBQUEsQ0FBQVUsUUFBQSxHQUFBLFlBQUE7QUFDQSxNQUFBQyxVQUFBLEdBQUEsRUFBQTtBQUVBUixFQUFBQSxDQUFBLENBQUEsWUFBQTtBQUNBQSxJQUFBQSxDQUFBLENBQUEsVUFBQSxDQUFBLENBQUFTLElBQUEsQ0FBQSxZQUFBO0FBQ0EsVUFBQUMsS0FBQSxHQUFBVixDQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsVUFBQVcsSUFBQSxHQUFBRCxLQUFBLENBQUFFLElBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxVQUFBQyxJQUFBLEdBQUFILEtBQUEsQ0FBQUcsSUFBQSxFQUFBO0FBRUFMLE1BQUFBLFVBQUEsQ0FBQUcsSUFBQSxDQUFBLEdBQUFYLENBQUEsQ0FBQWEsSUFBQSxDQUFBO0FBQ0FILE1BQUFBLEtBQUEsQ0FBQUksTUFBQTtBQUNBLEtBUEE7QUFRQSxHQVRBLENBQUE7O0FBV0EsTUFBQUMsTUFBQSxHQUFBLFNBQUFBLE1BQUEsQ0FBQVIsUUFBQSxFQUFBUyxJQUFBLEVBQUE7QUFDQSxRQUFBLENBQUFSLFVBQUEsQ0FBQUQsUUFBQSxDQUFBLEVBQUE7QUFBQSxhQUFBLEtBQUE7QUFBQTs7QUFDQSxRQUFBVSxPQUFBLEdBQUFULFVBQUEsQ0FBQUQsUUFBQSxDQUFBLENBQUFXLEtBQUEsRUFBQTtBQUVBRCxJQUFBQSxPQUFBLENBQUFELElBQUEsQ0FBQUEsSUFBQTs7QUFFQWhCLElBQUFBLENBQUEsQ0FBQW1CLEVBQUEsQ0FBQUMsVUFBQSxHQUFBLFlBQUE7QUFDQSxVQUFBQyxNQUFBLEdBQUFyQixDQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsVUFBQXNCLElBQUEsR0FBQUQsTUFBQSxDQUFBTCxJQUFBLENBQUEsTUFBQSxDQUFBO0FBRUEsVUFBQU8sS0FBQSxHQUFBRCxJQUFBLENBQUFFLEtBQUEsQ0FBQSxHQUFBLENBQUE7O0FBQ0EsV0FBQSxJQUFBQyxDQUFBLEdBQUEsQ0FBQSxFQUFBQSxDQUFBLEdBQUFGLEtBQUEsQ0FBQUcsTUFBQSxFQUFBRCxDQUFBLEVBQUEsRUFBQTtBQUNBLFlBQUFFLElBQUEsR0FBQUosS0FBQSxDQUFBRSxDQUFBLENBQUEsQ0FBQUQsS0FBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLFlBQUFJLElBQUEsR0FBQUQsSUFBQSxDQUFBLENBQUEsQ0FBQSxHQUFBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLENBQUFFLElBQUEsRUFBQSxHQUFBLE1BQUE7QUFDQSxZQUFBQyxNQUFBLEdBQUFILElBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBRSxJQUFBLEVBQUEsR0FBQUYsSUFBQSxDQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUFJLEtBQUEsR0FBQWYsSUFBQSxDQUFBYyxNQUFBLENBQUE7QUFFQUEsUUFBQUEsTUFBQSxH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QSIsImZpbGUiOiJtdXNpYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gYmFzZSAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4vLyBGaXJlYmFzZVxyXG5jb25zdCBmaXJlYmFzZUNvbmZpZyA9IHtcclxuICAgIFwiYXBpS2V5XCI6IFwiQUl6YVN5QVV2QVlRbjNZZHYxUXpsY1g0TklmazVZQmIzS0prYWI0XCIsXHJcbiAgICBcImF1dGhEb21haW5cIjogXCJwbGF5ZXItZTk4NWEuZmlyZWJhc2VhcHAuY29tXCIsXHJcbiAgICBcImRhdGFiYXNlVVJMXCI6IFwiaHR0cHM6Ly9wbGF5ZXItZTk4NWEuZmlyZWJhc2Vpby5jb21cIixcclxuICAgIFwicHJvamVjdElkXCI6IFwicGxheWVyLWU5ODVhXCIsXHJcbiAgICBcInN0b3JhZ2VCdWNrZXRcIjogXCJwbGF5ZXItZTk4NWEuYXBwc3BvdC5jb21cIixcclxuICAgIFwibWVzc2FnaW5nU2VuZGVySWRcIjogXCI3MDgwNjg5NzE5NVwiLFxyXG4gICAgXCJhcHBJZFwiOiBcIjE6NzA4MDY4OTcxOTU6d2ViOmE3OWRiY2MxYWZmYTI5YzQ1ODIwNmVcIlxyXG59O1xyXG5cclxuZmlyZWJhc2UuaW5pdGlhbGl6ZUFwcChmaXJlYmFzZUNvbmZpZyk7XHJcblxyXG4vLyBBdXRoZW50aWNhdGlvblxyXG5sZXQgdXNlcjtcclxuXHJcbmZpcmViYXNlLmF1dGgoKS5vbkF1dGhTdGF0ZUNoYW5nZWQoKHJlc3BvbnNlKSA9PiB7XHJcbiAgICB1c2VyID0gcmVzcG9uc2U7XHJcbiAgICBpZiAoIXVzZXIpIHdpbmRvdy5sb2NhdGlvbiA9IFwiL1wiO1xyXG59KTtcclxuXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbmxldCBhcHAgPSB7IH07XHJcblxyXG5sZXQgdWkgPSB7IH07XHJcbmxldCAkdWkgPSB7IH07XHJcblxyXG5sZXQgY3VlID0geyB9O1xyXG5cclxuXHJcblxyXG5cclxuLy8gVE9ETzogbW92ZXIgcGFyYSBsdWdhciBhcHJvcHJpYWRvXHJcbiQoZnVuY3Rpb24oKSB7XHJcbiAgICAkdWlbXCJsaWJyYXJ5XCJdID0gJChcIi5saWJyYXJ5XCIpO1xyXG59KTtcclxuXHJcbmNvbnN0IGR1cmF0aW9uID0gKHNlY29uZHMpID0+IHtcclxuICAgIHJldHVybiBtb21lbnQudXRjKG1vbWVudC5kdXJhdGlvbihzZWNvbmRzLCBcInNlY29uZHNcIikuYXNNaWxsaXNlY29uZHMoKSkuZm9ybWF0KFwibTpzc1wiKTtcclxufTtcclxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBjb3JlIC8gdGVtcGxhdGUgZW5naW5lIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbnVpLnRlbXBsYXRlID0gKCgpID0+IHtcclxuICAgIGxldCAkdGVtcGxhdGVzID0geyB9O1xyXG5cclxuICAgICQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQoXCJ0ZW1wbGF0ZVwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSAkdGhpcy5hdHRyKFwiaWRcIik7XHJcbiAgICAgICAgICAgIHZhciBodG1sID0gJHRoaXMuaHRtbCgpO1xyXG5cclxuICAgICAgICAgICAgJHRlbXBsYXRlc1tuYW1lXSA9ICQoaHRtbCk7XHJcbiAgICAgICAgICAgICR0aGlzLnJlbW92ZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgcmVuZGVyID0gKHRlbXBsYXRlLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgaWYgKCEkdGVtcGxhdGVzW3RlbXBsYXRlXSkgeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICB2YXIgJHJlbmRlciA9ICR0ZW1wbGF0ZXNbdGVtcGxhdGVdLmNsb25lKCk7XHJcblxyXG4gICAgICAgICRyZW5kZXIuZGF0YShkYXRhKTtcclxuXHJcbiAgICAgICAgJC5mbi5maWxsQmxhbmtzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJGJsYW5rID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgdmFyIGZpbGwgPSAkYmxhbmsuZGF0YShcImZpbGxcIik7XHJcblxyXG4gICAgICAgICAgICB2YXIgcnVsZXMgPSBmaWxsLnNwbGl0KFwiLFwiKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhaXIgPSBydWxlc1tpXS5zcGxpdChcIjpcIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGVzdCA9IChwYWlyWzFdID8gcGFpclswXS50cmltKCkgOiBcImh0bWxcIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlID0gKHBhaXJbMV0gPyBwYWlyWzFdLnRyaW0oKSA6IHBhaXJbMF0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtzb3VyY2VdO1xyXG5cclxuICAgICAgICAgICAgICAgIHNvdXJjZSA9IHNvdXJjZS5zcGxpdChcIi9cIik7XHJcbiAgICAgICAgICAgICAgICBpZiAoc291cmNlLmxlbmd0aCA+IDEgJiYgdHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkYXRhW3NvdXJjZVswXV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAxOyBqIDwgc291cmNlLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gKHZhbHVlW3NvdXJjZVtqXV0pID8gdmFsdWVbc291cmNlW2pdXSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIgJiYgdmFsdWUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGVzdCA9PT0gXCJjbGFzc1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRibGFuay5hZGRDbGFzcyh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkZXN0ID09PSBcImh0bWxcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsuaHRtbCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkZXN0ID09PSBcInZhbHVlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLnZhbCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLmF0dHIoZGVzdCwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlmX251bGwgPSAkYmxhbmsuZGF0YShcImZpbGwtbnVsbFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaWZfbnVsbCA9PT0gXCJoaWRlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlmX251bGwgPT09IFwicmVtb3ZlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgJGJsYW5rXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoXCJmaWxsXCIpXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlQXR0cihcImRhdGEtZmlsbFwiKVxyXG4gICAgICAgICAgICAgICAgLnJlbW92ZUF0dHIoXCJkYXRhLWZpbGwtbnVsbFwiKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoJHJlbmRlci5oYXNDbGFzcyhcImZpbGxcIikpIHtcclxuICAgICAgICAgICAgJHJlbmRlci5maWxsQmxhbmtzKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkKFwiLmZpbGxcIiwgJHJlbmRlcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQodGhpcykuZmlsbEJsYW5rcygpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gJHJlbmRlcjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlbmRlclxyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmxldCBfX3JlbmRlciA9IHVpLnRlbXBsYXRlLnJlbmRlcjtcclxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBwbGF5ZXIgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbmxldCBxdWV1ZSA9IFtcclxuICAgIHtcclxuICAgICAgICBcInRpdGxlXCI6IFwiQ2FwdGFpbiBDYWx2aW4gKE9yaWdpbmFsIE1peClcIixcclxuICAgICAgICBcImFydGlzdFwiOiBcIkxvdWtcIixcclxuICAgICAgICBcImFsYnVtXCI6IFwiQ2hpbGxob3AgRXNzZW50aWFscyBXaW50ZXIgMjAxOFwiLFxyXG4gICAgICAgIFwibGVuZ3RoXCI6IDE0MCxcclxuICAgICAgICBcImNvdmVyXCI6IFwiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL0pKQUswbVhfcDVLTGY5X2VmU0VyN2wybzJvQUd5Q243YjgtcE9zZnA4X2pmMDJ1dkpVSUoxcER0RFp4MUpzSkFmTTVZT2UyQklFQVwiLFxyXG4gICAgICAgIFwiZmlsZVwiOiBcIi9kYXRhL2ZpbGVzLzE0IENhcHRhaW4gQ2FsdmluIChPcmlnaW5hbCBNaXgpLm1wM1wiXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwidGl0bGVcIjogXCJUaWNvIFRpY29cIixcclxuICAgICAgICBcImFydGlzdFwiOiBcIk9zY2FyIFBldGVyc29uXCIsXHJcbiAgICAgICAgXCJhbGJ1bVwiOiBcIlVsdGltYXRlIEphenogQ29sbGVjdGlvbnNcIixcclxuICAgICAgICBcImxlbmd0aFwiOiAxODAsXHJcbiAgICAgICAgXCJjb3ZlclwiOiBcImh0dHBzOi8vbGg1LmdncGh0LmNvbS9od0VLTUl0S3lGeUhJZ05sMjhDZmJCci1SWUx2TmhEVWpfU0ZlNzU3bV9nSDJ5TnNvUlhZbVhnV0kwMnRrQW9WTEtDTklpaGJcIixcclxuICAgICAgICBcImZpbGVcIjogXCIvZGF0YS9maWxlcy8zMCBUaWNvIFRpY28ubTRhXCJcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJ0aXRsZVwiOiBcIkEgSGF6eSBTaGFkZSBvZiBXaW50ZXJcIixcclxuICAgICAgICBcImFydGlzdFwiOiBcIlNpbW9uICYgR2FyZnVua2VsXCIsXHJcbiAgICAgICAgXCJhbGJ1bVwiOiBcIkJvb2tlbmRzXCIsXHJcbiAgICAgICAgXCJsZW5ndGhcIjogMTM3LFxyXG4gICAgICAgIFwiY292ZXJcIjogXCJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vbWZjblpNcHFZaTJPSXNscjlVNTZQZWNKeXRQMmpRQWo5QmNPZng3bUVrQ0NCVFJJNFZ4cHd6VmU1R3VyX3FTNVhrMWtSbGk1Z1FcIixcclxuICAgICAgICBcImZpbGVcIjogXCIvZGF0YS9maWxlcy8xMSBBIEhhenkgU2hhZGUgb2YgV2ludGVyLm00YVwiXHJcbiAgICB9XHJcbl07XHJcblxyXG5sZXQgJG5wO1xyXG5sZXQgJHBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhdWRpb1wiKTtcclxuXHJcbmFwcC5QbGF5ZXIgPSAoKCkgPT4ge1xyXG4gICAgbGV0IHF1ZXVlX3Bvc2l0aW9uID0gMDtcclxuXHJcbiAgICBsZXQgcmVwZWF0ID0gXCJub25lXCI7XHJcbiAgICBsZXQgcmVwZWF0X29wdGlvbnMgPSBbXCJub25lXCIsIFwiYWxsXCIsIFwib25lXCJdO1xyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gRXZlbnRvc1xyXG5cclxuICAgIC8vIERlZmluZSBvIHRlbXBvIGRlIGR1cmHDp8OjbyBxdWFuZG8gdW1hIG3DunNpY2Egw6kgY2FycmVnYWRhIG3DunNpY2FcclxuICAgICRwbGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRlZG1ldGFkYXRhXCIsICgpID0+IHtcclxuICAgICAgICBsZXQgbGVuZ3RoID0gZHVyYXRpb24oJHBsYXllci5kdXJhdGlvbik7XHJcbiAgICAgICAgJG5wLmxlbmd0aC50ZXh0KGxlbmd0aCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBdHVhbGl6YSBiYXJyYSBkZSB0ZW1wb1xyXG4gICAgJHBsYXllci5hZGRFdmVudExpc3RlbmVyKFwidGltZXVwZGF0ZVwiLCAoKSA9PiB7XHJcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gZHVyYXRpb24oJHBsYXllci5jdXJyZW50VGltZSk7XHJcbiAgICAgICAgJG5wLnBvc2l0aW9uLnRleHQocG9zaXRpb24pO1xyXG5cclxuICAgICAgICBsZXQgcGVyY2VudCA9ICRwbGF5ZXIuY3VycmVudFRpbWUgLyAkcGxheWVyLmR1cmF0aW9uICogMTAwO1xyXG4gICAgICAgICRucC5lbGFwc2VkLmNzcyhcIndpZHRoXCIsIHBlcmNlbnQgKyBcIiVcIik7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBQYXNzYSBwYXJhIHByw7N4aW1hIG3DunNpY2EgcXVhbmRvIGEgYXR1YWwgY2hlZ2EgYW8gZmltXHJcbiAgICAkcGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoXCJlbmRlZFwiLCAoKSA9PiB7XHJcbiAgICAgICAgaWYgKHJlcGVhdCA9PT0gXCJvbmVcIikge1xyXG4gICAgICAgICAgICAkcGxheWVyLmN1cnJlbnRUaW1lID0gMDtcclxuICAgICAgICAgICAgYXBwLlBsYXllci5wbGF5KCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYXBwLlBsYXllci5uZXh0VHJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbiAgICAkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICRucCA9ICQoXCIubm93LXBsYXlpbmdcIik7XHJcbiAgICAgICAgJG5wLnBvc2l0aW9uID0gJChcIi5ub3ctcGxheWluZyAucG9zaXRpb25cIik7XHJcbiAgICAgICAgJG5wLmxlbmd0aCA9ICQoXCIubm93LXBsYXlpbmcgLmxlbmd0aFwiKTtcclxuICAgICAgICAkbnAudGltZWxpbmUgPSAkKFwiLm5vdy1wbGF5aW5nIC5iYXJcIik7XHJcbiAgICAgICAgJG5wLmVsYXBzZWQgPSAkKFwiLm5vdy1wbGF5aW5nIC5lbGFwc2VkXCIpO1xyXG5cclxuICAgICAgICAkbnAuc29uZyA9ICQoXCIubm93LXBsYXlpbmcgLnNvbmdcIik7XHJcbiAgICAgICAgJG5wLmFydGlzdCA9ICQoXCIubm93LXBsYXlpbmcgLmFydGlzdFwiKTtcclxuICAgICAgICAkbnAuYWxidW0gPSAkKFwiLm5vdy1wbGF5aW5nIC5hbGJ1bVwiKTtcclxuICAgICAgICAkbnAuY292ZXIgPSAkKFwiLm5vdy1wbGF5aW5nIC5jb3ZlclwiKTtcclxuXHJcbiAgICAgICAgJHVpW1wibm93LXBsYXlpbmdcIl0gPSAkKFwiLm5vdy1wbGF5aW5nXCIpO1xyXG4gICAgICAgICQoXCIucGxheS1wYXVzZVwiLCAkdWlbXCJub3ctcGxheWluZ1wiXSkub24oXCJjbGlja1wiLCBhcHAuUGxheWVyLnBsYXlQYXVzZSk7XHJcbiAgICAgICAgJChcIi5za2lwLXByZXZpb3VzXCIsICR1aVtcIm5vdy1wbGF5aW5nXCJdKS5vbihcImNsaWNrXCIsIGFwcC5QbGF5ZXIucHJldmlvdXNUcmFjayk7XHJcbiAgICAgICAgJChcIi5za2lwLW5leHRcIiwgJHVpW1wibm93LXBsYXlpbmdcIl0pLm9uKFwiY2xpY2tcIiwgYXBwLlBsYXllci5uZXh0VHJhY2spO1xyXG4gICAgICAgICQoXCIucmVwZWF0XCIsICR1aVtcIm5vdy1wbGF5aW5nXCJdKS5vbihcImNsaWNrXCIsIGFwcC5QbGF5ZXIudG9nZ2xlUmVwZWF0KTtcclxuXHJcbiAgICAgICAgLy8gQ2xpcXVlcyBuYSBsaW5oYSBkbyB0ZW1wb1xyXG4gICAgICAgICRucC50aW1lbGluZS5vbihcImNsaWNrXCIsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgd2lkdGggPSAkKGV2ZW50LmRlbGVnYXRlVGFyZ2V0KS53aWR0aCgpO1xyXG4gICAgICAgICAgICBsZXQgcG9zaXRpb24gPSBldmVudC5vZmZzZXRYO1xyXG4gICAgICAgICAgICBsZXQgcGVyY2VudCA9IHBvc2l0aW9uIC8gd2lkdGg7XHJcblxyXG4gICAgICAgICAgICBsZXQgcG9zaXRpb25faW5fc2Vjb25kcyA9ICRwbGF5ZXIuZHVyYXRpb24gKiBwZXJjZW50O1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLnNraXBUb1Bvc2l0aW9uKHBvc2l0aW9uX2luX3NlY29uZHMpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBDYXJyZWdhIGEgcHJpbWVpcmEgbcO6c2ljYSBkYSBmaWxhXHJcbiAgICAgICAgYXBwLlBsYXllci5sb2FkKHF1ZXVlW3F1ZXVlX3Bvc2l0aW9uXSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBjb25zdCB1cGRhdGVUaW1lbGluZVxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLlBsYXllci5za2lwVG9Qb3NpdGlvbigpXHJcbiAgICBjb25zdCBsb2FkID0gKHNvbmcpID0+IHtcclxuICAgICAgICAvLyBQYXVzYSBhIHJlcHJvZHXDp8OjbywgcmVzZXRhIG8gdGVtcG8gZSBjYXJyZWdhIGEgbm92YSBtw7pzaWNhXHJcbiAgICAgICAgYXBwLlBsYXllci5wYXVzZSgpO1xyXG4gICAgICAgICRwbGF5ZXIuY3VycmVudFRpbWUgPSAwO1xyXG4gICAgICAgICRwbGF5ZXIuc3JjID0gc29uZ1tcImZpbGVcIl07XHJcblxyXG4gICAgICAgIC8vIEF0dWFsaXphIGFzIGluZm9ybWHDp8O1ZXMgc29icmUgYSBtw7pzaWNhIGVtIHJlcHJvZHXDp8Ojb1xyXG4gICAgICAgICRucC5zb25nLnRleHQoc29uZ1tcInRpdGxlXCJdKTtcclxuICAgICAgICAkbnAuYXJ0aXN0LnRleHQoc29uZ1tcImFydGlzdFwiXSk7XHJcbiAgICAgICAgJG5wLmFsYnVtLnRleHQoc29uZ1tcImFsYnVtXCJdKTtcclxuICAgICAgICAkbnAuY292ZXIuY3NzKFwiYmFja2dyb3VuZC1pbWFnZVwiLCBcInVybCgnXCIgKyBzb25nW1wiY292ZXJcIl0gKyBcIicpXCIpO1xyXG5cclxuICAgICAgICAvLyBBdHVhbGl6YSBkYWRvcyBkYSBNZWRpYSBTZXNzaW9uIEFQSVxyXG4gICAgICAgIGlmIChcIm1lZGlhU2Vzc2lvblwiIGluIG5hdmlnYXRvcikge1xyXG4gICAgICAgICAgICBuYXZpZ2F0b3IubWVkaWFTZXNzaW9uLm1ldGFkYXRhID0gbmV3IE1lZGlhTWV0YWRhdGEoe1xyXG4gICAgICAgICAgICAgICAgXCJ0aXRsZVwiOiBzb25nW1widGl0bGVcIl0sXHJcbiAgICAgICAgICAgICAgICBcImFydGlzdFwiOiBzb25nW1wiYXJ0aXN0XCJdLFxyXG4gICAgICAgICAgICAgICAgXCJhbGJ1bVwiOiBzb25nW1wiYWxidW1cIl0sXHJcbiAgICAgICAgICAgICAgICBcImFydHdvcmtcIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzcmNcIjogc29uZ1tcImNvdmVyXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInNpemVzXCI6IFwiNTEyeDUxMlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJpbWFnZS9wbmdcIlxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJbmljaWEgYSByZXByb2R1w6fDo29cclxuICAgICAgICBhcHAuUGxheWVyLnBsYXkoKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLlBsYXllci5za2lwVG9Qb3NpdGlvbigpXHJcbiAgICBjb25zdCBza2lwVG9Qb3NpdGlvbiA9IChzZWNvbmRzKSA9PiB7XHJcbiAgICAgICAgJHBsYXllci5jdXJyZW50VGltZSA9IHNlY29uZHM7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIGFwcC5QbGF5ZXIucGxheSgpXHJcbiAgICBjb25zdCBwbGF5ID0gKCkgPT4ge1xyXG4gICAgICAgICRwbGF5ZXIucGxheSgpO1xyXG4gICAgICAgICRucC5yZW1vdmVDbGFzcyhcIi1zdGF0ZS0tcGF1c2VkXCIpLmFkZENsYXNzKFwiLXN0YXRlLS1wbGF5aW5nXCIpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuUGxheWVyLnBhdXNlKClcclxuICAgIGNvbnN0IHBhdXNlID0gKCkgPT4ge1xyXG4gICAgICAgICRwbGF5ZXIucGF1c2UoKTtcclxuICAgICAgICAkbnAucmVtb3ZlQ2xhc3MoXCItc3RhdGUtLXBsYXlpbmdcIikuYWRkQ2xhc3MoXCItc3RhdGUtLXBhdXNlZFwiKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLlBsYXllci5wbGF5UGF1c2UoKVxyXG4gICAgY29uc3QgcGxheVBhdXNlID0gKCkgPT4ge1xyXG4gICAgICAgIGlmICgkcGxheWVyLnBhdXNlZCkge1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLnBsYXkoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLnBhdXNlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImR1cmF0aW9uXCIsICRwbGF5ZXIuZHVyYXRpb24pO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwidm9sdW1lXCIsICRwbGF5ZXIudm9sdW1lKTtcclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJidWZmZXJlZFwiLCAkcGxheWVyLmJ1ZmZlcmVkKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIm5ldHdvcmtTdGF0ZVwiLCAkcGxheWVyLm5ldHdvcmtTdGF0ZSk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJwbGF5ZWRcIiwgJHBsYXllci5wbGF5ZWQpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwicmVhZHlTdGF0ZVwiLCAkcGxheWVyLnJlYWR5U3RhdGUpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwic2Vla2FibGVcIiwgJHBsYXllci5zZWVrYWJsZSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIGFwcC5QbGF5ZXIucHJldmlvdXNUcmFjaygpXHJcbiAgICBjb25zdCBwcmV2aW91c1RyYWNrID0gKCkgPT4ge1xyXG4gICAgICAgIC8vIFNlIHRpdmVyIGFww7NzIG9zIDUgc2VndW5kb3MgZGEgbcO6c2ljYSBhdHVhbCwgdm9sdGEgcGFyYSBvIGNvbWXDp29cclxuICAgICAgICBpZiAoJHBsYXllci5jdXJyZW50VGltZSA+IDUpIHtcclxuICAgICAgICAgICAgJHBsYXllci5jdXJyZW50VGltZSA9IDA7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcXVldWVfcG9zaXRpb24gPSAocXVldWVfcG9zaXRpb24gLSAxICsgcXVldWUubGVuZ3RoKSAlIHF1ZXVlLmxlbmd0aDtcclxuICAgICAgICAgICAgYXBwLlBsYXllci5sb2FkKHF1ZXVlW3F1ZXVlX3Bvc2l0aW9uXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuUGxheWVyLm5leHRUcmFjaygpXHJcbiAgICBjb25zdCBuZXh0VHJhY2sgPSAoKSA9PiB7XHJcbiAgICAgICAgaWYgKHF1ZXVlX3Bvc2l0aW9uICsgMSA8IHF1ZXVlLmxlbmd0aCB8fCByZXBlYXQgPT09IFwiYWxsXCIpIHtcclxuICAgICAgICAgICAgcXVldWVfcG9zaXRpb24gPSAocXVldWVfcG9zaXRpb24gKyAxKSAlIHF1ZXVlLmxlbmd0aDtcclxuICAgICAgICAgICAgYXBwLlBsYXllci5sb2FkKHF1ZXVlW3F1ZXVlX3Bvc2l0aW9uXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuUGxheWVyLnRvZ2dsZVJlcGVhdCgpXHJcbiAgICBjb25zdCB0b2dnbGVSZXBlYXQgPSAoKSA9PiB7XHJcbiAgICAgICAgbGV0IGN1cnJlbnRfdmFsdWUgPSByZXBlYXQ7XHJcbiAgICAgICAgbGV0IG5ld192YWx1ZSA9IHJlcGVhdF9vcHRpb25zW3JlcGVhdF9vcHRpb25zLmluZGV4T2YoY3VycmVudF92YWx1ZSkgKyAxXTtcclxuXHJcbiAgICAgICAgcmVwZWF0ID0gbmV3X3ZhbHVlO1xyXG5cclxuICAgICAgICAkKFwiLnJlcGVhdFwiLCAkdWlbXCJub3ctcGxheWluZ1wiXSlcclxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwiLW9wdGlvbi0tXCIgKyBjdXJyZW50X3ZhbHVlKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoXCItb3B0aW9uLS1cIiArIG5ld192YWx1ZSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGxvYWQsXHJcbiAgICAgICAgc2tpcFRvUG9zaXRpb24sXHJcbiAgICAgICAgcGxheSxcclxuICAgICAgICBwYXVzZSxcclxuICAgICAgICBwbGF5UGF1c2UsXHJcbiAgICAgICAgcHJldmlvdXNUcmFjayxcclxuICAgICAgICBuZXh0VHJhY2ssXHJcbiAgICAgICAgdG9nZ2xlUmVwZWF0XHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuaWYgKFwibWVkaWFTZXNzaW9uXCIgaW4gbmF2aWdhdG9yKSB7XHJcbiAgICBuYXZpZ2F0b3IubWVkaWFTZXNzaW9uLnNldEFjdGlvbkhhbmRsZXIoXCJwbGF5XCIsIGFwcC5QbGF5ZXIucGxheSk7XHJcbiAgICBuYXZpZ2F0b3IubWVkaWFTZXNzaW9uLnNldEFjdGlvbkhhbmRsZXIoXCJwYXVzZVwiLCBhcHAuUGxheWVyLnBhdXNlKTtcclxuICAgIC8vIG5hdmlnYXRvci5tZWRpYVNlc3Npb24uc2V0QWN0aW9uSGFuZGxlcihcInNlZWtiYWNrd2FyZFwiLCBmdW5jdGlvbiAoKSB7IH0pO1xyXG4gICAgLy8gbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5zZXRBY3Rpb25IYW5kbGVyKFwic2Vla2ZvcndhcmRcIiwgZnVuY3Rpb24gKCkgeyB9KTtcclxuICAgIG5hdmlnYXRvci5tZWRpYVNlc3Npb24uc2V0QWN0aW9uSGFuZGxlcihcInByZXZpb3VzdHJhY2tcIiwgYXBwLlBsYXllci5wcmV2aW91c1RyYWNrKTtcclxuICAgIG5hdmlnYXRvci5tZWRpYVNlc3Npb24uc2V0QWN0aW9uSGFuZGxlcihcIm5leHR0cmFja1wiLCBhcHAuUGxheWVyLm5leHRUcmFjayk7XHJcbn1cclxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBhcnRpc3QgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbmFwcC5BcnRpc3QgPSAoKCkgPT4ge1xyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLkFydGlzdC5sb2FkKClcclxuICAgIGNvbnN0IGxvYWQgPSAoYXJ0aXN0X2lkKSA9PiB7XHJcbiAgICAgICAgJC5nZXQoXCJkYXRhL2FydGlzdHMvXCIgKyBhcnRpc3RfaWQgKyBcIi5qc29uXCIpLmRvbmUoKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBhcnRpc3QgPSByZXNwb25zZTtcclxuICAgICAgICAgICAgbGV0ICRhcnRpc3QgPSBfX3JlbmRlcihcImFydGlzdFwiLCBhcnRpc3QpO1xyXG5cclxuICAgICAgICAgICAgLy8gw4FsYnVuc1xyXG4gICAgICAgICAgICBsZXQgYWxidW1zID0gYXJ0aXN0W1wiYWxidW1zXCJdO1xyXG4gICAgICAgICAgICBsZXQgJGFsYnVtcyA9ICQoXCIuYWxidW1zXCIsICRhcnRpc3QpO1xyXG5cclxuICAgICAgICAgICAgYWxidW1zLmZvckVhY2goKGFsYnVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBhbGJ1bVtcImNvdmVyLWFydFwiXSA9IFwiYmFja2dyb3VuZC1pbWFnZTogdXJsKCdcIiArIGFsYnVtW1wiY292ZXJcIl0gKyBcIicpXCI7XHJcbiAgICAgICAgICAgICAgICBsZXQgJGFsYnVtID0gX19yZW5kZXIoXCJhcnRpc3QtYWxidW1cIiwgYWxidW0pLmFwcGVuZFRvKCRhbGJ1bXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIEhpdHNcclxuICAgICAgICAgICAgbGV0IGhpdHMgPSBhcnRpc3RbXCJoaXRzXCJdO1xyXG4gICAgICAgICAgICBsZXQgJGhpdHMgPSAkKFwiLmhpdHNcIiwgJGFydGlzdCk7XHJcblxyXG4gICAgICAgICAgICBoaXRzLmZvckVhY2goKGhpdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaGl0W1wiZm9ybWF0dGVkLWxlbmd0aFwiXSA9IGR1cmF0aW9uKGhpdFtcImxlbmd0aFwiXSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgJGhpdCA9IF9fcmVuZGVyKFwiYXJ0aXN0LWhpdFwiLCBoaXQpLmFwcGVuZFRvKCRoaXRzKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBDb2xvY2EgbmEgdGVsYVxyXG4gICAgICAgICAgICAkdWlbXCJsaWJyYXJ5XCJdLmVtcHR5KCkuYXBwZW5kKCRhcnRpc3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBsb2FkXHJcbiAgICB9O1xyXG59KSgpO1xyXG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIHVwbG9hZCAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuY29uc3Qgc3RvcmFnZSA9IGZpcmViYXNlLnN0b3JhZ2UoKS5yZWYoKTtcclxuLy8gY29uc3QgbXVzaWNTdG9yYWdlID0gc3RvcmFnZS5jaGlsZChcInNvbmdzXCIpO1xyXG5cclxuY29uc3QgJHVwbG9hZCA9ICQoXCIudXBsb2FkXCIpO1xyXG5jb25zdCBkcm9wem9uZSA9IG5ldyBEcm9wem9uZShcIi51cGxvYWRcIiwgeyB1cmw6IFwiL3VwbG9hZFwiIH0pO1xyXG5cclxuLy8gTW9zdHJhL2VzY29uZGUgZHJvcHpvbmUgYW8gZW50cmFyIGNvbSBhcnF1aXZvIG5hIHDDoWdpbmFcclxuJCh3aW5kb3cpLm9uKFwiZHJhZ2VudGVyXCIsIChldmVudCkgPT4ge1xyXG5cdCR1cGxvYWQuYWRkQ2xhc3MoXCItc3RhdGUtLWFjdGl2ZVwiKTtcclxufSk7XHJcblxyXG4kKHdpbmRvdykub24oXCJkcmFnbGVhdmVcIiwgKGV2ZW50KSA9PiB7XHJcblx0aWYgKCQoZXZlbnQudGFyZ2V0KS5oYXNDbGFzcyhcInVwbG9hZFwiKSkge1xyXG5cdFx0JHVwbG9hZC5yZW1vdmVDbGFzcyhcIi1zdGF0ZS0tYWN0aXZlXCIpO1xyXG5cdH1cclxufSk7XHJcblxyXG4vLyBBcnF1aXZvIGFkaWNpb25hZG9cclxuZHJvcHpvbmUub24oXCJhZGRlZGZpbGVcIiwgKGZpbGUpID0+IHtcclxuXHRjb25zb2xlLmxvZyhmaWxlKTtcclxuXHRjb25zdCB1cGxvYWRUYXNrID0gc3RvcmFnZS5jaGlsZChgc29uZ3MvJHt1c2VyLnVpZH0vJHtmaWxlLm5hbWV9YCkucHV0KGZpbGUpO1xyXG5cclxuXHR1cGxvYWRUYXNrLm9uKFwic3RhdGVfY2hhbmdlZFwiLFxyXG5cdFx0KHNuYXBzaG90KSA9PiB7XHJcblx0XHRcdGNvbnN0IHByb2dyZXNzID0gKHNuYXBzaG90LmJ5dGVzVHJhbnNmZXJyZWQgLyBzbmFwc2hvdC50b3RhbEJ5dGVzKSAqIDEwMDtcclxuXHRcdFx0Y29uc29sZS5sb2coXCJVcGxvYWQgaXMgXCIgKyBwcm9ncmVzcyArIFwiJSBkb25lXCIpO1xyXG5cclxuXHRcdFx0Ly8gc3dpdGNoIChzbmFwc2hvdC5zdGF0ZSkge1xyXG5cdFx0XHQvLyBcdGNhc2UgXCJwYXVzZWRcIjpcclxuXHRcdFx0Ly8gXHRcdGNvbnNvbGUubG9nKFwiVXBsb2FkIGlzIHBhdXNlZFwiKTtcclxuXHRcdFx0Ly8gXHRcdGJyZWFrO1xyXG5cdFx0XHQvLyBcdGNhc2UgXCJydW5uaW5nXCI6XHJcblx0XHRcdC8vIFx0XHRjb25zb2xlLmxvZyhcIlVwbG9hZCBpcyBydW5uaW5nXCIpO1xyXG5cdFx0XHQvLyBcdFx0YnJlYWs7XHJcblx0XHRcdC8vIH1cclxuXHRcdH0sIChlcnJvcikgPT4ge1xyXG5cdFx0XHRjb25zb2xlLmxvZyhlcnJvcik7XHJcblx0XHR9LCAoKSA9PiB7XHJcblx0XHR1cGxvYWRUYXNrLnNuYXBzaG90LnJlZi5nZXREb3dubG9hZFVSTCgpLnRoZW4oKGRvd25sb2FkVVJMKSA9PiB7XHJcblx0XHRcdGNvbnNvbGUubG9nKFwiRmlsZSBhdmFpbGFibGUgYXRcIiwgZG93bmxvYWRVUkwpO1xyXG5cdFx0fSk7XHJcblx0fSk7XHJcblxyXG5cdGpzbWVkaWF0YWdzLnJlYWQoZmlsZSwge1xyXG5cdFx0b25TdWNjZXNzOiBmdW5jdGlvbiAodGFnKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKHRhZyk7XHJcblx0XHR9LFxyXG5cdFx0b25FcnJvcjogZnVuY3Rpb24gKGVycm9yKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKGVycm9yKTtcclxuXHRcdH1cclxuXHR9KTtcclxufSk7XHJcbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gY29tbWFuZHMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG5sZXQgY29tbWFuZHMgPSBbXHJcbiAgICB7XHJcbiAgICAgICAgXCJ0aXRsZVwiOiBcIlBsYXkvUGF1c2VcIixcclxuICAgICAgICBcInNob3J0Y3V0XCI6IFtcImtcIiwgXCJzcGFjZVwiXSxcclxuICAgICAgICBcImZ1bmN0aW9uXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgYXBwLlBsYXllci5wbGF5UGF1c2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwidGl0bGVcIjogXCJNw7pzaWNhIGFudGVyaW9yXCIsXHJcbiAgICAgICAgXCJzaG9ydGN1dFwiOiBbXCIsXCJdLFxyXG4gICAgICAgIFwiZnVuY3Rpb25cIjogKCkgPT4ge1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLnByZXZpb3VzVHJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwidGl0bGVcIjogXCJQcsOzeGltYSBtw7pzaWNhXCIsXHJcbiAgICAgICAgXCJzaG9ydGN1dFwiOiBbXCIuXCJdLFxyXG4gICAgICAgIFwiZnVuY3Rpb25cIjogKCkgPT4ge1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLm5leHRUcmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXTtcclxuXHJcbmNvbW1hbmRzLmZvckVhY2goKGNvbW1hbmQpID0+IHtcclxuICAgIGNvbW1hbmRbXCJzaG9ydGN1dFwiXS5mb3JFYWNoKChzaG9ydGN1dCkgPT4ge1xyXG4gICAgICAgIE1vdXNldHJhcC5iaW5kKHNob3J0Y3V0LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbW1hbmRbXCJmdW5jdGlvblwiXSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG4vLyAtIEo6IHZvbHRhIDEwIHNlZ3VuZG9zXHJcbi8vIC0gTDogYXZhbsOnYSAxMCBzZWd1bmRvc1xyXG4vLyAtIFI6IHJlcGVhdFxyXG4vLyAtIFM6IHNodWZmbGVcclxuLy8gLSBNOiBtdWRvXHJcblxyXG4vLyAjIE5hdmVnYcOnw6NvXHJcbi8vIC0gZyBmOiBmYXZvcml0b3NcclxuLy8gLSBnIGw6IGJpYmxpb3RlY2FcclxuLy8gLSBnIHA6IHBsYXlsaXN0c1xyXG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIHN0YXJ0IC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuJChmdW5jdGlvbigpIHtcclxuICAgIGFwcC5BcnRpc3QubG9hZChcInRoZS1iZWF0bGVzXCIpO1xyXG59KTtcclxuIl19
