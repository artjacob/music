"use strict";

////////////////////////////////////////////////////////////////////////////////////////////////////
// base ////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
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
  var queue_position = 0; ////////////////////////////////////////////////////////////////////////////////////////////////
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
    app.Player.nextTrack();
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
    $(".skip-next", $ui["now-playing"]).on("click", app.Player.nextTrack); // Cliques na linha do tempo

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
    queue_position = (queue_position + 1) % queue.length;
    app.Player.load(queue[queue_position]);
  }; ////////////////////////////////////////////////////////////////////////////////////////////////


  return {
    load: load,
    skipToPosition: skipToPosition,
    play: play,
    pause: pause,
    playPause: playPause,
    previousTrack: previousTrack,
    nextTrack: nextTrack
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhc2UuanMiLCJ0ZW1wbGF0ZS1lbmdpbmUuanMiLCJwbGF5ZXIuanMiLCJhcnRpc3QuanMiLCJjb21tYW5kcy5qcyIsInN0YXJ0LmpzIl0sIm5hbWVzIjpbImFwcCIsInVpIiwiJHVpIiwiY3VlIiwiJCIsImR1cmF0aW9uIiwic2Vjb25kcyIsIm1vbWVudCIsInV0YyIsImFzTWlsbGlzZWNvbmRzIiwiZm9ybWF0IiwidGVtcGxhdGUiLCIkdGVtcGxhdGVzIiwiZWFjaCIsIiR0aGlzIiwibmFtZSIsImF0dHIiLCJodG1sIiwicmVtb3ZlIiwicmVuZGVyIiwiZGF0YSIsIiRyZW5kZXIiLCJjbG9uZSIsImZuIiwiZmlsbEJsYW5rcyIsIiRibGFuayIsImZpbGwiLCJydWxlcyIsInNwbGl0IiwiaSIsImxlbmd0aCIsInBhaXIiLCJkZXN0IiwidHJpbSIsInNvdXJjZSIsInZhbHVlIiwiaiIsImFkZENsYXNzIiwidmFsIiwiaWZfbnVsbCIsImhpZGUiLCJyZW1vdmVDbGFzcyIsInJlbW92ZUF0dHIiLCJoYXNDbGFzcyIsIl9fcmVuZGVyIiwicXVldWUiLCIkbnAiLCIkcGxheWVyIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiUGxheWVyIiwicXVldWVfcG9zaXRpb24iLCJhZGRFdmVudExpc3RlbmVyIiwidGV4dCIsInBvc2l0aW9uIiwiY3VycmVudFRpbWUiLCJwZXJjZW50IiwiZWxhcHNlZCIsImNzcyIsIm5leHRUcmFjayIsInRpbWVsaW5lIiwic29uZyIsImFydGlzdCIsImFsYnVtIiwiY292ZXIiLCJvbiIsInBsYXlQYXVzZSIsInByZXZpb3VzVHJhY2siLCJldmVudCIsIndpZHRoIiwiZGVsZWdhdGVUYXJnZXQiLCJvZmZzZXRYIiwicG9zaXRpb25faW5fc2Vjb25kcyIsInNraXBUb1Bvc2l0aW9uIiwibG9hZCIsInBhdXNlIiwic3JjIiwibmF2aWdhdG9yIiwibWVkaWFTZXNzaW9uIiwibWV0YWRhdGEiLCJNZWRpYU1ldGFkYXRhIiwicGxheSIsInBhdXNlZCIsInNldEFjdGlvbkhhbmRsZXIiLCJBcnRpc3QiLCJhcnRpc3RfaWQiLCJnZXQiLCJkb25lIiwicmVzcG9uc2UiLCIkYXJ0aXN0IiwiYWxidW1zIiwiJGFsYnVtcyIsImZvckVhY2giLCIkYWxidW0iLCJhcHBlbmRUbyIsImhpdHMiLCIkaGl0cyIsImhpdCIsIiRoaXQiLCJlbXB0eSIsImFwcGVuZCIsImNvbW1hbmRzIiwiY29tbWFuZCIsInNob3J0Y3V0IiwiTW91c2V0cmFwIiwiYmluZCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFFQSxJQUFBQSxHQUFBLEdBQUEsRUFBQTtBQUVBLElBQUFDLEVBQUEsR0FBQSxFQUFBO0FBQ0EsSUFBQUMsR0FBQSxHQUFBLEVBQUE7QUFFQSxJQUFBQyxHQUFBLEdBQUEsRUFBQSxDLENBS0E7O0FBQ0FDLENBQUEsQ0FBQSxZQUFBO0FBQ0FGLEVBQUFBLEdBQUEsQ0FBQSxTQUFBLENBQUEsR0FBQUUsQ0FBQSxDQUFBLFVBQUEsQ0FBQTtBQUNBLENBRkEsQ0FBQTs7QUFJQSxJQUFBQyxRQUFBLEdBQUEsU0FBQUEsUUFBQSxDQUFBQyxPQUFBLEVBQUE7QUFDQSxTQUFBQyxNQUFBLENBQUFDLEdBQUEsQ0FBQUQsTUFBQSxDQUFBRixRQUFBLENBQUFDLE9BQUEsRUFBQSxTQUFBLEVBQUFHLGNBQUEsRUFBQSxFQUFBQyxNQUFBLENBQUEsTUFBQSxDQUFBO0FBQ0EsQ0FGQSxDLENDbkJBO0FBQ0E7QUFDQTs7O0FBRUFULEVBQUEsQ0FBQVUsUUFBQSxHQUFBLFlBQUE7QUFDQSxNQUFBQyxVQUFBLEdBQUEsRUFBQTtBQUVBUixFQUFBQSxDQUFBLENBQUEsWUFBQTtBQUNBQSxJQUFBQSxDQUFBLENBQUEsVUFBQSxDQUFBLENBQUFTLElBQUEsQ0FBQSxZQUFBO0FBQ0EsVUFBQUMsS0FBQSxHQUFBVixDQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsVUFBQVcsSUFBQSxHQUFBRCxLQUFBLENBQUFFLElBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxVQUFBQyxJQUFBLEdBQUFILEtBQUEsQ0FBQUcsSUFBQSxFQUFBO0FBRUFMLE1BQUFBLFVBQUEsQ0FBQUcsSUFBQSxDQUFBLEdBQUFYLENBQUEsQ0FBQWEsSUFBQSxDQUFBO0FBQ0FILE1BQUFBLEtBQUEsQ0FBQUksTUFBQTtBQUNBLEtBUEE7QUFRQSxHQVRBLENBQUE7O0FBV0EsTUFBQUMsTUFBQSxHQUFBLFNBQUFBLE1BQUEsQ0FBQVIsUUFBQSxFQUFBUyxJQUFBLEVBQUE7QUFDQSxRQUFBLENBQUFSLFVBQUEsQ0FBQUQsUUFBQSxDQUFBLEVBQUE7QUFBQSxhQUFBLEtBQUE7QUFBQTs7QUFDQSxRQUFBVSxPQUFBLEdBQUFULFVBQUEsQ0FBQUQsUUFBQSxDQUFBLENBQUFXLEtBQUEsRUFBQTtBQUVBRCxJQUFBQSxPQUFBLENBQUFELElBQUEsQ0FBQUEsSUFBQTs7QUFFQWhCLElBQUFBLENBQUEsQ0FBQW1CLEVBQUEsQ0FBQUMsVUFBQSxHQUFBLFlBQUE7QUFDQSxVQUFBQyxNQUFBLEdBQUFyQixDQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsVUFBQXNCLElBQUEsR0FBQUQsTUFBQSxDQUFBTCxJQUFBLENBQUEsTUFBQSxDQUFBO0FBRUEsVUFBQU8sS0FBQSxHQUFBRCxJQUFBLENBQUFFLEtBQUEsQ0FBQSxHQUFBLENBQUE7O0FBQ0EsV0FBQSxJQUFBQyxDQUFBLEdBQUEsQ0FBQSxFQUFBQSxDQUFBLEdBQUFGLEtBQUEsQ0FBQUcsTUFBQSxFQUFBRCxDQUFBLEVBQUEsRUFBQTtBQUNBLFlBQUFFLElBQUEsR0FBQUosS0FBQSxDQUFBRSxDQUFBLENBQUEsQ0FBQUQsS0FBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLFlBQUFJLElBQUEsR0FBQUQsSUFBQSxDQUFBLENBQUEsQ0FBQSxHQUFBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLENBQUFFLElBQUEsRUFBQSxHQUFBLE1BQUE7QUFDQSxZQUFBQyxNQUFBLEdBQUFILElBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBRSxJQUFBLEVBQUEs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QUFpQixhQUFBO0FBQ0E7QUFMQSxDQVJBLEVBZUE7QUFDQSxXQUFBLGdCQURBO0FBRUEsY0FBQSxDQUFBLEdBQUEsQ0FGQTtBQUdBLGNBQUEscUJBQUE7QUFDQW5FLElBQUFBLEdBQUEsQ0FBQWtELE1BQUEsQ0FBQVMsU0FBQTtBQUNBO0FBTEEsQ0FmQSxDQUFBO0FBd0JBMEMsUUFBQSxDQUFBVCxPQUFBLENBQUEsVUFBQVUsT0FBQSxFQUFBO0FBQ0FBLEVBQUFBLE9BQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQVYsT0FBQSxDQUFBLFVBQUFXLFFBQUEsRUFBQTtBQUNBQyxJQUFBQSxTQUFBLENBQUFDLElBQUEsQ0FBQUYsUUFBQSxFQUFBLFlBQUE7QUFDQUQsTUFBQUEsT0FBQSxDQUFBLFVBQUEsQ0FBQTtBQUNBLGFBQUEsS0FBQTtBQUNBLEtBSEE7QUFJQSxHQUxBO0FBTUEsQ0FQQSxFLENBU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FDOUNBO0FBQ0E7QUFDQTs7QUFFQWxHLENBQUEsQ0FBQSxZQUFBO0FBQ0FKLEVBQUFBLEdBQUEsQ0FBQW9GLE1BQUEsQ0FBQVYsSUFBQSxDQUFBLGFBQUE7QUFDQSxDQUZBLENBQUEiLCJmaWxlIjoibXVzaWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIGJhc2UgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxubGV0IGFwcCA9IHsgfTtcclxuXHJcbmxldCB1aSA9IHsgfTtcclxubGV0ICR1aSA9IHsgfTtcclxuXHJcbmxldCBjdWUgPSB7IH07XHJcblxyXG5cclxuXHJcblxyXG4vLyBUT0RPOiBtb3ZlciBwYXJhIGx1Z2FyIGFwcm9wcmlhZG9cclxuJChmdW5jdGlvbigpIHtcclxuICAgICR1aVtcImxpYnJhcnlcIl0gPSAkKFwiLmxpYnJhcnlcIik7XHJcbn0pO1xyXG5cclxuY29uc3QgZHVyYXRpb24gPSAoc2Vjb25kcykgPT4ge1xyXG4gICAgcmV0dXJuIG1vbWVudC51dGMobW9tZW50LmR1cmF0aW9uKHNlY29uZHMsIFwic2Vjb25kc1wiKS5hc01pbGxpc2Vjb25kcygpKS5mb3JtYXQoXCJtOnNzXCIpO1xyXG59O1xyXG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIGNvcmUgLyB0ZW1wbGF0ZSBlbmdpbmUgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxudWkudGVtcGxhdGUgPSAoKCkgPT4ge1xyXG4gICAgbGV0ICR0ZW1wbGF0ZXMgPSB7IH07XHJcblxyXG4gICAgJChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJChcInRlbXBsYXRlXCIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9ICR0aGlzLmF0dHIoXCJpZFwiKTtcclxuICAgICAgICAgICAgdmFyIGh0bWwgPSAkdGhpcy5odG1sKCk7XHJcblxyXG4gICAgICAgICAgICAkdGVtcGxhdGVzW25hbWVdID0gJChodG1sKTtcclxuICAgICAgICAgICAgJHRoaXMucmVtb3ZlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCByZW5kZXIgPSAodGVtcGxhdGUsIGRhdGEpID0+IHtcclxuICAgICAgICBpZiAoISR0ZW1wbGF0ZXNbdGVtcGxhdGVdKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIHZhciAkcmVuZGVyID0gJHRlbXBsYXRlc1t0ZW1wbGF0ZV0uY2xvbmUoKTtcclxuXHJcbiAgICAgICAgJHJlbmRlci5kYXRhKGRhdGEpO1xyXG5cclxuICAgICAgICAkLmZuLmZpbGxCbGFua3MgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkYmxhbmsgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICB2YXIgZmlsbCA9ICRibGFuay5kYXRhKFwiZmlsbFwiKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBydWxlcyA9IGZpbGwuc3BsaXQoXCIsXCIpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFpciA9IHJ1bGVzW2ldLnNwbGl0KFwiOlwiKTtcclxuICAgICAgICAgICAgICAgIHZhciBkZXN0ID0gKHBhaXJbMV0gPyBwYWlyWzBdLnRyaW0oKSA6IFwiaHRtbFwiKTtcclxuICAgICAgICAgICAgICAgIHZhciBzb3VyY2UgPSAocGFpclsxXSA/IHBhaXJbMV0udHJpbSgpIDogcGFpclswXSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW3NvdXJjZV07XHJcblxyXG4gICAgICAgICAgICAgICAgc291cmNlID0gc291cmNlLnNwbGl0KFwiL1wiKTtcclxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2UubGVuZ3RoID4gMSAmJiB0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGRhdGFbc291cmNlWzBdXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDE7IGogPCBzb3VyY2UubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAodmFsdWVbc291cmNlW2pdXSkgPyB2YWx1ZVtzb3VyY2Vbal1dIDogbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiB2YWx1ZSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZXN0ID09PSBcImNsYXNzXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLmFkZENsYXNzKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlc3QgPT09IFwiaHRtbFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRibGFuay5odG1sKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlc3QgPT09IFwidmFsdWVcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsudmFsKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsuYXR0cihkZXN0LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWZfbnVsbCA9ICRibGFuay5kYXRhKFwiZmlsbC1udWxsXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpZl9udWxsID09PSBcImhpZGVcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaWZfbnVsbCA9PT0gXCJyZW1vdmVcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAkYmxhbmtcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhcImZpbGxcIilcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVBdHRyKFwiZGF0YS1maWxsXCIpXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlQXR0cihcImRhdGEtZmlsbC1udWxsXCIpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICgkcmVuZGVyLmhhc0NsYXNzKFwiZmlsbFwiKSkge1xyXG4gICAgICAgICAgICAkcmVuZGVyLmZpbGxCbGFua3MoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICQoXCIuZmlsbFwiLCAkcmVuZGVyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJCh0aGlzKS5maWxsQmxhbmtzKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiAkcmVuZGVyO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVuZGVyXHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxubGV0IF9fcmVuZGVyID0gdWkudGVtcGxhdGUucmVuZGVyO1xyXG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIHBsYXllciAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxubGV0IHF1ZXVlID0gW1xyXG4gICAge1xyXG4gICAgICAgIFwidGl0bGVcIjogXCJDYXB0YWluIENhbHZpbiAoT3JpZ2luYWwgTWl4KVwiLFxyXG4gICAgICAgIFwiYXJ0aXN0XCI6IFwiTG91a1wiLFxyXG4gICAgICAgIFwiYWxidW1cIjogXCJDaGlsbGhvcCBFc3NlbnRpYWxzIFdpbnRlciAyMDE4XCIsXHJcbiAgICAgICAgXCJsZW5ndGhcIjogMTQwLFxyXG4gICAgICAgIFwiY292ZXJcIjogXCJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vSkpBSzBtWF9wNUtMZjlfZWZTRXI3bDJvMm9BR3lDbjdiOC1wT3NmcDhfamYwMnV2SlVJSjFwRHREWngxSnNKQWZNNVlPZTJCSUVBXCIsXHJcbiAgICAgICAgXCJmaWxlXCI6IFwiL2RhdGEvZmlsZXMvMTQgQ2FwdGFpbiBDYWx2aW4gKE9yaWdpbmFsIE1peCkubXAzXCJcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJ0aXRsZVwiOiBcIlRpY28gVGljb1wiLFxyXG4gICAgICAgIFwiYXJ0aXN0XCI6IFwiT3NjYXIgUGV0ZXJzb25cIixcclxuICAgICAgICBcImFsYnVtXCI6IFwiVWx0aW1hdGUgSmF6eiBDb2xsZWN0aW9uc1wiLFxyXG4gICAgICAgIFwibGVuZ3RoXCI6IDE4MCxcclxuICAgICAgICBcImNvdmVyXCI6IFwiaHR0cHM6Ly9saDUuZ2dwaHQuY29tL2h3RUtNSXRLeUZ5SElnTmwyOENmYkJyLVJZTHZOaERVal9TRmU3NTdtX2dIMnlOc29SWFltWGdXSTAydGtBb1ZMS0NOSWloYlwiLFxyXG4gICAgICAgIFwiZmlsZVwiOiBcIi9kYXRhL2ZpbGVzLzMwIFRpY28gVGljby5tNGFcIlxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcInRpdGxlXCI6IFwiQSBIYXp5IFNoYWRlIG9mIFdpbnRlclwiLFxyXG4gICAgICAgIFwiYXJ0aXN0XCI6IFwiU2ltb24gJiBHYXJmdW5rZWxcIixcclxuICAgICAgICBcImFsYnVtXCI6IFwiQm9va2VuZHNcIixcclxuICAgICAgICBcImxlbmd0aFwiOiAxMzcsXHJcbiAgICAgICAgXCJjb3ZlclwiOiBcImh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9tZmNuWk1wcVlpMk9Jc2xyOVU1NlBlY0p5dFAyalFBajlCY09meDdtRWtDQ0JUUkk0Vnhwd3pWZTVHdXJfcVM1WGsxa1JsaTVnUVwiLFxyXG4gICAgICAgIFwiZmlsZVwiOiBcIi9kYXRhL2ZpbGVzLzExIEEgSGF6eSBTaGFkZSBvZiBXaW50ZXIubTRhXCJcclxuICAgIH1cclxuXTtcclxuXHJcbmxldCAkbnA7XHJcbmxldCAkcGxheWVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImF1ZGlvXCIpO1xyXG5cclxuYXBwLlBsYXllciA9ICgoKSA9PiB7XHJcbiAgICBsZXQgcXVldWVfcG9zaXRpb24gPSAwO1xyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gRXZlbnRvc1xyXG5cclxuICAgIC8vIERlZmluZSBvIHRlbXBvIGRlIGR1cmHDp8OjbyBxdWFuZG8gdW1hIG3DunNpY2Egw6kgY2FycmVnYWRhIG3DunNpY2FcclxuICAgICRwbGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRlZG1ldGFkYXRhXCIsICgpID0+IHtcclxuICAgICAgICBsZXQgbGVuZ3RoID0gZHVyYXRpb24oJHBsYXllci5kdXJhdGlvbik7XHJcbiAgICAgICAgJG5wLmxlbmd0aC50ZXh0KGxlbmd0aCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBdHVhbGl6YSBiYXJyYSBkZSB0ZW1wb1xyXG4gICAgJHBsYXllci5hZGRFdmVudExpc3RlbmVyKFwidGltZXVwZGF0ZVwiLCAoKSA9PiB7XHJcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gZHVyYXRpb24oJHBsYXllci5jdXJyZW50VGltZSk7XHJcbiAgICAgICAgJG5wLnBvc2l0aW9uLnRleHQocG9zaXRpb24pO1xyXG5cclxuICAgICAgICBsZXQgcGVyY2VudCA9ICRwbGF5ZXIuY3VycmVudFRpbWUgLyAkcGxheWVyLmR1cmF0aW9uICogMTAwO1xyXG4gICAgICAgICRucC5lbGFwc2VkLmNzcyhcIndpZHRoXCIsIHBlcmNlbnQgKyBcIiVcIik7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBQYXNzYSBwYXJhIHByw7N4aW1hIG3DunNpY2EgcXVhbmRvIGEgYXR1YWwgY2hlZ2EgYW8gZmltXHJcbiAgICAkcGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoXCJlbmRlZFwiLCAoKSA9PiB7XHJcbiAgICAgICAgYXBwLlBsYXllci5uZXh0VHJhY2soKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuICAgICQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJG5wID0gJChcIi5ub3ctcGxheWluZ1wiKTtcclxuICAgICAgICAkbnAucG9zaXRpb24gPSAkKFwiLm5vdy1wbGF5aW5nIC5wb3NpdGlvblwiKTtcclxuICAgICAgICAkbnAubGVuZ3RoID0gJChcIi5ub3ctcGxheWluZyAubGVuZ3RoXCIpO1xyXG4gICAgICAgICRucC50aW1lbGluZSA9ICQoXCIubm93LXBsYXlpbmcgLmJhclwiKTtcclxuICAgICAgICAkbnAuZWxhcHNlZCA9ICQoXCIubm93LXBsYXlpbmcgLmVsYXBzZWRcIik7XHJcblxyXG4gICAgICAgICRucC5zb25nID0gJChcIi5ub3ctcGxheWluZyAuc29uZ1wiKTtcclxuICAgICAgICAkbnAuYXJ0aXN0ID0gJChcIi5ub3ctcGxheWluZyAuYXJ0aXN0XCIpO1xyXG4gICAgICAgICRucC5hbGJ1bSA9ICQoXCIubm93LXBsYXlpbmcgLmFsYnVtXCIpO1xyXG4gICAgICAgICRucC5jb3ZlciA9ICQoXCIubm93LXBsYXlpbmcgLmNvdmVyXCIpO1xyXG5cclxuICAgICAgICAkdWlbXCJub3ctcGxheWluZ1wiXSA9ICQoXCIubm93LXBsYXlpbmdcIik7XHJcbiAgICAgICAgJChcIi5wbGF5LXBhdXNlXCIsICR1aVtcIm5vdy1wbGF5aW5nXCJdKS5vbihcImNsaWNrXCIsIGFwcC5QbGF5ZXIucGxheVBhdXNlKTtcclxuICAgICAgICAkKFwiLnNraXAtcHJldmlvdXNcIiwgJHVpW1wibm93LXBsYXlpbmdcIl0pLm9uKFwiY2xpY2tcIiwgYXBwLlBsYXllci5wcmV2aW91c1RyYWNrKTtcclxuICAgICAgICAkKFwiLnNraXAtbmV4dFwiLCAkdWlbXCJub3ctcGxheWluZ1wiXSkub24oXCJjbGlja1wiLCBhcHAuUGxheWVyLm5leHRUcmFjayk7XHJcblxyXG4gICAgICAgIC8vIENsaXF1ZXMgbmEgbGluaGEgZG8gdGVtcG9cclxuICAgICAgICAkbnAudGltZWxpbmUub24oXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgbGV0IHdpZHRoID0gJChldmVudC5kZWxlZ2F0ZVRhcmdldCkud2lkdGgoKTtcclxuICAgICAgICAgICAgbGV0IHBvc2l0aW9uID0gZXZlbnQub2Zmc2V0WDtcclxuICAgICAgICAgICAgbGV0IHBlcmNlbnQgPSBwb3NpdGlvbiAvIHdpZHRoO1xyXG5cclxuICAgICAgICAgICAgbGV0IHBvc2l0aW9uX2luX3NlY29uZHMgPSAkcGxheWVyLmR1cmF0aW9uICogcGVyY2VudDtcclxuICAgICAgICAgICAgYXBwLlBsYXllci5za2lwVG9Qb3NpdGlvbihwb3NpdGlvbl9pbl9zZWNvbmRzKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQ2FycmVnYSBhIHByaW1laXJhIG3DunNpY2EgZGEgZmlsYVxyXG4gICAgICAgIGFwcC5QbGF5ZXIubG9hZChxdWV1ZVtxdWV1ZV9wb3NpdGlvbl0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gY29uc3QgdXBkYXRlVGltZWxpbmVcclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIGFwcC5QbGF5ZXIuc2tpcFRvUG9zaXRpb24oKVxyXG4gICAgY29uc3QgbG9hZCA9IChzb25nKSA9PiB7XHJcbiAgICAgICAgLy8gUGF1c2EgYSByZXByb2R1w6fDo28sIHJlc2V0YSBvIHRlbXBvIGUgY2FycmVnYSBhIG5vdmEgbcO6c2ljYVxyXG4gICAgICAgIGFwcC5QbGF5ZXIucGF1c2UoKTtcclxuICAgICAgICAkcGxheWVyLmN1cnJlbnRUaW1lID0gMDtcclxuICAgICAgICAkcGxheWVyLnNyYyA9IHNvbmdbXCJmaWxlXCJdO1xyXG5cclxuICAgICAgICAvLyBBdHVhbGl6YSBhcyBpbmZvcm1hw6fDtWVzIHNvYnJlIGEgbcO6c2ljYSBlbSByZXByb2R1w6fDo29cclxuICAgICAgICAkbnAuc29uZy50ZXh0KHNvbmdbXCJ0aXRsZVwiXSk7XHJcbiAgICAgICAgJG5wLmFydGlzdC50ZXh0KHNvbmdbXCJhcnRpc3RcIl0pO1xyXG4gICAgICAgICRucC5hbGJ1bS50ZXh0KHNvbmdbXCJhbGJ1bVwiXSk7XHJcbiAgICAgICAgJG5wLmNvdmVyLmNzcyhcImJhY2tncm91bmQtaW1hZ2VcIiwgXCJ1cmwoJ1wiICsgc29uZ1tcImNvdmVyXCJdICsgXCInKVwiKTtcclxuXHJcbiAgICAgICAgLy8gQXR1YWxpemEgZGFkb3MgZGEgTWVkaWEgU2Vzc2lvbiBBUElcclxuICAgICAgICBpZiAoXCJtZWRpYVNlc3Npb25cIiBpbiBuYXZpZ2F0b3IpIHtcclxuICAgICAgICAgICAgbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5tZXRhZGF0YSA9IG5ldyBNZWRpYU1ldGFkYXRhKHtcclxuICAgICAgICAgICAgICAgIFwidGl0bGVcIjogc29uZ1tcInRpdGxlXCJdLFxyXG4gICAgICAgICAgICAgICAgXCJhcnRpc3RcIjogc29uZ1tcImFydGlzdFwiXSxcclxuICAgICAgICAgICAgICAgIFwiYWxidW1cIjogc29uZ1tcImFsYnVtXCJdLFxyXG4gICAgICAgICAgICAgICAgXCJhcnR3b3JrXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic3JjXCI6IHNvbmdbXCJjb3ZlclwiXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzaXplc1wiOiBcIjUxMng1MTJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiaW1hZ2UvcG5nXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSW5pY2lhIGEgcmVwcm9kdcOnw6NvXHJcbiAgICAgICAgYXBwLlBsYXllci5wbGF5KCk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIGFwcC5QbGF5ZXIuc2tpcFRvUG9zaXRpb24oKVxyXG4gICAgY29uc3Qgc2tpcFRvUG9zaXRpb24gPSAoc2Vjb25kcykgPT4ge1xyXG4gICAgICAgICRwbGF5ZXIuY3VycmVudFRpbWUgPSBzZWNvbmRzO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuUGxheWVyLnBsYXkoKVxyXG4gICAgY29uc3QgcGxheSA9ICgpID0+IHtcclxuICAgICAgICAkcGxheWVyLnBsYXkoKTtcclxuICAgICAgICAkbnAucmVtb3ZlQ2xhc3MoXCItc3RhdGUtLXBhdXNlZFwiKS5hZGRDbGFzcyhcIi1zdGF0ZS0tcGxheWluZ1wiKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLlBsYXllci5wYXVzZSgpXHJcbiAgICBjb25zdCBwYXVzZSA9ICgpID0+IHtcclxuICAgICAgICAkcGxheWVyLnBhdXNlKCk7XHJcbiAgICAgICAgJG5wLnJlbW92ZUNsYXNzKFwiLXN0YXRlLS1wbGF5aW5nXCIpLmFkZENsYXNzKFwiLXN0YXRlLS1wYXVzZWRcIik7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIGFwcC5QbGF5ZXIucGxheVBhdXNlKClcclxuICAgIGNvbnN0IHBsYXlQYXVzZSA9ICgpID0+IHtcclxuICAgICAgICBpZiAoJHBsYXllci5wYXVzZWQpIHtcclxuICAgICAgICAgICAgYXBwLlBsYXllci5wbGF5KCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYXBwLlBsYXllci5wYXVzZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJkdXJhdGlvblwiLCAkcGxheWVyLmR1cmF0aW9uKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcInZvbHVtZVwiLCAkcGxheWVyLnZvbHVtZSk7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiYnVmZmVyZWRcIiwgJHBsYXllci5idWZmZXJlZCk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJuZXR3b3JrU3RhdGVcIiwgJHBsYXllci5uZXR3b3JrU3RhdGUpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwicGxheWVkXCIsICRwbGF5ZXIucGxheWVkKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcInJlYWR5U3RhdGVcIiwgJHBsYXllci5yZWFkeVN0YXRlKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcInNlZWthYmxlXCIsICRwbGF5ZXIuc2Vla2FibGUpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuUGxheWVyLnByZXZpb3VzVHJhY2soKVxyXG4gICAgY29uc3QgcHJldmlvdXNUcmFjayA9ICgpID0+IHtcclxuICAgICAgICAvLyBTZSB0aXZlciBhcMOzcyBvcyA1IHNlZ3VuZG9zIGRhIG3DunNpY2EgYXR1YWwsIHZvbHRhIHBhcmEgbyBjb21lw6dvXHJcbiAgICAgICAgaWYgKCRwbGF5ZXIuY3VycmVudFRpbWUgPiA1KSB7XHJcbiAgICAgICAgICAgICRwbGF5ZXIuY3VycmVudFRpbWUgPSAwO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHF1ZXVlX3Bvc2l0aW9uID0gKHF1ZXVlX3Bvc2l0aW9uIC0gMSArIHF1ZXVlLmxlbmd0aCkgJSBxdWV1ZS5sZW5ndGg7XHJcbiAgICAgICAgICAgIGFwcC5QbGF5ZXIubG9hZChxdWV1ZVtxdWV1ZV9wb3NpdGlvbl0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLlBsYXllci5uZXh0VHJhY2soKVxyXG4gICAgY29uc3QgbmV4dFRyYWNrID0gKCkgPT4ge1xyXG4gICAgICAgIHF1ZXVlX3Bvc2l0aW9uID0gKHF1ZXVlX3Bvc2l0aW9uICsgMSkgJSBxdWV1ZS5sZW5ndGg7XHJcbiAgICAgICAgYXBwLlBsYXllci5sb2FkKHF1ZXVlW3F1ZXVlX3Bvc2l0aW9uXSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGxvYWQsXHJcbiAgICAgICAgc2tpcFRvUG9zaXRpb24sXHJcbiAgICAgICAgcGxheSxcclxuICAgICAgICBwYXVzZSxcclxuICAgICAgICBwbGF5UGF1c2UsXHJcbiAgICAgICAgcHJldmlvdXNUcmFjayxcclxuICAgICAgICBuZXh0VHJhY2tcclxuICAgIH07XHJcbn0pKCk7XHJcblxyXG5pZiAoXCJtZWRpYVNlc3Npb25cIiBpbiBuYXZpZ2F0b3IpIHtcclxuICAgIG5hdmlnYXRvci5tZWRpYVNlc3Npb24uc2V0QWN0aW9uSGFuZGxlcihcInBsYXlcIiwgYXBwLlBsYXllci5wbGF5KTtcclxuICAgIG5hdmlnYXRvci5tZWRpYVNlc3Npb24uc2V0QWN0aW9uSGFuZGxlcihcInBhdXNlXCIsIGFwcC5QbGF5ZXIucGF1c2UpO1xyXG4gICAgLy8gbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5zZXRBY3Rpb25IYW5kbGVyKFwic2Vla2JhY2t3YXJkXCIsIGZ1bmN0aW9uICgpIHsgfSk7XHJcbiAgICAvLyBuYXZpZ2F0b3IubWVkaWFTZXNzaW9uLnNldEFjdGlvbkhhbmRsZXIoXCJzZWVrZm9yd2FyZFwiLCBmdW5jdGlvbiAoKSB7IH0pO1xyXG4gICAgbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5zZXRBY3Rpb25IYW5kbGVyKFwicHJldmlvdXN0cmFja1wiLCBhcHAuUGxheWVyLnByZXZpb3VzVHJhY2spO1xyXG4gICAgbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5zZXRBY3Rpb25IYW5kbGVyKFwibmV4dHRyYWNrXCIsIGFwcC5QbGF5ZXIubmV4dFRyYWNrKTtcclxufVxyXG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIGFydGlzdCAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuYXBwLkFydGlzdCA9ICgoKSA9PiB7XHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuQXJ0aXN0LmxvYWQoKVxyXG4gICAgY29uc3QgbG9hZCA9IChhcnRpc3RfaWQpID0+IHtcclxuICAgICAgICAkLmdldChcImRhdGEvYXJ0aXN0cy9cIiArIGFydGlzdF9pZCArIFwiLmpzb25cIikuZG9uZSgocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgbGV0IGFydGlzdCA9IHJlc3BvbnNlO1xyXG4gICAgICAgICAgICBsZXQgJGFydGlzdCA9IF9fcmVuZGVyKFwiYXJ0aXN0XCIsIGFydGlzdCk7XHJcblxyXG4gICAgICAgICAgICAvLyDDgWxidW5zXHJcbiAgICAgICAgICAgIGxldCBhbGJ1bXMgPSBhcnRpc3RbXCJhbGJ1bXNcIl07XHJcbiAgICAgICAgICAgIGxldCAkYWxidW1zID0gJChcIi5hbGJ1bXNcIiwgJGFydGlzdCk7XHJcblxyXG4gICAgICAgICAgICBhbGJ1bXMuZm9yRWFjaCgoYWxidW0pID0+IHtcclxuICAgICAgICAgICAgICAgIGFsYnVtW1wiY292ZXItYXJ0XCJdID0gXCJiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJ1wiICsgYWxidW1bXCJjb3ZlclwiXSArIFwiJylcIjtcclxuICAgICAgICAgICAgICAgIGxldCAkYWxidW0gPSBfX3JlbmRlcihcImFydGlzdC1hbGJ1bVwiLCBhbGJ1bSkuYXBwZW5kVG8oJGFsYnVtcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gSGl0c1xyXG4gICAgICAgICAgICBsZXQgaGl0cyA9IGFydGlzdFtcImhpdHNcIl07XHJcbiAgICAgICAgICAgIGxldCAkaGl0cyA9ICQoXCIuaGl0c1wiLCAkYXJ0aXN0KTtcclxuXHJcbiAgICAgICAgICAgIGhpdHMuZm9yRWFjaCgoaGl0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBoaXRbXCJmb3JtYXR0ZWQtbGVuZ3RoXCJdID0gZHVyYXRpb24oaGl0W1wibGVuZ3RoXCJdKTtcclxuICAgICAgICAgICAgICAgIGxldCAkaGl0ID0gX19yZW5kZXIoXCJhcnRpc3QtaGl0XCIsIGhpdCkuYXBwZW5kVG8oJGhpdHMpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIENvbG9jYSBuYSB0ZWxhXHJcbiAgICAgICAgICAgICR1aVtcImxpYnJhcnlcIl0uZW1wdHkoKS5hcHBlbmQoJGFydGlzdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGxvYWRcclxuICAgIH07XHJcbn0pKCk7XHJcbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gY29tbWFuZHMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG5sZXQgY29tbWFuZHMgPSBbXHJcbiAgICB7XHJcbiAgICAgICAgXCJ0aXRsZVwiOiBcIlBsYXkvUGF1c2VcIixcclxuICAgICAgICBcInNob3J0Y3V0XCI6IFtcImtcIiwgXCJzcGFjZVwiXSxcclxuICAgICAgICBcImZ1bmN0aW9uXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgYXBwLlBsYXllci5wbGF5UGF1c2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwidGl0bGVcIjogXCJNw7pzaWNhIGFudGVyaW9yXCIsXHJcbiAgICAgICAgXCJzaG9ydGN1dFwiOiBbXCIsXCJdLFxyXG4gICAgICAgIFwiZnVuY3Rpb25cIjogKCkgPT4ge1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLnByZXZpb3VzVHJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwidGl0bGVcIjogXCJQcsOzeGltYSBtw7pzaWNhXCIsXHJcbiAgICAgICAgXCJzaG9ydGN1dFwiOiBbXCIuXCJdLFxyXG4gICAgICAgIFwiZnVuY3Rpb25cIjogKCkgPT4ge1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLm5leHRUcmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXTtcclxuXHJcbmNvbW1hbmRzLmZvckVhY2goKGNvbW1hbmQpID0+IHtcclxuICAgIGNvbW1hbmRbXCJzaG9ydGN1dFwiXS5mb3JFYWNoKChzaG9ydGN1dCkgPT4ge1xyXG4gICAgICAgIE1vdXNldHJhcC5iaW5kKHNob3J0Y3V0LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbW1hbmRbXCJmdW5jdGlvblwiXSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG4vLyAtIEo6IHZvbHRhIDEwIHNlZ3VuZG9zXHJcbi8vIC0gTDogYXZhbsOnYSAxMCBzZWd1bmRvc1xyXG4vLyAtIFI6IHJlcGVhdFxyXG4vLyAtIFM6IHNodWZmbGVcclxuLy8gLSBNOiBtdWRvXHJcblxyXG4vLyAjIE5hdmVnYcOnw6NvXHJcbi8vIC0gZyBmOiBmYXZvcml0b3NcclxuLy8gLSBnIGw6IGJpYmxpb3RlY2FcclxuLy8gLSBnIHA6IHBsYXlsaXN0c1xyXG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIHN0YXJ0IC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuJChmdW5jdGlvbigpIHtcclxuICAgIGFwcC5BcnRpc3QubG9hZChcInRoZS1iZWF0bGVzXCIpO1xyXG59KTtcclxuIl19
