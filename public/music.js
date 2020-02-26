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
firebase.initializeApp(firebaseConfig);
var storage = firebase.storage().ref();
var db = firebase.firestore(); // Authentication

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
  // Define o tempo de duração quando uma música é carregada

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

    app.Player.load(queue[queue_position], false);
  }); // const updateTimeline
  ////////////////////////////////////////////////////////////////////////////////////////////////
  // app.Player.skipToPosition()

  var load = function load(song) {
    var autoplay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
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


    if (autoplay) {
      app.Player.play();
    }
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
// const musicStorage = storage.child("songs");


var $upload = $(".upload");
var dropzone = new Dropzone(".upload", {
  url: "/upload",
  acceptedFiles: "audio/*"
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
  jsmediatags.read(file, {
    onSuccess: function onSuccess(tags) {
      console.log(tags); // return false;

      var fileInfo = structureTagsFromFile(tags);
      var fileRef = "songs/".concat(user.uid, "/").concat(file.name);
      fileInfo["fileRef"] = fileRef;
      var uploadTask = storage.child(fileRef).put(file);
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
        // Quando terminar o upload, insere a música no banco
        db.collection("users/".concat(user.uid, "/songs")).add(fileInfo);
        uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
          console.log("File available at", downloadURL);
        });
      });
    },
    onError: function onError(error) {
      console.log(error);
    }
  });
});

