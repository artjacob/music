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
    Mousetrap.bind(shortcut, command["function"]);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhc2UuanMiLCJ0ZW1wbGF0ZS1lbmdpbmUuanMiLCJwbGF5ZXIuanMiLCJhcnRpc3QuanMiLCJjb21tYW5kcy5qcyIsInN0YXJ0LmpzIl0sIm5hbWVzIjpbImFwcCIsInVpIiwiJHVpIiwiY3VlIiwiJCIsImR1cmF0aW9uIiwic2Vjb25kcyIsIm1vbWVudCIsInV0YyIsImFzTWlsbGlzZWNvbmRzIiwiZm9ybWF0IiwidGVtcGxhdGUiLCIkdGVtcGxhdGVzIiwiZWFjaCIsIiR0aGlzIiwibmFtZSIsImF0dHIiLCJodG1sIiwicmVtb3ZlIiwicmVuZGVyIiwiZGF0YSIsIiRyZW5kZXIiLCJjbG9uZSIsImZuIiwiZmlsbEJsYW5rcyIsIiRibGFuayIsImZpbGwiLCJydWxlcyIsInNwbGl0IiwiaSIsImxlbmd0aCIsInBhaXIiLCJkZXN0IiwidHJpbSIsInNvdXJjZSIsInZhbHVlIiwiaiIsImFkZENsYXNzIiwidmFsIiwiaWZfbnVsbCIsImhpZGUiLCJyZW1vdmVDbGFzcyIsInJlbW92ZUF0dHIiLCJoYXNDbGFzcyIsIl9fcmVuZGVyIiwicXVldWUiLCIkbnAiLCIkcGxheWVyIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiUGxheWVyIiwicXVldWVfcG9zaXRpb24iLCJhZGRFdmVudExpc3RlbmVyIiwidGV4dCIsInBvc2l0aW9uIiwiY3VycmVudFRpbWUiLCJwZXJjZW50IiwiZWxhcHNlZCIsImNzcyIsIm5leHRUcmFjayIsInRpbWVsaW5lIiwic29uZyIsImFydGlzdCIsImFsYnVtIiwiY292ZXIiLCJvbiIsInBsYXlQYXVzZSIsInByZXZpb3VzVHJhY2siLCJldmVudCIsIndpZHRoIiwiZGVsZWdhdGVUYXJnZXQiLCJvZmZzZXRYIiwicG9zaXRpb25faW5fc2Vjb25kcyIsInNraXBUb1Bvc2l0aW9uIiwibG9hZCIsInBhdXNlIiwic3JjIiwibmF2aWdhdG9yIiwibWVkaWFTZXNzaW9uIiwibWV0YWRhdGEiLCJNZWRpYU1ldGFkYXRhIiwicGxheSIsInBhdXNlZCIsInNldEFjdGlvbkhhbmRsZXIiLCJBcnRpc3QiLCJhcnRpc3RfaWQiLCJnZXQiLCJkb25lIiwicmVzcG9uc2UiLCIkYXJ0aXN0IiwiYWxidW1zIiwiJGFsYnVtcyIsImZvckVhY2giLCIkYWxidW0iLCJhcHBlbmRUbyIsImhpdHMiLCIkaGl0cyIsImhpdCIsIiRoaXQiLCJlbXB0eSIsImFwcGVuZCIsImNvbW1hbmRzIiwiY29tbWFuZCIsInNob3J0Y3V0IiwiTW91c2V0cmFwIiwiYmluZCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFFQSxJQUFBQSxHQUFBLEdBQUEsRUFBQTtBQUVBLElBQUFDLEVBQUEsR0FBQSxFQUFBO0FBQ0EsSUFBQUMsR0FBQSxHQUFBLEVBQUE7QUFFQSxJQUFBQyxHQUFBLEdBQUEsRUFBQSxDLENBS0E7O0FBQ0FDLENBQUEsQ0FBQSxZQUFBO0FBQ0FGLEVBQUFBLEdBQUEsQ0FBQSxTQUFBLENBQUEsR0FBQUUsQ0FBQSxDQUFBLFVBQUEsQ0FBQTtBQUNBLENBRkEsQ0FBQTs7QUFJQSxJQUFBQyxRQUFBLEdBQUEsU0FBQUEsUUFBQSxDQUFBQyxPQUFBLEVBQUE7QUFDQSxTQUFBQyxNQUFBLENBQUFDLEdBQUEsQ0FBQUQsTUFBQSxDQUFBRixRQUFBLENBQUFDLE9BQUEsRUFBQSxTQUFBLEVBQUFHLGNBQUEsRUFBQSxFQUFBQyxNQUFBLENBQUEsTUFBQSxDQUFBO0FBQ0EsQ0FGQSxDLENDbkJBO0FBQ0E7QUFDQTs7O0FBRUFULEVBQUEsQ0FBQVUsUUFBQSxHQUFBLFlBQUE7QUFDQSxNQUFBQyxVQUFBLEdBQUEsRUFBQTtBQUVBUixFQUFBQSxDQUFBLENBQUEsWUFBQTtBQUNBQSxJQUFBQSxDQUFBLENBQUEsVUFBQSxDQUFBLENBQUFTLElBQUEsQ0FBQSxZQUFBO0FBQ0EsVUFBQUMsS0FBQSxHQUFBVixDQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsVUFBQVcsSUFBQSxHQUFBRCxLQUFBLENBQUFFLElBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxVQUFBQyxJQUFBLEdBQUFILEtBQUEsQ0FBQUcsSUFBQSxFQUFBO0FBRUFMLE1BQUFBLFVBQUEsQ0FBQUcsSUFBQSxDQUFBLEdBQUFYLENBQUEsQ0FBQWEsSUFBQSxDQUFBO0FBQ0FILE1BQUFBLEtBQUEsQ0FBQUksTUFBQTtBQUNBLEtBUEE7QUFRQSxHQVRBLENBQUE7O0FBV0EsTUFBQUMsTUFBQSxHQUFBLFNBQUFBLE1BQUEsQ0FBQVIsUUFBQSxFQUFBUyxJQUFBLEVBQUE7QUFDQSxRQUFBLENBQUFSLFVBQUEsQ0FBQUQsUUFBQSxDQUFBLEVBQUE7QUFBQSxhQUFBLEtBQUE7QUFBQTs7QUFDQSxRQUFBVSxPQUFBLEdBQUFULFVBQUEsQ0FBQUQsUUFBQSxDQUFBLENBQUFXLEtBQUEsRUFBQTtBQUVBRCxJQUFBQSxPQUFBLENBQUFELElBQUEsQ0FBQUEsSUFBQTs7QUFFQWhCLElBQUFBLENBQUEsQ0FBQW1CLEVBQUEsQ0FBQUMsVUFBQSxHQUFBLFlBQUE7QUFDQSxVQUFBQyxNQUFBLEdBQUFyQixDQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsVUFBQXNCLElBQUEsR0FBQUQsTUFBQSxDQUFBTCxJQUFBLENBQUEsTUFBQSxDQUFBO0FBRUEsVUFBQU8sS0FBQSxHQUFBRCxJQUFBLENBQUFFLEtBQUEsQ0FBQSxHQUFBLENBQUE7O0FBQ0EsV0FBQSxJQUFBQyxDQUFBLEdBQUEsQ0FBQSxFQUFBQSxDQUFBLEdBQUFGLEtBQUEsQ0FBQUcsTUFBQSxFQUFBRCxDQUFBLEVBQUEsRUFBQTtBQUNBLFlBQUFFLElBQUEsR0FBQUosS0FBQSxDQUFBRSxDQUFBLENBQUEsQ0FBQUQsS0FBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLFlBQUFJLElBQUEsR0FBQUQsSUFBQSxDQUFBLENBQUEsQ0FBQSxHQUFBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLENBQUFFLElBQUEsRUFBQSxHQUFBLE1BQUE7QUFDQSxZQUFBQyxNQUFBLEdBQUFILElBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBRSxJQUFBLEVBQUEs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QUFpQixhQUFBO0FBQ0E7QUFMQSxDQVJBLEVBZUE7QUFDQSxXQUFBLGdCQURBO0FBRUEsY0FBQSxDQUFBLEdBQUEsQ0FGQTtBQUdBLGNBQUEscUJBQUE7QUFDQW5FLElBQUFBLEdBQUEsQ0FBQWtELE1BQUEsQ0FBQVMsU0FBQTtBQUNBO0FBTEEsQ0FmQSxDQUFBO0FBd0JBMEMsUUFBQSxDQUFBVCxPQUFBLENBQUEsVUFBQVUsT0FBQSxFQUFBO0FBQ0FBLEVBQUFBLE9BQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQVYsT0FBQSxDQUFBLFVBQUFXLFFBQUEsRUFBQTtBQUNBQyxJQUFBQSxTQUFBLENBQUFDLElBQUEsQ0FBQUYsUUFBQSxFQUFBRCxPQUFBLENBQUEsVUFBQSxDQUFBO0FBQ0EsR0FGQTtBQUdBLENBSkEsRSxDQU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7O0FBRUFsRyxDQUFBLENBQUEsWUFBQTtBQUNBSixFQUFBQSxHQUFBLENBQUFvRixNQUFBLENBQUFWLElBQUEsQ0FBQSxhQUFBO0FBQ0EsQ0FGQSxDQUFBIiwiZmlsZSI6Im11c2ljLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBiYXNlIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbmxldCBhcHAgPSB7IH07XHJcblxyXG5sZXQgdWkgPSB7IH07XHJcbmxldCAkdWkgPSB7IH07XHJcblxyXG5sZXQgY3VlID0geyB9O1xyXG5cclxuXHJcblxyXG5cclxuLy8gVE9ETzogbW92ZXIgcGFyYSBsdWdhciBhcHJvcHJpYWRvXHJcbiQoZnVuY3Rpb24oKSB7XHJcbiAgICAkdWlbXCJsaWJyYXJ5XCJdID0gJChcIi5saWJyYXJ5XCIpO1xyXG59KTtcclxuXHJcbmNvbnN0IGR1cmF0aW9uID0gKHNlY29uZHMpID0+IHtcclxuICAgIHJldHVybiBtb21lbnQudXRjKG1vbWVudC5kdXJhdGlvbihzZWNvbmRzLCBcInNlY29uZHNcIikuYXNNaWxsaXNlY29uZHMoKSkuZm9ybWF0KFwibTpzc1wiKTtcclxufTtcclxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBjb3JlIC8gdGVtcGxhdGUgZW5naW5lIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbnVpLnRlbXBsYXRlID0gKCgpID0+IHtcclxuICAgIGxldCAkdGVtcGxhdGVzID0geyB9O1xyXG5cclxuICAgICQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQoXCJ0ZW1wbGF0ZVwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSAkdGhpcy5hdHRyKFwiaWRcIik7XHJcbiAgICAgICAgICAgIHZhciBodG1sID0gJHRoaXMuaHRtbCgpO1xyXG5cclxuICAgICAgICAgICAgJHRlbXBsYXRlc1tuYW1lXSA9ICQoaHRtbCk7XHJcbiAgICAgICAgICAgICR0aGlzLnJlbW92ZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgcmVuZGVyID0gKHRlbXBsYXRlLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgaWYgKCEkdGVtcGxhdGVzW3RlbXBsYXRlXSkgeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICB2YXIgJHJlbmRlciA9ICR0ZW1wbGF0ZXNbdGVtcGxhdGVdLmNsb25lKCk7XHJcblxyXG4gICAgICAgICRyZW5kZXIuZGF0YShkYXRhKTtcclxuXHJcbiAgICAgICAgJC5mbi5maWxsQmxhbmtzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJGJsYW5rID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgdmFyIGZpbGwgPSAkYmxhbmsuZGF0YShcImZpbGxcIik7XHJcblxyXG4gICAgICAgICAgICB2YXIgcnVsZXMgPSBmaWxsLnNwbGl0KFwiLFwiKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhaXIgPSBydWxlc1tpXS5zcGxpdChcIjpcIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGVzdCA9IChwYWlyWzFdID8gcGFpclswXS50cmltKCkgOiBcImh0bWxcIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlID0gKHBhaXJbMV0gPyBwYWlyWzFdLnRyaW0oKSA6IHBhaXJbMF0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtzb3VyY2VdO1xyXG5cclxuICAgICAgICAgICAgICAgIHNvdXJjZSA9IHNvdXJjZS5zcGxpdChcIi9cIik7XHJcbiAgICAgICAgICAgICAgICBpZiAoc291cmNlLmxlbmd0aCA+IDEgJiYgdHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkYXRhW3NvdXJjZVswXV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAxOyBqIDwgc291cmNlLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gKHZhbHVlW3NvdXJjZVtqXV0pID8gdmFsdWVbc291cmNlW2pdXSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIgJiYgdmFsdWUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGVzdCA9PT0gXCJjbGFzc1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRibGFuay5hZGRDbGFzcyh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkZXN0ID09PSBcImh0bWxcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsuaHRtbCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkZXN0ID09PSBcInZhbHVlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLnZhbCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLmF0dHIoZGVzdCwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlmX251bGwgPSAkYmxhbmsuZGF0YShcImZpbGwtbnVsbFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaWZfbnVsbCA9PT0gXCJoaWRlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlmX251bGwgPT09IFwicmVtb3ZlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgJGJsYW5rXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoXCJmaWxsXCIpXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlQXR0cihcImRhdGEtZmlsbFwiKVxyXG4gICAgICAgICAgICAgICAgLnJlbW92ZUF0dHIoXCJkYXRhLWZpbGwtbnVsbFwiKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoJHJlbmRlci5oYXNDbGFzcyhcImZpbGxcIikpIHtcclxuICAgICAgICAgICAgJHJlbmRlci5maWxsQmxhbmtzKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkKFwiLmZpbGxcIiwgJHJlbmRlcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQodGhpcykuZmlsbEJsYW5rcygpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gJHJlbmRlcjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlbmRlclxyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmxldCBfX3JlbmRlciA9IHVpLnRlbXBsYXRlLnJlbmRlcjtcclxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBwbGF5ZXIgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbmxldCBxdWV1ZSA9IFtcclxuICAgIHtcclxuICAgICAgICBcInRpdGxlXCI6IFwiQ2FwdGFpbiBDYWx2aW4gKE9yaWdpbmFsIE1peClcIixcclxuICAgICAgICBcImFydGlzdFwiOiBcIkxvdWtcIixcclxuICAgICAgICBcImFsYnVtXCI6IFwiQ2hpbGxob3AgRXNzZW50aWFscyBXaW50ZXIgMjAxOFwiLFxyXG4gICAgICAgIFwibGVuZ3RoXCI6IDE0MCxcclxuICAgICAgICBcImNvdmVyXCI6IFwiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL0pKQUswbVhfcDVLTGY5X2VmU0VyN2wybzJvQUd5Q243YjgtcE9zZnA4X2pmMDJ1dkpVSUoxcER0RFp4MUpzSkFmTTVZT2UyQklFQVwiLFxyXG4gICAgICAgIFwiZmlsZVwiOiBcIi9kYXRhL2ZpbGVzLzE0IENhcHRhaW4gQ2FsdmluIChPcmlnaW5hbCBNaXgpLm1wM1wiXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwidGl0bGVcIjogXCJUaWNvIFRpY29cIixcclxuICAgICAgICBcImFydGlzdFwiOiBcIk9zY2FyIFBldGVyc29uXCIsXHJcbiAgICAgICAgXCJhbGJ1bVwiOiBcIlVsdGltYXRlIEphenogQ29sbGVjdGlvbnNcIixcclxuICAgICAgICBcImxlbmd0aFwiOiAxODAsXHJcbiAgICAgICAgXCJjb3ZlclwiOiBcImh0dHBzOi8vbGg1LmdncGh0LmNvbS9od0VLTUl0S3lGeUhJZ05sMjhDZmJCci1SWUx2TmhEVWpfU0ZlNzU3bV9nSDJ5TnNvUlhZbVhnV0kwMnRrQW9WTEtDTklpaGJcIixcclxuICAgICAgICBcImZpbGVcIjogXCIvZGF0YS9maWxlcy8zMCBUaWNvIFRpY28ubTRhXCJcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJ0aXRsZVwiOiBcIkEgSGF6eSBTaGFkZSBvZiBXaW50ZXJcIixcclxuICAgICAgICBcImFydGlzdFwiOiBcIlNpbW9uICYgR2FyZnVua2VsXCIsXHJcbiAgICAgICAgXCJhbGJ1bVwiOiBcIkJvb2tlbmRzXCIsXHJcbiAgICAgICAgXCJsZW5ndGhcIjogMTM3LFxyXG4gICAgICAgIFwiY292ZXJcIjogXCJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vbWZjblpNcHFZaTJPSXNscjlVNTZQZWNKeXRQMmpRQWo5QmNPZng3bUVrQ0NCVFJJNFZ4cHd6VmU1R3VyX3FTNVhrMWtSbGk1Z1FcIixcclxuICAgICAgICBcImZpbGVcIjogXCIvZGF0YS9maWxlcy8xMSBBIEhhenkgU2hhZGUgb2YgV2ludGVyLm00YVwiXHJcbiAgICB9XHJcbl07XHJcblxyXG5sZXQgJG5wO1xyXG5sZXQgJHBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhdWRpb1wiKTtcclxuXHJcbmFwcC5QbGF5ZXIgPSAoKCkgPT4ge1xyXG4gICAgbGV0IHF1ZXVlX3Bvc2l0aW9uID0gMDtcclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIEV2ZW50b3NcclxuXHJcbiAgICAvLyBEZWZpbmUgbyB0ZW1wbyBkZSBkdXJhw6fDo28gcXVhbmRvIHVtYSBtw7pzaWNhIMOpIGNhcnJlZ2FkYSBtw7pzaWNhXHJcbiAgICAkcGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkZWRtZXRhZGF0YVwiLCAoKSA9PiB7XHJcbiAgICAgICAgbGV0IGxlbmd0aCA9IGR1cmF0aW9uKCRwbGF5ZXIuZHVyYXRpb24pO1xyXG4gICAgICAgICRucC5sZW5ndGgudGV4dChsZW5ndGgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQXR1YWxpemEgYmFycmEgZGUgdGVtcG9cclxuICAgICRwbGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRpbWV1cGRhdGVcIiwgKCkgPT4ge1xyXG4gICAgICAgIGxldCBwb3NpdGlvbiA9IGR1cmF0aW9uKCRwbGF5ZXIuY3VycmVudFRpbWUpO1xyXG4gICAgICAgICRucC5wb3NpdGlvbi50ZXh0KHBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgbGV0IHBlcmNlbnQgPSAkcGxheWVyLmN1cnJlbnRUaW1lIC8gJHBsYXllci5kdXJhdGlvbiAqIDEwMDtcclxuICAgICAgICAkbnAuZWxhcHNlZC5jc3MoXCJ3aWR0aFwiLCBwZXJjZW50ICsgXCIlXCIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUGFzc2EgcGFyYSBwcsOzeGltYSBtw7pzaWNhIHF1YW5kbyBhIGF0dWFsIGNoZWdhIGFvIGZpbVxyXG4gICAgJHBsYXllci5hZGRFdmVudExpc3RlbmVyKFwiZW5kZWRcIiwgKCkgPT4ge1xyXG4gICAgICAgIGFwcC5QbGF5ZXIubmV4dFRyYWNrKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbiAgICAkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICRucCA9ICQoXCIubm93LXBsYXlpbmdcIik7XHJcbiAgICAgICAgJG5wLnBvc2l0aW9uID0gJChcIi5ub3ctcGxheWluZyAucG9zaXRpb25cIik7XHJcbiAgICAgICAgJG5wLmxlbmd0aCA9ICQoXCIubm93LXBsYXlpbmcgLmxlbmd0aFwiKTtcclxuICAgICAgICAkbnAudGltZWxpbmUgPSAkKFwiLm5vdy1wbGF5aW5nIC5iYXJcIik7XHJcbiAgICAgICAgJG5wLmVsYXBzZWQgPSAkKFwiLm5vdy1wbGF5aW5nIC5lbGFwc2VkXCIpO1xyXG5cclxuICAgICAgICAkbnAuc29uZyA9ICQoXCIubm93LXBsYXlpbmcgLnNvbmdcIik7XHJcbiAgICAgICAgJG5wLmFydGlzdCA9ICQoXCIubm93LXBsYXlpbmcgLmFydGlzdFwiKTtcclxuICAgICAgICAkbnAuYWxidW0gPSAkKFwiLm5vdy1wbGF5aW5nIC5hbGJ1bVwiKTtcclxuICAgICAgICAkbnAuY292ZXIgPSAkKFwiLm5vdy1wbGF5aW5nIC5jb3ZlclwiKTtcclxuXHJcbiAgICAgICAgJHVpW1wibm93LXBsYXlpbmdcIl0gPSAkKFwiLm5vdy1wbGF5aW5nXCIpO1xyXG4gICAgICAgICQoXCIucGxheS1wYXVzZVwiLCAkdWlbXCJub3ctcGxheWluZ1wiXSkub24oXCJjbGlja1wiLCBhcHAuUGxheWVyLnBsYXlQYXVzZSk7XHJcbiAgICAgICAgJChcIi5za2lwLXByZXZpb3VzXCIsICR1aVtcIm5vdy1wbGF5aW5nXCJdKS5vbihcImNsaWNrXCIsIGFwcC5QbGF5ZXIucHJldmlvdXNUcmFjayk7XHJcbiAgICAgICAgJChcIi5za2lwLW5leHRcIiwgJHVpW1wibm93LXBsYXlpbmdcIl0pLm9uKFwiY2xpY2tcIiwgYXBwLlBsYXllci5uZXh0VHJhY2spO1xyXG5cclxuICAgICAgICAvLyBDbGlxdWVzIG5hIGxpbmhhIGRvIHRlbXBvXHJcbiAgICAgICAgJG5wLnRpbWVsaW5lLm9uKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB3aWR0aCA9ICQoZXZlbnQuZGVsZWdhdGVUYXJnZXQpLndpZHRoKCk7XHJcbiAgICAgICAgICAgIGxldCBwb3NpdGlvbiA9IGV2ZW50Lm9mZnNldFg7XHJcbiAgICAgICAgICAgIGxldCBwZXJjZW50ID0gcG9zaXRpb24gLyB3aWR0aDtcclxuXHJcbiAgICAgICAgICAgIGxldCBwb3NpdGlvbl9pbl9zZWNvbmRzID0gJHBsYXllci5kdXJhdGlvbiAqIHBlcmNlbnQ7XHJcbiAgICAgICAgICAgIGFwcC5QbGF5ZXIuc2tpcFRvUG9zaXRpb24ocG9zaXRpb25faW5fc2Vjb25kcyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIENhcnJlZ2EgYSBwcmltZWlyYSBtw7pzaWNhIGRhIGZpbGFcclxuICAgICAgICBhcHAuUGxheWVyLmxvYWQocXVldWVbcXVldWVfcG9zaXRpb25dKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIGNvbnN0IHVwZGF0ZVRpbWVsaW5lXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuUGxheWVyLnNraXBUb1Bvc2l0aW9uKClcclxuICAgIGNvbnN0IGxvYWQgPSAoc29uZykgPT4ge1xyXG4gICAgICAgIC8vIFBhdXNhIGEgcmVwcm9kdcOnw6NvLCByZXNldGEgbyB0ZW1wbyBlIGNhcnJlZ2EgYSBub3ZhIG3DunNpY2FcclxuICAgICAgICBhcHAuUGxheWVyLnBhdXNlKCk7XHJcbiAgICAgICAgJHBsYXllci5jdXJyZW50VGltZSA9IDA7XHJcbiAgICAgICAgJHBsYXllci5zcmMgPSBzb25nW1wiZmlsZVwiXTtcclxuXHJcbiAgICAgICAgLy8gQXR1YWxpemEgYXMgaW5mb3JtYcOnw7VlcyBzb2JyZSBhIG3DunNpY2EgZW0gcmVwcm9kdcOnw6NvXHJcbiAgICAgICAgJG5wLnNvbmcudGV4dChzb25nW1widGl0bGVcIl0pO1xyXG4gICAgICAgICRucC5hcnRpc3QudGV4dChzb25nW1wiYXJ0aXN0XCJdKTtcclxuICAgICAgICAkbnAuYWxidW0udGV4dChzb25nW1wiYWxidW1cIl0pO1xyXG4gICAgICAgICRucC5jb3Zlci5jc3MoXCJiYWNrZ3JvdW5kLWltYWdlXCIsIFwidXJsKCdcIiArIHNvbmdbXCJjb3ZlclwiXSArIFwiJylcIik7XHJcblxyXG4gICAgICAgIC8vIEF0dWFsaXphIGRhZG9zIGRhIE1lZGlhIFNlc3Npb24gQVBJXHJcbiAgICAgICAgaWYgKFwibWVkaWFTZXNzaW9uXCIgaW4gbmF2aWdhdG9yKSB7XHJcbiAgICAgICAgICAgIG5hdmlnYXRvci5tZWRpYVNlc3Npb24ubWV0YWRhdGEgPSBuZXcgTWVkaWFNZXRhZGF0YSh7XHJcbiAgICAgICAgICAgICAgICBcInRpdGxlXCI6IHNvbmdbXCJ0aXRsZVwiXSxcclxuICAgICAgICAgICAgICAgIFwiYXJ0aXN0XCI6IHNvbmdbXCJhcnRpc3RcIl0sXHJcbiAgICAgICAgICAgICAgICBcImFsYnVtXCI6IHNvbmdbXCJhbGJ1bVwiXSxcclxuICAgICAgICAgICAgICAgIFwiYXJ0d29ya1wiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInNyY1wiOiBzb25nW1wiY292ZXJcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic2l6ZXNcIjogXCI1MTJ4NTEyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImltYWdlL3BuZ1wiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEluaWNpYSBhIHJlcHJvZHXDp8Ojb1xyXG4gICAgICAgIGFwcC5QbGF5ZXIucGxheSgpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuUGxheWVyLnNraXBUb1Bvc2l0aW9uKClcclxuICAgIGNvbnN0IHNraXBUb1Bvc2l0aW9uID0gKHNlY29uZHMpID0+IHtcclxuICAgICAgICAkcGxheWVyLmN1cnJlbnRUaW1lID0gc2Vjb25kcztcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLlBsYXllci5wbGF5KClcclxuICAgIGNvbnN0IHBsYXkgPSAoKSA9PiB7XHJcbiAgICAgICAgJHBsYXllci5wbGF5KCk7XHJcbiAgICAgICAgJG5wLnJlbW92ZUNsYXNzKFwiLXN0YXRlLS1wYXVzZWRcIikuYWRkQ2xhc3MoXCItc3RhdGUtLXBsYXlpbmdcIik7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIGFwcC5QbGF5ZXIucGF1c2UoKVxyXG4gICAgY29uc3QgcGF1c2UgPSAoKSA9PiB7XHJcbiAgICAgICAgJHBsYXllci5wYXVzZSgpO1xyXG4gICAgICAgICRucC5yZW1vdmVDbGFzcyhcIi1zdGF0ZS0tcGxheWluZ1wiKS5hZGRDbGFzcyhcIi1zdGF0ZS0tcGF1c2VkXCIpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuUGxheWVyLnBsYXlQYXVzZSgpXHJcbiAgICBjb25zdCBwbGF5UGF1c2UgPSAoKSA9PiB7XHJcbiAgICAgICAgaWYgKCRwbGF5ZXIucGF1c2VkKSB7XHJcbiAgICAgICAgICAgIGFwcC5QbGF5ZXIucGxheSgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGFwcC5QbGF5ZXIucGF1c2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiZHVyYXRpb25cIiwgJHBsYXllci5kdXJhdGlvbik7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJ2b2x1bWVcIiwgJHBsYXllci52b2x1bWUpO1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImJ1ZmZlcmVkXCIsICRwbGF5ZXIuYnVmZmVyZWQpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwibmV0d29ya1N0YXRlXCIsICRwbGF5ZXIubmV0d29ya1N0YXRlKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcInBsYXllZFwiLCAkcGxheWVyLnBsYXllZCk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJyZWFkeVN0YXRlXCIsICRwbGF5ZXIucmVhZHlTdGF0ZSk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJzZWVrYWJsZVwiLCAkcGxheWVyLnNlZWthYmxlKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLlBsYXllci5wcmV2aW91c1RyYWNrKClcclxuICAgIGNvbnN0IHByZXZpb3VzVHJhY2sgPSAoKSA9PiB7XHJcbiAgICAgICAgLy8gU2UgdGl2ZXIgYXDDs3Mgb3MgNSBzZWd1bmRvcyBkYSBtw7pzaWNhIGF0dWFsLCB2b2x0YSBwYXJhIG8gY29tZcOnb1xyXG4gICAgICAgIGlmICgkcGxheWVyLmN1cnJlbnRUaW1lID4gNSkge1xyXG4gICAgICAgICAgICAkcGxheWVyLmN1cnJlbnRUaW1lID0gMDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBxdWV1ZV9wb3NpdGlvbiA9IChxdWV1ZV9wb3NpdGlvbiAtIDEgKyBxdWV1ZS5sZW5ndGgpICUgcXVldWUubGVuZ3RoO1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLmxvYWQocXVldWVbcXVldWVfcG9zaXRpb25dKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIGFwcC5QbGF5ZXIubmV4dFRyYWNrKClcclxuICAgIGNvbnN0IG5leHRUcmFjayA9ICgpID0+IHtcclxuICAgICAgICBxdWV1ZV9wb3NpdGlvbiA9IChxdWV1ZV9wb3NpdGlvbiArIDEpICUgcXVldWUubGVuZ3RoO1xyXG4gICAgICAgIGFwcC5QbGF5ZXIubG9hZChxdWV1ZVtxdWV1ZV9wb3NpdGlvbl0pO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBsb2FkLFxyXG4gICAgICAgIHNraXBUb1Bvc2l0aW9uLFxyXG4gICAgICAgIHBsYXksXHJcbiAgICAgICAgcGF1c2UsXHJcbiAgICAgICAgcGxheVBhdXNlLFxyXG4gICAgICAgIHByZXZpb3VzVHJhY2ssXHJcbiAgICAgICAgbmV4dFRyYWNrXHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuaWYgKFwibWVkaWFTZXNzaW9uXCIgaW4gbmF2aWdhdG9yKSB7XHJcbiAgICBuYXZpZ2F0b3IubWVkaWFTZXNzaW9uLnNldEFjdGlvbkhhbmRsZXIoXCJwbGF5XCIsIGFwcC5QbGF5ZXIucGxheSk7XHJcbiAgICBuYXZpZ2F0b3IubWVkaWFTZXNzaW9uLnNldEFjdGlvbkhhbmRsZXIoXCJwYXVzZVwiLCBhcHAuUGxheWVyLnBhdXNlKTtcclxuICAgIC8vIG5hdmlnYXRvci5tZWRpYVNlc3Npb24uc2V0QWN0aW9uSGFuZGxlcihcInNlZWtiYWNrd2FyZFwiLCBmdW5jdGlvbiAoKSB7IH0pO1xyXG4gICAgLy8gbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5zZXRBY3Rpb25IYW5kbGVyKFwic2Vla2ZvcndhcmRcIiwgZnVuY3Rpb24gKCkgeyB9KTtcclxuICAgIG5hdmlnYXRvci5tZWRpYVNlc3Npb24uc2V0QWN0aW9uSGFuZGxlcihcInByZXZpb3VzdHJhY2tcIiwgYXBwLlBsYXllci5wcmV2aW91c1RyYWNrKTtcclxuICAgIG5hdmlnYXRvci5tZWRpYVNlc3Npb24uc2V0QWN0aW9uSGFuZGxlcihcIm5leHR0cmFja1wiLCBhcHAuUGxheWVyLm5leHRUcmFjayk7XHJcbn1cclxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBhcnRpc3QgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbmFwcC5BcnRpc3QgPSAoKCkgPT4ge1xyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLkFydGlzdC5sb2FkKClcclxuICAgIGNvbnN0IGxvYWQgPSAoYXJ0aXN0X2lkKSA9PiB7XHJcbiAgICAgICAgJC5nZXQoXCJkYXRhL2FydGlzdHMvXCIgKyBhcnRpc3RfaWQgKyBcIi5qc29uXCIpLmRvbmUoKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBhcnRpc3QgPSByZXNwb25zZTtcclxuICAgICAgICAgICAgbGV0ICRhcnRpc3QgPSBfX3JlbmRlcihcImFydGlzdFwiLCBhcnRpc3QpO1xyXG5cclxuICAgICAgICAgICAgLy8gw4FsYnVuc1xyXG4gICAgICAgICAgICBsZXQgYWxidW1zID0gYXJ0aXN0W1wiYWxidW1zXCJdO1xyXG4gICAgICAgICAgICBsZXQgJGFsYnVtcyA9ICQoXCIuYWxidW1zXCIsICRhcnRpc3QpO1xyXG5cclxuICAgICAgICAgICAgYWxidW1zLmZvckVhY2goKGFsYnVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBhbGJ1bVtcImNvdmVyLWFydFwiXSA9IFwiYmFja2dyb3VuZC1pbWFnZTogdXJsKCdcIiArIGFsYnVtW1wiY292ZXJcIl0gKyBcIicpXCI7XHJcbiAgICAgICAgICAgICAgICBsZXQgJGFsYnVtID0gX19yZW5kZXIoXCJhcnRpc3QtYWxidW1cIiwgYWxidW0pLmFwcGVuZFRvKCRhbGJ1bXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIEhpdHNcclxuICAgICAgICAgICAgbGV0IGhpdHMgPSBhcnRpc3RbXCJoaXRzXCJdO1xyXG4gICAgICAgICAgICBsZXQgJGhpdHMgPSAkKFwiLmhpdHNcIiwgJGFydGlzdCk7XHJcblxyXG4gICAgICAgICAgICBoaXRzLmZvckVhY2goKGhpdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaGl0W1wiZm9ybWF0dGVkLWxlbmd0aFwiXSA9IGR1cmF0aW9uKGhpdFtcImxlbmd0aFwiXSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgJGhpdCA9IF9fcmVuZGVyKFwiYXJ0aXN0LWhpdFwiLCBoaXQpLmFwcGVuZFRvKCRoaXRzKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBDb2xvY2EgbmEgdGVsYVxyXG4gICAgICAgICAgICAkdWlbXCJsaWJyYXJ5XCJdLmVtcHR5KCkuYXBwZW5kKCRhcnRpc3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBsb2FkXHJcbiAgICB9O1xyXG59KSgpO1xyXG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIGNvbW1hbmRzIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxubGV0IGNvbW1hbmRzID0gW1xyXG4gICAge1xyXG4gICAgICAgIFwidGl0bGVcIjogXCJQbGF5L1BhdXNlXCIsXHJcbiAgICAgICAgXCJzaG9ydGN1dFwiOiBbXCJrXCIsIFwic3BhY2VcIl0sXHJcbiAgICAgICAgXCJmdW5jdGlvblwiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGFwcC5QbGF5ZXIucGxheVBhdXNlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcInRpdGxlXCI6IFwiTcO6c2ljYSBhbnRlcmlvclwiLFxyXG4gICAgICAgIFwic2hvcnRjdXRcIjogW1wiLFwiXSxcclxuICAgICAgICBcImZ1bmN0aW9uXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgYXBwLlBsYXllci5wcmV2aW91c1RyYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcInRpdGxlXCI6IFwiUHLDs3hpbWEgbcO6c2ljYVwiLFxyXG4gICAgICAgIFwic2hvcnRjdXRcIjogW1wiLlwiXSxcclxuICAgICAgICBcImZ1bmN0aW9uXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgYXBwLlBsYXllci5uZXh0VHJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbl07XHJcblxyXG5jb21tYW5kcy5mb3JFYWNoKChjb21tYW5kKSA9PiB7XHJcbiAgICBjb21tYW5kW1wic2hvcnRjdXRcIl0uZm9yRWFjaCgoc2hvcnRjdXQpID0+IHtcclxuICAgICAgICBNb3VzZXRyYXAuYmluZChzaG9ydGN1dCwgY29tbWFuZFtcImZ1bmN0aW9uXCJdKTtcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbi8vIC0gSjogdm9sdGEgMTAgc2VndW5kb3NcclxuLy8gLSBMOiBhdmFuw6dhIDEwIHNlZ3VuZG9zXHJcbi8vIC0gUjogcmVwZWF0XHJcbi8vIC0gUzogc2h1ZmZsZVxyXG4vLyAtIE06IG11ZG9cclxuXHJcbi8vICMgTmF2ZWdhw6fDo29cclxuLy8gLSBnIGY6IGZhdm9yaXRvc1xyXG4vLyAtIGcgbDogYmlibGlvdGVjYVxyXG4vLyAtIGcgcDogcGxheWxpc3RzXHJcbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gc3RhcnQgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4kKGZ1bmN0aW9uKCkge1xyXG4gICAgYXBwLkFydGlzdC5sb2FkKFwidGhlLWJlYXRsZXNcIik7XHJcbn0pO1xyXG4iXX0=