var structureTagsFromFile = function structureTagsFromFile(file) {
  var tags = file.tags;
  var data = {
    "title": tags.title,
    "sortTitle": null,
    "artist": tags.artist,
    "sortArtist": null,
    "albumTitle": tags.album,
    "sortalbumTitle": null,
    "albumTrackNumber": tags.track ? tags.track.split("/")[0] : null,
    "albumTrackCount": null,
    "albumArtist": null,
    "releaseDate": tags.year,
    "releaseYear": moment(tags.year, [moment.defaultFormatUtc, moment.defaultFormat, "YYYY"]).year(),
    "fileType": null
  };

  if (file.type === "MP4") {
    data["sortTitle"] = tags.sonm ? tags.sonm.data : tags.title;
    data["sortArtist"] = tags.soar ? tags.soar.data : tags.artist;
    data["sortAlbumTitle"] = tags.soal ? tags.soal.data : tags.album;
    data["albumTrackCount"] = tags.trkn && tags.trkn.data ? tags.trkn.data.total : null;
    data["albumArtist"] = tags.aART ? tags.aART.data : null;
    data["fileType"] = file.ftyp.trim().toLowerCase();
  } else if (file.type === "ID3") {
    data["sortTitle"] = tags.sonm ? tags.sonm.data : tags.title;
    data["fileType"] = "mp3";
  }

  return data;
}; ////////////////////////////////////////////////////////////////////////////////////////////////////
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhc2UuanMiLCJ0ZW1wbGF0ZS1lbmdpbmUuanMiLCJwbGF5ZXIuanMiLCJhcnRpc3QuanMiLCJ1cGxvYWQuanMiLCJjb21tYW5kcy5qcyIsInN0YXJ0LmpzIl0sIm5hbWVzIjpbImZpcmViYXNlQ29uZmlnIiwiZmlyZWJhc2UiLCJpbml0aWFsaXplQXBwIiwic3RvcmFnZSIsInJlZiIsImRiIiwiZmlyZXN0b3JlIiwidXNlciIsImF1dGgiLCJvbkF1dGhTdGF0ZUNoYW5nZWQiLCJyZXNwb25zZSIsIndpbmRvdyIsImxvY2F0aW9uIiwiYXBwIiwidWkiLCIkdWkiLCJjdWUiLCIkIiwiZHVyYXRpb24iLCJzZWNvbmRzIiwibW9tZW50IiwidXRjIiwiYXNNaWxsaXNlY29uZHMiLCJmb3JtYXQiLCJ0ZW1wbGF0ZSIsIiR0ZW1wbGF0ZXMiLCJlYWNoIiwiJHRoaXMiLCJuYW1lIiwiYXR0ciIsImh0bWwiLCJyZW1vdmUiLCJyZW5kZXIiLCJkYXRhIiwiJHJlbmRlciIsImNsb25lIiwiZm4iLCJmaWxsQmxhbmtzIiwiJGJsYW5rIiwiZmlsbCIsInJ1bGVzIiwic3BsaXQiLCJpIiwibGVuZ3RoIiwicGFpciIsImRlc3QiLCJ0cmltIiwic291cmNlIiwidmFsdWUiLCJqIiwiYWRkQ2xhc3MiLCJ2YWwiLCJpZl9udWxsIiwiaGlkZSIsInJlbW92ZUNsYXNzIiwicmVtb3ZlQXR0ciIsImhhc0NsYXNzIiwiX19yZW5kZXIiLCJxdWV1ZSIsIiRucCIsIiRwbGF5ZXIiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJQbGF5ZXIiLCJxdWV1ZV9wb3NpdGlvbiIsInJlcGVhdCIsInJlcGVhdF9vcHRpb25zIiwiYWRkRXZlbnRMaXN0ZW5lciIsInRleHQiLCJwb3NpdGlvbiIsImN1cnJlbnRUaW1lIiwicGVyY2VudCIsImVsYXBzZWQiLCJjc3MiLCJwbGF5IiwibmV4dFRyYWNrIiwidGltZWxpbmUiLCJzb25nIiwiYXJ0aXN0IiwiYWxidW0iLCJjb3ZlciIsIm9uIiwicGxheVBhdXNlIiwicHJldmlvdXNUcmFjayIsInRvZ2dsZVJlcGVhdCIsImV2ZW50Iiwid2lkdGgiLCJkZWxlZ2F0ZVRhcmdldCIsIm9mZnNldFgiLCJwb3NpdGlvbl9pbl9zZWNvbmRzIiwic2tpcFRvUG9zaXRpb24iLCJsb2FkIiwiYXV0b3BsYXkiLCJwYXVzZSIsInNyYyIsIm5hdmlnYXRvciIsIm1lZGlhU2Vzc2lvbiIsIm1ldGFkYXRhIiwiTWVkaWFNZXRhZGF0YSIsInBhdXNlZCIsImN1cnJlbnRfdmFsdWUiLCJuZXdfdmFsdWUiLCJpbmRleE9mIiwic2V0QWN0aW9uSGFuZGxlciIsIkFydGlzdCIsImFydGlzdF9pZCIsImdldCIsImRvbmUiLCIkYXJ0aXN0IiwiYWxidW1zIiwiJGFsYnVtcyIsImZvckVhY2giLCIkYWxidW0iLCJhcHBlbmRUbyIsImhpdHMiLCIkaGl0cyIsImhpdCIsIiRoaXQiLCJlbXB0eSIsImFwcGVuZCIsIiR1cGxvYWQiLCJkcm9wem9uZSIsIkRyb3B6b25lIiwidXJsIiwiYWNjZXB0ZWRGaWxlcyIsInRhcmdldCIsImZpbGUiLCJjb25zb2xlIiwibG9nIiwianNtZWRpYXRhZ3MiLCJyZWFkIiwib25TdWNjZXNzIiwidGFncyIsImZpbGVJbmZvIiwic3RydWN0dXJlVGFnc0Zyb21GaWxlIiwiZmlsZVJlZiIsInVpZCIsInVwbG9hZFRhc2siLCJjaGlsZCIsInB1dCIsInNuYXBzaG90IiwicHJvZ3Jlc3MiLCJieXRlc1RyYW5zZmVycmVkIiwidG90YWxCeXRlcyIsImVycm9yIiwiY29sbGVjdGlvbiIsImFkZCIsImdldERvd25sb2FkVVJMIiwidGhlbiIsImRvd25sb2FkVVJMIiwib25FcnJvciIsInRpdGxlIiwidHJhY2siLCJ5ZWFyIiwiZGVmYXVsdEZvcm1hdFV0YyIsImRlZmF1bHRGb3JtYXQiLCJ0eXBlIiwic29ubSIsInNvYXIiLCJzb2FsIiwidHJrbiIsInRvdGFsIiwiYUFSVCIsImZ0eXAiLCJ0b0xvd2VyQ2FzZSIsImNvbW1hbmRzIiwiY29tbWFuZCIsInNob3J0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Q0FBLEVBQUFBLE9BQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQXZELE9BQUEsQ0FBQSxVQUFBd0QsUUFBQSxFQUFBO0FBQ0FDLElBQUFBLFNBQUEsQ0FBQUMsSUFBQSxDQUFBRixRQUFBLEVBQUEsWUFBQTtBQUNBRCxNQUFBQSxPQUFBLENBQUEsVUFBQSxDQUFBO0FBQ0EsYUFBQSxLQUFBO0FBQ0EsS0FIQTtBQUlBLEdBTEE7QUFNQSxDQVBBLEUsQ0FTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUM5Q0E7QUFDQTtBQUNBOztBQUVBckosQ0FBQSxDQUFBLFlBQUE7QUFDQUosRUFBQUEsR0FBQSxDQUFBMkYsTUFBQSxDQUFBYixJQUFBLENBQUEsYUFBQTtBQUNBLENBRkEsQ0FBQSIsImZpbGUiOiJtdXNpYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gYmFzZSAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4vLyBGaXJlYmFzZVxyXG5jb25zdCBmaXJlYmFzZUNvbmZpZyA9IHtcclxuICAgIFwiYXBpS2V5XCI6IFwiQUl6YVN5QVV2QVlRbjNZZHYxUXpsY1g0TklmazVZQmIzS0prYWI0XCIsXHJcbiAgICBcImF1dGhEb21haW5cIjogXCJwbGF5ZXItZTk4NWEuZmlyZWJhc2VhcHAuY29tXCIsXHJcbiAgICBcImRhdGFiYXNlVVJMXCI6IFwiaHR0cHM6Ly9wbGF5ZXItZTk4NWEuZmlyZWJhc2Vpby5jb21cIixcclxuICAgIFwicHJvamVjdElkXCI6IFwicGxheWVyLWU5ODVhXCIsXHJcbiAgICBcInN0b3JhZ2VCdWNrZXRcIjogXCJwbGF5ZXItZTk4NWEuYXBwc3BvdC5jb21cIixcclxuICAgIFwibWVzc2FnaW5nU2VuZGVySWRcIjogXCI3MDgwNjg5NzE5NVwiLFxyXG4gICAgXCJhcHBJZFwiOiBcIjE6NzA4MDY4OTcxOTU6d2ViOmE3OWRiY2MxYWZmYTI5YzQ1ODIwNmVcIlxyXG59O1xyXG5cclxuZmlyZWJhc2UuaW5pdGlhbGl6ZUFwcChmaXJlYmFzZUNvbmZpZyk7XHJcblxyXG5jb25zdCBzdG9yYWdlID0gZmlyZWJhc2Uuc3RvcmFnZSgpLnJlZigpO1xyXG5jb25zdCBkYiA9IGZpcmViYXNlLmZpcmVzdG9yZSgpO1xyXG5cclxuLy8gQXV0aGVudGljYXRpb25cclxubGV0IHVzZXI7XHJcblxyXG5maXJlYmFzZS5hdXRoKCkub25BdXRoU3RhdGVDaGFuZ2VkKChyZXNwb25zZSkgPT4ge1xyXG4gICAgdXNlciA9IHJlc3BvbnNlO1xyXG4gICAgaWYgKCF1c2VyKSB3aW5kb3cubG9jYXRpb24gPSBcIi9cIjtcclxufSk7XHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG5sZXQgYXBwID0geyB9O1xyXG5cclxubGV0IHVpID0geyB9O1xyXG5sZXQgJHVpID0geyB9O1xyXG5cclxubGV0IGN1ZSA9IHsgfTtcclxuXHJcblxyXG5cclxuXHJcbi8vIFRPRE86IG1vdmVyIHBhcmEgbHVnYXIgYXByb3ByaWFkb1xyXG4kKGZ1bmN0aW9uKCkge1xyXG4gICAgJHVpW1wibGlicmFyeVwiXSA9ICQoXCIubGlicmFyeVwiKTtcclxufSk7XHJcblxyXG5jb25zdCBkdXJhdGlvbiA9IChzZWNvbmRzKSA9PiB7XHJcbiAgICByZXR1cm4gbW9tZW50LnV0Yyhtb21lbnQuZHVyYXRpb24oc2Vjb25kcywgXCJzZWNvbmRzXCIpLmFzTWlsbGlzZWNvbmRzKCkpLmZvcm1hdChcIm06c3NcIik7XHJcbn07XHJcbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gY29yZSAvIHRlbXBsYXRlIGVuZ2luZSAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG51aS50ZW1wbGF0ZSA9ICgoKSA9PiB7XHJcbiAgICBsZXQgJHRlbXBsYXRlcyA9IHsgfTtcclxuXHJcbiAgICAkKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkKFwidGVtcGxhdGVcIikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIHZhciBuYW1lID0gJHRoaXMuYXR0cihcImlkXCIpO1xyXG4gICAgICAgICAgICB2YXIgaHRtbCA9ICR0aGlzLmh0bWwoKTtcclxuXHJcbiAgICAgICAgICAgICR0ZW1wbGF0ZXNbbmFtZV0gPSAkKGh0bWwpO1xyXG4gICAgICAgICAgICAkdGhpcy5yZW1vdmUoKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHJlbmRlciA9ICh0ZW1wbGF0ZSwgZGF0YSkgPT4ge1xyXG4gICAgICAgIGlmICghJHRlbXBsYXRlc1t0ZW1wbGF0ZV0pIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgdmFyICRyZW5kZXIgPSAkdGVtcGxhdGVzW3RlbXBsYXRlXS5jbG9uZSgpO1xyXG5cclxuICAgICAgICAkcmVuZGVyLmRhdGEoZGF0YSk7XHJcblxyXG4gICAgICAgICQuZm4uZmlsbEJsYW5rcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICRibGFuayA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIHZhciBmaWxsID0gJGJsYW5rLmRhdGEoXCJmaWxsXCIpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHJ1bGVzID0gZmlsbC5zcGxpdChcIixcIik7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcnVsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBwYWlyID0gcnVsZXNbaV0uc3BsaXQoXCI6XCIpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGRlc3QgPSAocGFpclsxXSA/IHBhaXJbMF0udHJpbSgpIDogXCJodG1sXCIpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZSA9IChwYWlyWzFdID8gcGFpclsxXS50cmltKCkgOiBwYWlyWzBdKTtcclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbc291cmNlXTtcclxuXHJcbiAgICAgICAgICAgICAgICBzb3VyY2UgPSBzb3VyY2Uuc3BsaXQoXCIvXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5sZW5ndGggPiAxICYmIHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZGF0YVtzb3VyY2VbMF1dO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMTsgaiA8IHNvdXJjZS5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9ICh2YWx1ZVtzb3VyY2Vbal1dKSA/IHZhbHVlW3NvdXJjZVtqXV0gOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiICYmIHZhbHVlICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlc3QgPT09IFwiY2xhc3NcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsuYWRkQ2xhc3ModmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVzdCA9PT0gXCJodG1sXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLmh0bWwodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVzdCA9PT0gXCJ2YWx1ZVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRibGFuay52YWwodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRibGFuay5hdHRyKGRlc3QsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpZl9udWxsID0gJGJsYW5rLmRhdGEoXCJmaWxsLW51bGxcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlmX251bGwgPT09IFwiaGlkZVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRibGFuay5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpZl9udWxsID09PSBcInJlbW92ZVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRibGFuay5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICRibGFua1xyXG4gICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwiZmlsbFwiKVxyXG4gICAgICAgICAgICAgICAgLnJlbW92ZUF0dHIoXCJkYXRhLWZpbGxcIilcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVBdHRyKFwiZGF0YS1maWxsLW51bGxcIik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCRyZW5kZXIuaGFzQ2xhc3MoXCJmaWxsXCIpKSB7XHJcbiAgICAgICAgICAgICRyZW5kZXIuZmlsbEJsYW5rcygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJChcIi5maWxsXCIsICRyZW5kZXIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkKHRoaXMpLmZpbGxCbGFua3MoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuICRyZW5kZXI7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZW5kZXJcclxuICAgIH07XHJcbn0pKCk7XHJcblxyXG5sZXQgX19yZW5kZXIgPSB1aS50ZW1wbGF0ZS5yZW5kZXI7XHJcbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gcGxheWVyIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG5sZXQgcXVldWUgPSBbXHJcbiAgICB7XHJcbiAgICAgICAgXCJ0aXRsZVwiOiBcIkNhcHRhaW4gQ2FsdmluIChPcmlnaW5hbCBNaXgpXCIsXHJcbiAgICAgICAgXCJhcnRpc3RcIjogXCJMb3VrXCIsXHJcbiAgICAgICAgXCJhbGJ1bVwiOiBcIkNoaWxsaG9wIEVzc2VudGlhbHMgV2ludGVyIDIwMThcIixcclxuICAgICAgICBcImxlbmd0aFwiOiAxNDAsXHJcbiAgICAgICAgXCJjb3ZlclwiOiBcImh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9KSkFLMG1YX3A1S0xmOV9lZlNFcjdsMm8yb0FHeUNuN2I4LXBPc2ZwOF9qZjAydXZKVUlKMXBEdERaeDFKc0pBZk01WU9lMkJJRUFcIixcclxuICAgICAgICBcImZpbGVcIjogXCIvZGF0YS9maWxlcy8xNCBDYXB0YWluIENhbHZpbiAoT3JpZ2luYWwgTWl4KS5tcDNcIlxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcInRpdGxlXCI6IFwiVGljbyBUaWNvXCIsXHJcbiAgICAgICAgXCJhcnRpc3RcIjogXCJPc2NhciBQZXRlcnNvblwiLFxyXG4gICAgICAgIFwiYWxidW1cIjogXCJVbHRpbWF0ZSBKYXp6IENvbGxlY3Rpb25zXCIsXHJcbiAgICAgICAgXCJsZW5ndGhcIjogMTgwLFxyXG4gICAgICAgIFwiY292ZXJcIjogXCJodHRwczovL2xoNS5nZ3BodC5jb20vaHdFS01JdEt5RnlISWdObDI4Q2ZiQnItUllMdk5oRFVqX1NGZTc1N21fZ0gyeU5zb1JYWW1YZ1dJMDJ0a0FvVkxLQ05JaWhiXCIsXHJcbiAgICAgICAgXCJmaWxlXCI6IFwiL2RhdGEvZmlsZXMvMzAgVGljbyBUaWNvLm00YVwiXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwidGl0bGVcIjogXCJBIEhhenkgU2hhZGUgb2YgV2ludGVyXCIsXHJcbiAgICAgICAgXCJhcnRpc3RcIjogXCJTaW1vbiAmIEdhcmZ1bmtlbFwiLFxyXG4gICAgICAgIFwiYWxidW1cIjogXCJCb29rZW5kc1wiLFxyXG4gICAgICAgIFwibGVuZ3RoXCI6IDEzNyxcclxuICAgICAgICBcImNvdmVyXCI6IFwiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL21mY25aTXBxWWkyT0lzbHI5VTU2UGVjSnl0UDJqUUFqOUJjT2Z4N21Fa0NDQlRSSTRWeHB3elZlNUd1cl9xUzVYazFrUmxpNWdRXCIsXHJcbiAgICAgICAgXCJmaWxlXCI6IFwiL2RhdGEvZmlsZXMvMTEgQSBIYXp5IFNoYWRlIG9mIFdpbnRlci5tNGFcIlxyXG4gICAgfVxyXG5dO1xyXG5cclxubGV0ICRucDtcclxubGV0ICRwbGF5ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYXVkaW9cIik7XHJcblxyXG5hcHAuUGxheWVyID0gKCgpID0+IHtcclxuICAgIGxldCBxdWV1ZV9wb3NpdGlvbiA9IDA7XHJcblxyXG4gICAgbGV0IHJlcGVhdCA9IFwibm9uZVwiO1xyXG4gICAgbGV0IHJlcGVhdF9vcHRpb25zID0gW1wibm9uZVwiLCBcImFsbFwiLCBcIm9uZVwiXTtcclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIEV2ZW50b3NcclxuXHJcbiAgICAvLyBEZWZpbmUgbyB0ZW1wbyBkZSBkdXJhw6fDo28gcXVhbmRvIHVtYSBtw7pzaWNhIMOpIGNhcnJlZ2FkYVxyXG4gICAgJHBsYXllci5hZGRFdmVudExpc3RlbmVyKFwibG9hZGVkbWV0YWRhdGFcIiwgKCkgPT4ge1xyXG4gICAgICAgIGxldCBsZW5ndGggPSBkdXJhdGlvbigkcGxheWVyLmR1cmF0aW9uKTtcclxuICAgICAgICAkbnAubGVuZ3RoLnRleHQobGVuZ3RoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEF0dWFsaXphIGJhcnJhIGRlIHRlbXBvXHJcbiAgICAkcGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0aW1ldXBkYXRlXCIsICgpID0+IHtcclxuICAgICAgICBsZXQgcG9zaXRpb24gPSBkdXJhdGlvbigkcGxheWVyLmN1cnJlbnRUaW1lKTtcclxuICAgICAgICAkbnAucG9zaXRpb24udGV4dChwb3NpdGlvbik7XHJcblxyXG4gICAgICAgIGxldCBwZXJjZW50ID0gJHBsYXllci5jdXJyZW50VGltZSAvICRwbGF5ZXIuZHVyYXRpb24gKiAxMDA7XHJcbiAgICAgICAgJG5wLmVsYXBzZWQuY3NzKFwid2lkdGhcIiwgcGVyY2VudCArIFwiJVwiKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFBhc3NhIHBhcmEgcHLDs3hpbWEgbcO6c2ljYSBxdWFuZG8gYSBhdHVhbCBjaGVnYSBhbyBmaW1cclxuICAgICRwbGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcihcImVuZGVkXCIsICgpID0+IHtcclxuICAgICAgICBpZiAocmVwZWF0ID09PSBcIm9uZVwiKSB7XHJcbiAgICAgICAgICAgICRwbGF5ZXIuY3VycmVudFRpbWUgPSAwO1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLnBsYXkoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLm5leHRUcmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuICAgICQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJG5wID0gJChcIi5ub3ctcGxheWluZ1wiKTtcclxuICAgICAgICAkbnAucG9zaXRpb24gPSAkKFwiLm5vdy1wbGF5aW5nIC5wb3NpdGlvblwiKTtcclxuICAgICAgICAkbnAubGVuZ3RoID0gJChcIi5ub3ctcGxheWluZyAubGVuZ3RoXCIpO1xyXG4gICAgICAgICRucC50aW1lbGluZSA9ICQoXCIubm93LXBsYXlpbmcgLmJhclwiKTtcclxuICAgICAgICAkbnAuZWxhcHNlZCA9ICQoXCIubm93LXBsYXlpbmcgLmVsYXBzZWRcIik7XHJcblxyXG4gICAgICAgICRucC5zb25nID0gJChcIi5ub3ctcGxheWluZyAuc29uZ1wiKTtcclxuICAgICAgICAkbnAuYXJ0aXN0ID0gJChcIi5ub3ctcGxheWluZyAuYXJ0aXN0XCIpO1xyXG4gICAgICAgICRucC5hbGJ1bSA9ICQoXCIubm93LXBsYXlpbmcgLmFsYnVtXCIpO1xyXG4gICAgICAgICRucC5jb3ZlciA9ICQoXCIubm93LXBsYXlpbmcgLmNvdmVyXCIpO1xyXG5cclxuICAgICAgICAkdWlbXCJub3ctcGxheWluZ1wiXSA9ICQoXCIubm93LXBsYXlpbmdcIik7XHJcbiAgICAgICAgJChcIi5wbGF5LXBhdXNlXCIsICR1aVtcIm5vdy1wbGF5aW5nXCJdKS5vbihcImNsaWNrXCIsIGFwcC5QbGF5ZXIucGxheVBhdXNlKTtcclxuICAgICAgICAkKFwiLnNraXAtcHJldmlvdXNcIiwgJHVpW1wibm93LXBsYXlpbmdcIl0pLm9uKFwiY2xpY2tcIiwgYXBwLlBsYXllci5wcmV2aW91c1RyYWNrKTtcclxuICAgICAgICAkKFwiLnNraXAtbmV4dFwiLCAkdWlbXCJub3ctcGxheWluZ1wiXSkub24oXCJjbGlja1wiLCBhcHAuUGxheWVyLm5leHRUcmFjayk7XHJcbiAgICAgICAgJChcIi5yZXBlYXRcIiwgJHVpW1wibm93LXBsYXlpbmdcIl0pLm9uKFwiY2xpY2tcIiwgYXBwLlBsYXllci50b2dnbGVSZXBlYXQpO1xyXG5cclxuICAgICAgICAvLyBDbGlxdWVzIG5hIGxpbmhhIGRvIHRlbXBvXHJcbiAgICAgICAgJG5wLnRpbWVsaW5lLm9uKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB3aWR0aCA9ICQoZXZlbnQuZGVsZWdhdGVUYXJnZXQpLndpZHRoKCk7XHJcbiAgICAgICAgICAgIGxldCBwb3NpdGlvbiA9IGV2ZW50Lm9mZnNldFg7XHJcbiAgICAgICAgICAgIGxldCBwZXJjZW50ID0gcG9zaXRpb24gLyB3aWR0aDtcclxuXHJcbiAgICAgICAgICAgIGxldCBwb3NpdGlvbl9pbl9zZWNvbmRzID0gJHBsYXllci5kdXJhdGlvbiAqIHBlcmNlbnQ7XHJcbiAgICAgICAgICAgIGFwcC5QbGF5ZXIuc2tpcFRvUG9zaXRpb24ocG9zaXRpb25faW5fc2Vjb25kcyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIENhcnJlZ2EgYSBwcmltZWlyYSBtw7pzaWNhIGRhIGZpbGFcclxuICAgICAgICBhcHAuUGxheWVyLmxvYWQocXVldWVbcXVldWVfcG9zaXRpb25dLCBmYWxzZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBjb25zdCB1cGRhdGVUaW1lbGluZVxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLlBsYXllci5za2lwVG9Qb3NpdGlvbigpXHJcbiAgICBjb25zdCBsb2FkID0gKHNvbmcsIGF1dG9wbGF5ID0gdHJ1ZSkgPT4ge1xyXG4gICAgICAgIC8vIFBhdXNhIGEgcmVwcm9kdcOnw6NvLCByZXNldGEgbyB0ZW1wbyBlIGNhcnJlZ2EgYSBub3ZhIG3DunNpY2FcclxuICAgICAgICBhcHAuUGxheWVyLnBhdXNlKCk7XHJcbiAgICAgICAgJHBsYXllci5jdXJyZW50VGltZSA9IDA7XHJcbiAgICAgICAgJHBsYXllci5zcmMgPSBzb25nW1wiZmlsZVwiXTtcclxuXHJcbiAgICAgICAgLy8gQXR1YWxpemEgYXMgaW5mb3JtYcOnw7VlcyBzb2JyZSBhIG3DunNpY2EgZW0gcmVwcm9kdcOnw6NvXHJcbiAgICAgICAgJG5wLnNvbmcudGV4dChzb25nW1widGl0bGVcIl0pO1xyXG4gICAgICAgICRucC5hcnRpc3QudGV4dChzb25nW1wiYXJ0aXN0XCJdKTtcclxuICAgICAgICAkbnAuYWxidW0udGV4dChzb25nW1wiYWxidW1cIl0pO1xyXG4gICAgICAgICRucC5jb3Zlci5jc3MoXCJiYWNrZ3JvdW5kLWltYWdlXCIsIFwidXJsKCdcIiArIHNvbmdbXCJjb3ZlclwiXSArIFwiJylcIik7XHJcblxyXG4gICAgICAgIC8vIEF0dWFsaXphIGRhZG9zIGRhIE1lZGlhIFNlc3Npb24gQVBJXHJcbiAgICAgICAgaWYgKFwibWVkaWFTZXNzaW9uXCIgaW4gbmF2aWdhdG9yKSB7XHJcbiAgICAgICAgICAgIG5hdmlnYXRvci5tZWRpYVNlc3Npb24ubWV0YWRhdGEgPSBuZXcgTWVkaWFNZXRhZGF0YSh7XHJcbiAgICAgICAgICAgICAgICBcInRpdGxlXCI6IHNvbmdbXCJ0aXRsZVwiXSxcclxuICAgICAgICAgICAgICAgIFwiYXJ0aXN0XCI6IHNvbmdbXCJhcnRpc3RcIl0sXHJcbiAgICAgICAgICAgICAgICBcImFsYnVtXCI6IHNvbmdbXCJhbGJ1bVwiXSxcclxuICAgICAgICAgICAgICAgIFwiYXJ0d29ya1wiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInNyY1wiOiBzb25nW1wiY292ZXJcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic2l6ZXNcIjogXCI1MTJ4NTEyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImltYWdlL3BuZ1wiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEluaWNpYSBhIHJlcHJvZHXDp8Ojb1xyXG4gICAgICAgIGlmIChhdXRvcGxheSkge1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLnBsYXkoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIGFwcC5QbGF5ZXIuc2tpcFRvUG9zaXRpb24oKVxyXG4gICAgY29uc3Qgc2tpcFRvUG9zaXRpb24gPSAoc2Vjb25kcykgPT4ge1xyXG4gICAgICAgICRwbGF5ZXIuY3VycmVudFRpbWUgPSBzZWNvbmRzO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuUGxheWVyLnBsYXkoKVxyXG4gICAgY29uc3QgcGxheSA9ICgpID0+IHtcclxuICAgICAgICAkcGxheWVyLnBsYXkoKTtcclxuICAgICAgICAkbnAucmVtb3ZlQ2xhc3MoXCItc3RhdGUtLXBhdXNlZFwiKS5hZGRDbGFzcyhcIi1zdGF0ZS0tcGxheWluZ1wiKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLlBsYXllci5wYXVzZSgpXHJcbiAgICBjb25zdCBwYXVzZSA9ICgpID0+IHtcclxuICAgICAgICAkcGxheWVyLnBhdXNlKCk7XHJcbiAgICAgICAgJG5wLnJlbW92ZUNsYXNzKFwiLXN0YXRlLS1wbGF5aW5nXCIpLmFkZENsYXNzKFwiLXN0YXRlLS1wYXVzZWRcIik7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIGFwcC5QbGF5ZXIucGxheVBhdXNlKClcclxuICAgIGNvbnN0IHBsYXlQYXVzZSA9ICgpID0+IHtcclxuICAgICAgICBpZiAoJHBsYXllci5wYXVzZWQpIHtcclxuICAgICAgICAgICAgYXBwLlBsYXllci5wbGF5KCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYXBwLlBsYXllci5wYXVzZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJkdXJhdGlvblwiLCAkcGxheWVyLmR1cmF0aW9uKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcInZvbHVtZVwiLCAkcGxheWVyLnZvbHVtZSk7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiYnVmZmVyZWRcIiwgJHBsYXllci5idWZmZXJlZCk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJuZXR3b3JrU3RhdGVcIiwgJHBsYXllci5uZXR3b3JrU3RhdGUpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwicGxheWVkXCIsICRwbGF5ZXIucGxheWVkKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcInJlYWR5U3RhdGVcIiwgJHBsYXllci5yZWFkeVN0YXRlKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcInNlZWthYmxlXCIsICRwbGF5ZXIuc2Vla2FibGUpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuUGxheWVyLnByZXZpb3VzVHJhY2soKVxyXG4gICAgY29uc3QgcHJldmlvdXNUcmFjayA9ICgpID0+IHtcclxuICAgICAgICAvLyBTZSB0aXZlciBhcMOzcyBvcyA1IHNlZ3VuZG9zIGRhIG3DunNpY2EgYXR1YWwsIHZvbHRhIHBhcmEgbyBjb21lw6dvXHJcbiAgICAgICAgaWYgKCRwbGF5ZXIuY3VycmVudFRpbWUgPiA1KSB7XHJcbiAgICAgICAgICAgICRwbGF5ZXIuY3VycmVudFRpbWUgPSAwO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHF1ZXVlX3Bvc2l0aW9uID0gKHF1ZXVlX3Bvc2l0aW9uIC0gMSArIHF1ZXVlLmxlbmd0aCkgJSBxdWV1ZS5sZW5ndGg7XHJcbiAgICAgICAgICAgIGFwcC5QbGF5ZXIubG9hZChxdWV1ZVtxdWV1ZV9wb3NpdGlvbl0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLlBsYXllci5uZXh0VHJhY2soKVxyXG4gICAgY29uc3QgbmV4dFRyYWNrID0gKCkgPT4ge1xyXG4gICAgICAgIGlmIChxdWV1ZV9wb3NpdGlvbiArIDEgPCBxdWV1ZS5sZW5ndGggfHwgcmVwZWF0ID09PSBcImFsbFwiKSB7XHJcbiAgICAgICAgICAgIHF1ZXVlX3Bvc2l0aW9uID0gKHF1ZXVlX3Bvc2l0aW9uICsgMSkgJSBxdWV1ZS5sZW5ndGg7XHJcbiAgICAgICAgICAgIGFwcC5QbGF5ZXIubG9hZChxdWV1ZVtxdWV1ZV9wb3NpdGlvbl0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLlBsYXllci50b2dnbGVSZXBlYXQoKVxyXG4gICAgY29uc3QgdG9nZ2xlUmVwZWF0ID0gKCkgPT4ge1xyXG4gICAgICAgIGxldCBjdXJyZW50X3ZhbHVlID0gcmVwZWF0O1xyXG4gICAgICAgIGxldCBuZXdfdmFsdWUgPSByZXBlYXRfb3B0aW9uc1tyZXBlYXRfb3B0aW9ucy5pbmRleE9mKGN1cnJlbnRfdmFsdWUpICsgMV07XHJcblxyXG4gICAgICAgIHJlcGVhdCA9IG5ld192YWx1ZTtcclxuXHJcbiAgICAgICAgJChcIi5yZXBlYXRcIiwgJHVpW1wibm93LXBsYXlpbmdcIl0pXHJcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhcIi1vcHRpb24tLVwiICsgY3VycmVudF92YWx1ZSlcclxuICAgICAgICAgICAgLmFkZENsYXNzKFwiLW9wdGlvbi0tXCIgKyBuZXdfdmFsdWUpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBsb2FkLFxyXG4gICAgICAgIHNraXBUb1Bvc2l0aW9uLFxyXG4gICAgICAgIHBsYXksXHJcbiAgICAgICAgcGF1c2UsXHJcbiAgICAgICAgcGxheVBhdXNlLFxyXG4gICAgICAgIHByZXZpb3VzVHJhY2ssXHJcbiAgICAgICAgbmV4dFRyYWNrLFxyXG4gICAgICAgIHRvZ2dsZVJlcGVhdFxyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmlmIChcIm1lZGlhU2Vzc2lvblwiIGluIG5hdmlnYXRvcikge1xyXG4gICAgbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5zZXRBY3Rpb25IYW5kbGVyKFwicGxheVwiLCBhcHAuUGxheWVyLnBsYXkpO1xyXG4gICAgbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5zZXRBY3Rpb25IYW5kbGVyKFwicGF1c2VcIiwgYXBwLlBsYXllci5wYXVzZSk7XHJcbiAgICAvLyBuYXZpZ2F0b3IubWVkaWFTZXNzaW9uLnNldEFjdGlvbkhhbmRsZXIoXCJzZWVrYmFja3dhcmRcIiwgZnVuY3Rpb24gKCkgeyB9KTtcclxuICAgIC8vIG5hdmlnYXRvci5tZWRpYVNlc3Npb24uc2V0QWN0aW9uSGFuZGxlcihcInNlZWtmb3J3YXJkXCIsIGZ1bmN0aW9uICgpIHsgfSk7XHJcbiAgICBuYXZpZ2F0b3IubWVkaWFTZXNzaW9uLnNldEFjdGlvbkhhbmRsZXIoXCJwcmV2aW91c3RyYWNrXCIsIGFwcC5QbGF5ZXIucHJldmlvdXNUcmFjayk7XHJcbiAgICBuYXZpZ2F0b3IubWVkaWFTZXNzaW9uLnNldEFjdGlvbkhhbmRsZXIoXCJuZXh0dHJhY2tcIiwgYXBwLlBsYXllci5uZXh0VHJhY2spO1xyXG59XHJcbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gYXJ0aXN0IC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG5hcHAuQXJ0aXN0ID0gKCgpID0+IHtcclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIGFwcC5BcnRpc3QubG9hZCgpXHJcbiAgICBjb25zdCBsb2FkID0gKGFydGlzdF9pZCkgPT4ge1xyXG4gICAgICAgICQuZ2V0KFwiZGF0YS9hcnRpc3RzL1wiICsgYXJ0aXN0X2lkICsgXCIuanNvblwiKS5kb25lKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgYXJ0aXN0ID0gcmVzcG9uc2U7XHJcbiAgICAgICAgICAgIGxldCAkYXJ0aXN0ID0gX19yZW5kZXIoXCJhcnRpc3RcIiwgYXJ0aXN0KTtcclxuXHJcbiAgICAgICAgICAgIC8vIMOBbGJ1bnNcclxuICAgICAgICAgICAgbGV0IGFsYnVtcyA9IGFydGlzdFtcImFsYnVtc1wiXTtcclxuICAgICAgICAgICAgbGV0ICRhbGJ1bXMgPSAkKFwiLmFsYnVtc1wiLCAkYXJ0aXN0KTtcclxuXHJcbiAgICAgICAgICAgIGFsYnVtcy5mb3JFYWNoKChhbGJ1bSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgYWxidW1bXCJjb3Zlci1hcnRcIl0gPSBcImJhY2tncm91bmQtaW1hZ2U6IHVybCgnXCIgKyBhbGJ1bVtcImNvdmVyXCJdICsgXCInKVwiO1xyXG4gICAgICAgICAgICAgICAgbGV0ICRhbGJ1bSA9IF9fcmVuZGVyKFwiYXJ0aXN0LWFsYnVtXCIsIGFsYnVtKS5hcHBlbmRUbygkYWxidW1zKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBIaXRzXHJcbiAgICAgICAgICAgIGxldCBoaXRzID0gYXJ0aXN0W1wiaGl0c1wiXTtcclxuICAgICAgICAgICAgbGV0ICRoaXRzID0gJChcIi5oaXRzXCIsICRhcnRpc3QpO1xyXG5cclxuICAgICAgICAgICAgaGl0cy5mb3JFYWNoKChoaXQpID0+IHtcclxuICAgICAgICAgICAgICAgIGhpdFtcImZvcm1hdHRlZC1sZW5ndGhcIl0gPSBkdXJhdGlvbihoaXRbXCJsZW5ndGhcIl0pO1xyXG4gICAgICAgICAgICAgICAgbGV0ICRoaXQgPSBfX3JlbmRlcihcImFydGlzdC1oaXRcIiwgaGl0KS5hcHBlbmRUbygkaGl0cyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gQ29sb2NhIG5hIHRlbGFcclxuICAgICAgICAgICAgJHVpW1wibGlicmFyeVwiXS5lbXB0eSgpLmFwcGVuZCgkYXJ0aXN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbG9hZFxyXG4gICAgfTtcclxufSkoKTtcclxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyB1cGxvYWQgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbi8vIGNvbnN0IG11c2ljU3RvcmFnZSA9IHN0b3JhZ2UuY2hpbGQoXCJzb25nc1wiKTtcclxuXHJcbmNvbnN0ICR1cGxvYWQgPSAkKFwiLnVwbG9hZFwiKTtcclxuY29uc3QgZHJvcHpvbmUgPSBuZXcgRHJvcHpvbmUoXCIudXBsb2FkXCIsIHtcclxuXHR1cmw6IFwiL3VwbG9hZFwiLFxyXG5cdGFjY2VwdGVkRmlsZXM6IFwiYXVkaW8vKlwiXHJcbn0pO1xyXG5cclxuLy8gTW9zdHJhL2VzY29uZGUgZHJvcHpvbmUgYW8gZW50cmFyIGNvbSBhcnF1aXZvIG5hIHDDoWdpbmFcclxuJCh3aW5kb3cpLm9uKFwiZHJhZ2VudGVyXCIsIChldmVudCkgPT4ge1xyXG5cdCR1cGxvYWQuYWRkQ2xhc3MoXCItc3RhdGUtLWFjdGl2ZVwiKTtcclxufSk7XHJcblxyXG4kKHdpbmRvdykub24oXCJkcmFnbGVhdmVcIiwgKGV2ZW50KSA9PiB7XHJcblx0aWYgKCQoZXZlbnQudGFyZ2V0KS5oYXNDbGFzcyhcInVwbG9hZFwiKSkge1xyXG5cdFx0JHVwbG9hZC5yZW1vdmVDbGFzcyhcIi1zdGF0ZS0tYWN0aXZlXCIpO1xyXG5cdH1cclxufSk7XHJcblxyXG4vLyBBcnF1aXZvIGFkaWNpb25hZG9cclxuZHJvcHpvbmUub24oXCJhZGRlZGZpbGVcIiwgKGZpbGUpID0+IHtcclxuXHRjb25zb2xlLmxvZyhmaWxlKTtcclxuXHJcblx0anNtZWRpYXRhZ3MucmVhZChmaWxlLCB7XHJcblx0XHRvblN1Y2Nlc3M6IHRhZ3MgPT4ge1xyXG5cdFx0XHRjb25zb2xlLmxvZyh0YWdzKTtcclxuXHRcdFx0Ly8gcmV0dXJuIGZhbHNlO1xyXG5cclxuXHRcdFx0Y29uc3QgZmlsZUluZm8gPSBzdHJ1Y3R1cmVUYWdzRnJvbUZpbGUodGFncyk7XHJcblx0XHRcdGNvbnN0IGZpbGVSZWYgPSBgc29uZ3MvJHt1c2VyLnVpZH0vJHtmaWxlLm5hbWV9YDtcclxuXHRcdFx0ZmlsZUluZm9bXCJmaWxlUmVmXCJdID0gZmlsZVJlZjtcclxuXHJcblx0XHRcdGNvbnN0IHVwbG9hZFRhc2sgPSBzdG9yYWdlLmNoaWxkKGZpbGVSZWYpLnB1dChmaWxlKTtcclxuXHRcdFx0dXBsb2FkVGFzay5vbihcInN0YXRlX2NoYW5nZWRcIiwgKHNuYXBzaG90KSA9PiB7XHJcblx0XHRcdFx0Y29uc3QgcHJvZ3Jlc3MgPSAoc25hcHNob3QuYnl0ZXNUcmFuc2ZlcnJlZCAvIHNuYXBzaG90LnRvdGFsQnl0ZXMpICogMTAwO1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiVXBsb2FkIGlzIFwiICsgcHJvZ3Jlc3MgKyBcIiUgZG9uZVwiKTtcclxuXHJcblx0XHRcdFx0Ly8gc3dpdGNoIChzbmFwc2hvdC5zdGF0ZSkge1xyXG5cdFx0XHRcdC8vIFx0Y2FzZSBcInBhdXNlZFwiOlxyXG5cdFx0XHRcdC8vIFx0XHRjb25zb2xlLmxvZyhcIlVwbG9hZCBpcyBwYXVzZWRcIik7XHJcblx0XHRcdFx0Ly8gXHRcdGJyZWFrO1xyXG5cdFx0XHRcdC8vIFx0Y2FzZSBcInJ1bm5pbmdcIjpcclxuXHRcdFx0XHQvLyBcdFx0Y29uc29sZS5sb2coXCJVcGxvYWQgaXMgcnVubmluZ1wiKTtcclxuXHRcdFx0XHQvLyBcdFx0YnJlYWs7XHJcblx0XHRcdFx0Ly8gfVxyXG5cdFx0XHR9LCAoZXJyb3IpID0+IHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnJvcik7XHJcblx0XHRcdH0sICgpID0+IHtcclxuXHRcdFx0XHQvLyBRdWFuZG8gdGVybWluYXIgbyB1cGxvYWQsIGluc2VyZSBhIG3DunNpY2Egbm8gYmFuY29cclxuXHRcdFx0XHRkYi5jb2xsZWN0aW9uKGB1c2Vycy8ke3VzZXIudWlkfS9zb25nc2ApLmFkZChmaWxlSW5mbyk7XHJcblxyXG5cdFx0XHRcdHVwbG9hZFRhc2suc25hcHNob3QucmVmLmdldERvd25sb2FkVVJMKCkudGhlbigoZG93bmxvYWRVUkwpID0+IHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiRmlsZSBhdmFpbGFibGUgYXRcIiwgZG93bmxvYWRVUkwpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHR9LFxyXG5cdFx0b25FcnJvcjogZXJyb3IgPT4ge1xyXG5cdFx0XHRjb25zb2xlLmxvZyhlcnJvcik7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cclxuXHJcbn0pO1xyXG5cclxuY29uc3Qgc3RydWN0dXJlVGFnc0Zyb21GaWxlID0gKGZpbGUpID0+IHtcclxuXHRjb25zdCB0YWdzID0gZmlsZS50YWdzO1xyXG5cclxuXHRsZXQgZGF0YSA9IHtcclxuXHRcdFwidGl0bGVcIjogdGFncy50aXRsZSxcclxuXHRcdFwic29ydFRpdGxlXCI6IG51bGwsXHJcblx0XHRcImFydGlzdFwiOiB0YWdzLmFydGlzdCxcclxuXHRcdFwic29ydEFydGlzdFwiOiBudWxsLFxyXG5cdFx0XCJhbGJ1bVRpdGxlXCI6IHRhZ3MuYWxidW0sXHJcblx0XHRcInNvcnRhbGJ1bVRpdGxlXCI6IG51bGwsXHJcblx0XHRcImFsYnVtVHJhY2tOdW1iZXJcIjogKHRhZ3MudHJhY2s/IHRhZ3MudHJhY2suc3BsaXQoXCIvXCIpWzBdIDogbnVsbCksXHJcblx0XHRcImFsYnVtVHJhY2tDb3VudFwiOiBudWxsLFxyXG5cdFx0XCJhbGJ1bUFydGlzdFwiOiBudWxsLFxyXG5cdFx0XCJyZWxlYXNlRGF0ZVwiOiB0YWdzLnllYXIsXHJcblx0XHRcInJlbGVhc2VZZWFyXCI6IG1vbWVudCh0YWdzLnllYXIsIFttb21lbnQuZGVmYXVsdEZvcm1hdFV0YywgbW9tZW50LmRlZmF1bHRGb3JtYXQsIFwiWVlZWVwiXSkueWVhcigpLFxyXG5cdFx0XCJmaWxlVHlwZVwiOiBudWxsLFxyXG5cdH07XHJcblxyXG5cdGlmIChmaWxlLnR5cGUgPT09IFwiTVA0XCIpIHtcclxuXHRcdGRhdGFbXCJzb3J0VGl0bGVcIl0gPSAodGFncy5zb25tPyB0YWdzLnNvbm0uZGF0YSA6IHRhZ3MudGl0bGUpO1xyXG5cdFx0ZGF0YVtcInNvcnRBcnRpc3RcIl0gPSAodGFncy5zb2FyPyB0YWdzLnNvYXIuZGF0YSA6IHRhZ3MuYXJ0aXN0KTtcclxuXHRcdGRhdGFbXCJzb3J0QWxidW1UaXRsZVwiXSA9ICh0YWdzLnNvYWw/IHRhZ3Muc29hbC5kYXRhIDogdGFncy5hbGJ1bSk7XHJcblx0XHRkYXRhW1wiYWxidW1UcmFja0NvdW50XCJdID0gKHRhZ3MudHJrbiAmJiB0YWdzLnRya24uZGF0YT8gdGFncy50cmtuLmRhdGEudG90YWwgOiBudWxsKTtcclxuXHRcdGRhdGFbXCJhbGJ1bUFydGlzdFwiXSA9ICh0YWdzLmFBUlQ/IHRhZ3MuYUFSVC5kYXRhIDogbnVsbCk7XHJcblx0XHRkYXRhW1wiZmlsZVR5cGVcIl0gPSBmaWxlLmZ0eXAudHJpbSgpLnRvTG93ZXJDYXNlKCk7XHJcblx0fSBlbHNlIGlmIChmaWxlLnR5cGUgPT09IFwiSUQzXCIpIHtcclxuXHRcdGRhdGFbXCJzb3J0VGl0bGVcIl0gPSAodGFncy5zb25tPyB0YWdzLnNvbm0uZGF0YSA6IHRhZ3MudGl0bGUpO1xyXG5cdFx0ZGF0YVtcImZpbGVUeXBlXCJdID0gXCJtcDNcIjtcclxuXHJcblx0fVxyXG5cclxuXHRyZXR1cm4gZGF0YTtcclxufTtcclxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBjb21tYW5kcyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbmxldCBjb21tYW5kcyA9IFtcclxuICAgIHtcclxuICAgICAgICBcInRpdGxlXCI6IFwiUGxheS9QYXVzZVwiLFxyXG4gICAgICAgIFwic2hvcnRjdXRcIjogW1wia1wiLCBcInNwYWNlXCJdLFxyXG4gICAgICAgIFwiZnVuY3Rpb25cIjogKCkgPT4ge1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLnBsYXlQYXVzZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJ0aXRsZVwiOiBcIk3DunNpY2EgYW50ZXJpb3JcIixcclxuICAgICAgICBcInNob3J0Y3V0XCI6IFtcIixcIl0sXHJcbiAgICAgICAgXCJmdW5jdGlvblwiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGFwcC5QbGF5ZXIucHJldmlvdXNUcmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJ0aXRsZVwiOiBcIlByw7N4aW1hIG3DunNpY2FcIixcclxuICAgICAgICBcInNob3J0Y3V0XCI6IFtcIi5cIl0sXHJcbiAgICAgICAgXCJmdW5jdGlvblwiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGFwcC5QbGF5ZXIubmV4dFRyYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5dO1xyXG5cclxuY29tbWFuZHMuZm9yRWFjaCgoY29tbWFuZCkgPT4ge1xyXG4gICAgY29tbWFuZFtcInNob3J0Y3V0XCJdLmZvckVhY2goKHNob3J0Y3V0KSA9PiB7XHJcbiAgICAgICAgTW91c2V0cmFwLmJpbmQoc2hvcnRjdXQsICgpID0+IHtcclxuICAgICAgICAgICAgY29tbWFuZFtcImZ1bmN0aW9uXCJdKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbi8vIC0gSjogdm9sdGEgMTAgc2VndW5kb3NcclxuLy8gLSBMOiBhdmFuw6dhIDEwIHNlZ3VuZG9zXHJcbi8vIC0gUjogcmVwZWF0XHJcbi8vIC0gUzogc2h1ZmZsZVxyXG4vLyAtIE06IG11ZG9cclxuXHJcbi8vICMgTmF2ZWdhw6fDo29cclxuLy8gLSBnIGY6IGZhdm9yaXRvc1xyXG4vLyAtIGcgbDogYmlibGlvdGVjYVxyXG4vLyAtIGcgcDogcGxheWxpc3RzXHJcbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gc3RhcnQgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4kKGZ1bmN0aW9uKCkge1xyXG4gICAgYXBwLkFydGlzdC5sb2FkKFwidGhlLWJlYXRsZXNcIik7XHJcbn0pO1xyXG4iXX0=
