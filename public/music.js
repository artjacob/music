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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhc2UuanMiLCJ0ZW1wbGF0ZS1lbmdpbmUuanMiLCJwbGF5ZXIuanMiLCJhcnRpc3QuanMiLCJjb21tYW5kcy5qcyIsInN0YXJ0LmpzIl0sIm5hbWVzIjpbImFwcCIsInVpIiwiJHVpIiwiY3VlIiwiJCIsImR1cmF0aW9uIiwic2Vjb25kcyIsIm1vbWVudCIsInV0YyIsImFzTWlsbGlzZWNvbmRzIiwiZm9ybWF0IiwidGVtcGxhdGUiLCIkdGVtcGxhdGVzIiwiZWFjaCIsIiR0aGlzIiwibmFtZSIsImF0dHIiLCJodG1sIiwicmVtb3ZlIiwicmVuZGVyIiwiZGF0YSIsIiRyZW5kZXIiLCJjbG9uZSIsImZuIiwiZmlsbEJsYW5rcyIsIiRibGFuayIsImZpbGwiLCJydWxlcyIsInNwbGl0IiwiaSIsImxlbmd0aCIsInBhaXIiLCJkZXN0IiwidHJpbSIsInNvdXJjZSIsInZhbHVlIiwiaiIsImFkZENsYXNzIiwidmFsIiwiaWZfbnVsbCIsImhpZGUiLCJyZW1vdmVDbGFzcyIsInJlbW92ZUF0dHIiLCJoYXNDbGFzcyIsIl9fcmVuZGVyIiwicXVldWUiLCIkbnAiLCIkcGxheWVyIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiUGxheWVyIiwicXVldWVfcG9zaXRpb24iLCJyZXBlYXQiLCJyZXBlYXRfb3B0aW9ucyIsImFkZEV2ZW50TGlzdGVuZXIiLCJ0ZXh0IiwicG9zaXRpb24iLCJjdXJyZW50VGltZSIsInBlcmNlbnQiLCJlbGFwc2VkIiwiY3NzIiwicGxheSIsIm5leHRUcmFjayIsInRpbWVsaW5lIiwic29uZyIsImFydGlzdCIsImFsYnVtIiwiY292ZXIiLCJvbiIsInBsYXlQYXVzZSIsInByZXZpb3VzVHJhY2siLCJ0b2dnbGVSZXBlYXQiLCJldmVudCIsIndpZHRoIiwiZGVsZWdhdGVUYXJnZXQiLCJvZmZzZXRYIiwicG9zaXRpb25faW5fc2Vjb25kcyIsInNraXBUb1Bvc2l0aW9uIiwibG9hZCIsInBhdXNlIiwic3JjIiwibmF2aWdhdG9yIiwibWVkaWFTZXNzaW9uIiwibWV0YWRhdGEiLCJNZWRpYU1ldGFkYXRhIiwicGF1c2VkIiwiY3VycmVudF92YWx1ZSIsIm5ld192YWx1ZSIsImluZGV4T2YiLCJzZXRBY3Rpb25IYW5kbGVyIiwiQXJ0aXN0IiwiYXJ0aXN0X2lkIiwiZ2V0IiwiZG9uZSIsInJlc3BvbnNlIiwiJGFydGlzdCIsImFsYnVtcyIsIiRhbGJ1bXMiLCJmb3JFYWNoIiwiJGFsYnVtIiwiYXBwZW5kVG8iLCJoaXRzIiwiJGhpdHMiLCJoaXQiLCIkaGl0IiwiZW1wdHkiLCJhcHBlbmQiLCJjb21tYW5kcyIsImNvbW1hbmQiLCJzaG9ydGN1dCIsIk1vdXNldHJhcCIsImJpbmQiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBRUEsSUFBQUEsR0FBQSxHQUFBLEVBQUE7QUFFQSxJQUFBQyxFQUFBLEdBQUEsRUFBQTtBQUNBLElBQUFDLEdBQUEsR0FBQSxFQUFBO0FBRUEsSUFBQUMsR0FBQSxHQUFBLEVBQUEsQyxDQUtBOztBQUNBQyxDQUFBLENBQUEsWUFBQTtBQUNBRixFQUFBQSxHQUFBLENBQUEsU0FBQSxDQUFBLEdBQUFFLENBQUEsQ0FBQSxVQUFBLENBQUE7QUFDQSxDQUZBLENBQUE7O0FBSUEsSUFBQUMsUUFBQSxHQUFBLFNBQUFBLFFBQUEsQ0FBQUMsT0FBQSxFQUFBO0FBQ0EsU0FBQUMsTUFBQSxDQUFBQyxHQUFBLENBQUFELE1BQUEsQ0FBQUYsUUFBQSxDQUFBQyxPQUFBLEVBQUEsU0FBQSxFQUFBRyxjQUFBLEVBQUEsRUFBQUMsTUFBQSxDQUFBLE1BQUEsQ0FBQTtBQUNBLENBRkEsQyxDQ25CQTtBQUNBO0FBQ0E7OztBQUVBVCxFQUFBLENBQUFVLFFBQUEsR0FBQSxZQUFBO0FBQ0EsTUFBQUMsVUFBQSxHQUFBLEVBQUE7QUFFQVIsRUFBQUEsQ0FBQSxDQUFBLFlBQUE7QUFDQUEsSUFBQUEsQ0FBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBUyxJQUFBLENBQUEsWUFBQTtBQUNBLFVBQUFDLEtBQUEsR0FBQVYsQ0FBQSxD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Y0FBQSxDQUFBLEdBQUEsQ0FGQTtBQUdBLGNBQUEscUJBQUE7QUFDQXRFLElBQUFBLEdBQUEsQ0FBQWtELE1BQUEsQ0FBQVksU0FBQTtBQUNBO0FBTEEsQ0FmQSxDQUFBO0FBd0JBNkMsUUFBQSxDQUFBVCxPQUFBLENBQUEsVUFBQVUsT0FBQSxFQUFBO0FBQ0FBLEVBQUFBLE9BQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQVYsT0FBQSxDQUFBLFVBQUFXLFFBQUEsRUFBQTtBQUNBQyxJQUFBQSxTQUFBLENBQUFDLElBQUEsQ0FBQUYsUUFBQSxFQUFBLFlBQUE7QUFDQUQsTUFBQUEsT0FBQSxDQUFBLFVBQUEsQ0FBQTtBQUNBLGFBQUEsS0FBQTtBQUNBLEtBSEE7QUFJQSxHQUxBO0FBTUEsQ0FQQSxFLENBU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FDOUNBO0FBQ0E7QUFDQTs7QUFFQXhHLENBQUEsQ0FBQSxZQUFBO0FBQ0FKLEVBQUFBLEdBQUEsQ0FBQTBGLE1BQUEsQ0FBQVosSUFBQSxDQUFBLGFBQUE7QUFDQSxDQUZBLENBQUEiLCJmaWxlIjoibXVzaWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIGJhc2UgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxubGV0IGFwcCA9IHsgfTtcclxuXHJcbmxldCB1aSA9IHsgfTtcclxubGV0ICR1aSA9IHsgfTtcclxuXHJcbmxldCBjdWUgPSB7IH07XHJcblxyXG5cclxuXHJcblxyXG4vLyBUT0RPOiBtb3ZlciBwYXJhIGx1Z2FyIGFwcm9wcmlhZG9cclxuJChmdW5jdGlvbigpIHtcclxuICAgICR1aVtcImxpYnJhcnlcIl0gPSAkKFwiLmxpYnJhcnlcIik7XHJcbn0pO1xyXG5cclxuY29uc3QgZHVyYXRpb24gPSAoc2Vjb25kcykgPT4ge1xyXG4gICAgcmV0dXJuIG1vbWVudC51dGMobW9tZW50LmR1cmF0aW9uKHNlY29uZHMsIFwic2Vjb25kc1wiKS5hc01pbGxpc2Vjb25kcygpKS5mb3JtYXQoXCJtOnNzXCIpO1xyXG59O1xyXG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIGNvcmUgLyB0ZW1wbGF0ZSBlbmdpbmUgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxudWkudGVtcGxhdGUgPSAoKCkgPT4ge1xyXG4gICAgbGV0ICR0ZW1wbGF0ZXMgPSB7IH07XHJcblxyXG4gICAgJChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJChcInRlbXBsYXRlXCIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9ICR0aGlzLmF0dHIoXCJpZFwiKTtcclxuICAgICAgICAgICAgdmFyIGh0bWwgPSAkdGhpcy5odG1sKCk7XHJcblxyXG4gICAgICAgICAgICAkdGVtcGxhdGVzW25hbWVdID0gJChodG1sKTtcclxuICAgICAgICAgICAgJHRoaXMucmVtb3ZlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCByZW5kZXIgPSAodGVtcGxhdGUsIGRhdGEpID0+IHtcclxuICAgICAgICBpZiAoISR0ZW1wbGF0ZXNbdGVtcGxhdGVdKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIHZhciAkcmVuZGVyID0gJHRlbXBsYXRlc1t0ZW1wbGF0ZV0uY2xvbmUoKTtcclxuXHJcbiAgICAgICAgJHJlbmRlci5kYXRhKGRhdGEpO1xyXG5cclxuICAgICAgICAkLmZuLmZpbGxCbGFua3MgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkYmxhbmsgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICB2YXIgZmlsbCA9ICRibGFuay5kYXRhKFwiZmlsbFwiKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBydWxlcyA9IGZpbGwuc3BsaXQoXCIsXCIpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFpciA9IHJ1bGVzW2ldLnNwbGl0KFwiOlwiKTtcclxuICAgICAgICAgICAgICAgIHZhciBkZXN0ID0gKHBhaXJbMV0gPyBwYWlyWzBdLnRyaW0oKSA6IFwiaHRtbFwiKTtcclxuICAgICAgICAgICAgICAgIHZhciBzb3VyY2UgPSAocGFpclsxXSA/IHBhaXJbMV0udHJpbSgpIDogcGFpclswXSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW3NvdXJjZV07XHJcblxyXG4gICAgICAgICAgICAgICAgc291cmNlID0gc291cmNlLnNwbGl0KFwiL1wiKTtcclxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2UubGVuZ3RoID4gMSAmJiB0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGRhdGFbc291cmNlWzBdXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDE7IGogPCBzb3VyY2UubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAodmFsdWVbc291cmNlW2pdXSkgPyB2YWx1ZVtzb3VyY2Vbal1dIDogbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiB2YWx1ZSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZXN0ID09PSBcImNsYXNzXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLmFkZENsYXNzKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlc3QgPT09IFwiaHRtbFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRibGFuay5odG1sKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlc3QgPT09IFwidmFsdWVcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsudmFsKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsuYXR0cihkZXN0LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWZfbnVsbCA9ICRibGFuay5kYXRhKFwiZmlsbC1udWxsXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpZl9udWxsID09PSBcImhpZGVcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaWZfbnVsbCA9PT0gXCJyZW1vdmVcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAkYmxhbmtcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhcImZpbGxcIilcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVBdHRyKFwiZGF0YS1maWxsXCIpXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlQXR0cihcImRhdGEtZmlsbC1udWxsXCIpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICgkcmVuZGVyLmhhc0NsYXNzKFwiZmlsbFwiKSkge1xyXG4gICAgICAgICAgICAkcmVuZGVyLmZpbGxCbGFua3MoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICQoXCIuZmlsbFwiLCAkcmVuZGVyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJCh0aGlzKS5maWxsQmxhbmtzKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiAkcmVuZGVyO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVuZGVyXHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxubGV0IF9fcmVuZGVyID0gdWkudGVtcGxhdGUucmVuZGVyO1xyXG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIHBsYXllciAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxubGV0IHF1ZXVlID0gW1xyXG4gICAge1xyXG4gICAgICAgIFwidGl0bGVcIjogXCJDYXB0YWluIENhbHZpbiAoT3JpZ2luYWwgTWl4KVwiLFxyXG4gICAgICAgIFwiYXJ0aXN0XCI6IFwiTG91a1wiLFxyXG4gICAgICAgIFwiYWxidW1cIjogXCJDaGlsbGhvcCBFc3NlbnRpYWxzIFdpbnRlciAyMDE4XCIsXHJcbiAgICAgICAgXCJsZW5ndGhcIjogMTQwLFxyXG4gICAgICAgIFwiY292ZXJcIjogXCJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vSkpBSzBtWF9wNUtMZjlfZWZTRXI3bDJvMm9BR3lDbjdiOC1wT3NmcDhfamYwMnV2SlVJSjFwRHREWngxSnNKQWZNNVlPZTJCSUVBXCIsXHJcbiAgICAgICAgXCJmaWxlXCI6IFwiL2RhdGEvZmlsZXMvMTQgQ2FwdGFpbiBDYWx2aW4gKE9yaWdpbmFsIE1peCkubXAzXCJcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJ0aXRsZVwiOiBcIlRpY28gVGljb1wiLFxyXG4gICAgICAgIFwiYXJ0aXN0XCI6IFwiT3NjYXIgUGV0ZXJzb25cIixcclxuICAgICAgICBcImFsYnVtXCI6IFwiVWx0aW1hdGUgSmF6eiBDb2xsZWN0aW9uc1wiLFxyXG4gICAgICAgIFwibGVuZ3RoXCI6IDE4MCxcclxuICAgICAgICBcImNvdmVyXCI6IFwiaHR0cHM6Ly9saDUuZ2dwaHQuY29tL2h3RUtNSXRLeUZ5SElnTmwyOENmYkJyLVJZTHZOaERVal9TRmU3NTdtX2dIMnlOc29SWFltWGdXSTAydGtBb1ZMS0NOSWloYlwiLFxyXG4gICAgICAgIFwiZmlsZVwiOiBcIi9kYXRhL2ZpbGVzLzMwIFRpY28gVGljby5tNGFcIlxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcInRpdGxlXCI6IFwiQSBIYXp5IFNoYWRlIG9mIFdpbnRlclwiLFxyXG4gICAgICAgIFwiYXJ0aXN0XCI6IFwiU2ltb24gJiBHYXJmdW5rZWxcIixcclxuICAgICAgICBcImFsYnVtXCI6IFwiQm9va2VuZHNcIixcclxuICAgICAgICBcImxlbmd0aFwiOiAxMzcsXHJcbiAgICAgICAgXCJjb3ZlclwiOiBcImh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9tZmNuWk1wcVlpMk9Jc2xyOVU1NlBlY0p5dFAyalFBajlCY09meDdtRWtDQ0JUUkk0Vnhwd3pWZTVHdXJfcVM1WGsxa1JsaTVnUVwiLFxyXG4gICAgICAgIFwiZmlsZVwiOiBcIi9kYXRhL2ZpbGVzLzExIEEgSGF6eSBTaGFkZSBvZiBXaW50ZXIubTRhXCJcclxuICAgIH1cclxuXTtcclxuXHJcbmxldCAkbnA7XHJcbmxldCAkcGxheWVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImF1ZGlvXCIpO1xyXG5cclxuYXBwLlBsYXllciA9ICgoKSA9PiB7XHJcbiAgICBsZXQgcXVldWVfcG9zaXRpb24gPSAwO1xyXG5cclxuICAgIGxldCByZXBlYXQgPSBcIm5vbmVcIjtcclxuICAgIGxldCByZXBlYXRfb3B0aW9ucyA9IFtcIm5vbmVcIiwgXCJhbGxcIiwgXCJvbmVcIl07XHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBFdmVudG9zXHJcblxyXG4gICAgLy8gRGVmaW5lIG8gdGVtcG8gZGUgZHVyYcOnw6NvIHF1YW5kbyB1bWEgbcO6c2ljYSDDqSBjYXJyZWdhZGEgbcO6c2ljYVxyXG4gICAgJHBsYXllci5hZGRFdmVudExpc3RlbmVyKFwibG9hZGVkbWV0YWRhdGFcIiwgKCkgPT4ge1xyXG4gICAgICAgIGxldCBsZW5ndGggPSBkdXJhdGlvbigkcGxheWVyLmR1cmF0aW9uKTtcclxuICAgICAgICAkbnAubGVuZ3RoLnRleHQobGVuZ3RoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEF0dWFsaXphIGJhcnJhIGRlIHRlbXBvXHJcbiAgICAkcGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0aW1ldXBkYXRlXCIsICgpID0+IHtcclxuICAgICAgICBsZXQgcG9zaXRpb24gPSBkdXJhdGlvbigkcGxheWVyLmN1cnJlbnRUaW1lKTtcclxuICAgICAgICAkbnAucG9zaXRpb24udGV4dChwb3NpdGlvbik7XHJcblxyXG4gICAgICAgIGxldCBwZXJjZW50ID0gJHBsYXllci5jdXJyZW50VGltZSAvICRwbGF5ZXIuZHVyYXRpb24gKiAxMDA7XHJcbiAgICAgICAgJG5wLmVsYXBzZWQuY3NzKFwid2lkdGhcIiwgcGVyY2VudCArIFwiJVwiKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFBhc3NhIHBhcmEgcHLDs3hpbWEgbcO6c2ljYSBxdWFuZG8gYSBhdHVhbCBjaGVnYSBhbyBmaW1cclxuICAgICRwbGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcihcImVuZGVkXCIsICgpID0+IHtcclxuICAgICAgICBpZiAocmVwZWF0ID09PSBcIm9uZVwiKSB7XHJcbiAgICAgICAgICAgICRwbGF5ZXIuY3VycmVudFRpbWUgPSAwO1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLnBsYXkoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLm5leHRUcmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuICAgICQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJG5wID0gJChcIi5ub3ctcGxheWluZ1wiKTtcclxuICAgICAgICAkbnAucG9zaXRpb24gPSAkKFwiLm5vdy1wbGF5aW5nIC5wb3NpdGlvblwiKTtcclxuICAgICAgICAkbnAubGVuZ3RoID0gJChcIi5ub3ctcGxheWluZyAubGVuZ3RoXCIpO1xyXG4gICAgICAgICRucC50aW1lbGluZSA9ICQoXCIubm93LXBsYXlpbmcgLmJhclwiKTtcclxuICAgICAgICAkbnAuZWxhcHNlZCA9ICQoXCIubm93LXBsYXlpbmcgLmVsYXBzZWRcIik7XHJcblxyXG4gICAgICAgICRucC5zb25nID0gJChcIi5ub3ctcGxheWluZyAuc29uZ1wiKTtcclxuICAgICAgICAkbnAuYXJ0aXN0ID0gJChcIi5ub3ctcGxheWluZyAuYXJ0aXN0XCIpO1xyXG4gICAgICAgICRucC5hbGJ1bSA9ICQoXCIubm93LXBsYXlpbmcgLmFsYnVtXCIpO1xyXG4gICAgICAgICRucC5jb3ZlciA9ICQoXCIubm93LXBsYXlpbmcgLmNvdmVyXCIpO1xyXG5cclxuICAgICAgICAkdWlbXCJub3ctcGxheWluZ1wiXSA9ICQoXCIubm93LXBsYXlpbmdcIik7XHJcbiAgICAgICAgJChcIi5wbGF5LXBhdXNlXCIsICR1aVtcIm5vdy1wbGF5aW5nXCJdKS5vbihcImNsaWNrXCIsIGFwcC5QbGF5ZXIucGxheVBhdXNlKTtcclxuICAgICAgICAkKFwiLnNraXAtcHJldmlvdXNcIiwgJHVpW1wibm93LXBsYXlpbmdcIl0pLm9uKFwiY2xpY2tcIiwgYXBwLlBsYXllci5wcmV2aW91c1RyYWNrKTtcclxuICAgICAgICAkKFwiLnNraXAtbmV4dFwiLCAkdWlbXCJub3ctcGxheWluZ1wiXSkub24oXCJjbGlja1wiLCBhcHAuUGxheWVyLm5leHRUcmFjayk7XHJcbiAgICAgICAgJChcIi5yZXBlYXRcIiwgJHVpW1wibm93LXBsYXlpbmdcIl0pLm9uKFwiY2xpY2tcIiwgYXBwLlBsYXllci50b2dnbGVSZXBlYXQpO1xyXG5cclxuICAgICAgICAvLyBDbGlxdWVzIG5hIGxpbmhhIGRvIHRlbXBvXHJcbiAgICAgICAgJG5wLnRpbWVsaW5lLm9uKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB3aWR0aCA9ICQoZXZlbnQuZGVsZWdhdGVUYXJnZXQpLndpZHRoKCk7XHJcbiAgICAgICAgICAgIGxldCBwb3NpdGlvbiA9IGV2ZW50Lm9mZnNldFg7XHJcbiAgICAgICAgICAgIGxldCBwZXJjZW50ID0gcG9zaXRpb24gLyB3aWR0aDtcclxuXHJcbiAgICAgICAgICAgIGxldCBwb3NpdGlvbl9pbl9zZWNvbmRzID0gJHBsYXllci5kdXJhdGlvbiAqIHBlcmNlbnQ7XHJcbiAgICAgICAgICAgIGFwcC5QbGF5ZXIuc2tpcFRvUG9zaXRpb24ocG9zaXRpb25faW5fc2Vjb25kcyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIENhcnJlZ2EgYSBwcmltZWlyYSBtw7pzaWNhIGRhIGZpbGFcclxuICAgICAgICBhcHAuUGxheWVyLmxvYWQocXVldWVbcXVldWVfcG9zaXRpb25dKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIGNvbnN0IHVwZGF0ZVRpbWVsaW5lXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuUGxheWVyLnNraXBUb1Bvc2l0aW9uKClcclxuICAgIGNvbnN0IGxvYWQgPSAoc29uZykgPT4ge1xyXG4gICAgICAgIC8vIFBhdXNhIGEgcmVwcm9kdcOnw6NvLCByZXNldGEgbyB0ZW1wbyBlIGNhcnJlZ2EgYSBub3ZhIG3DunNpY2FcclxuICAgICAgICBhcHAuUGxheWVyLnBhdXNlKCk7XHJcbiAgICAgICAgJHBsYXllci5jdXJyZW50VGltZSA9IDA7XHJcbiAgICAgICAgJHBsYXllci5zcmMgPSBzb25nW1wiZmlsZVwiXTtcclxuXHJcbiAgICAgICAgLy8gQXR1YWxpemEgYXMgaW5mb3JtYcOnw7VlcyBzb2JyZSBhIG3DunNpY2EgZW0gcmVwcm9kdcOnw6NvXHJcbiAgICAgICAgJG5wLnNvbmcudGV4dChzb25nW1widGl0bGVcIl0pO1xyXG4gICAgICAgICRucC5hcnRpc3QudGV4dChzb25nW1wiYXJ0aXN0XCJdKTtcclxuICAgICAgICAkbnAuYWxidW0udGV4dChzb25nW1wiYWxidW1cIl0pO1xyXG4gICAgICAgICRucC5jb3Zlci5jc3MoXCJiYWNrZ3JvdW5kLWltYWdlXCIsIFwidXJsKCdcIiArIHNvbmdbXCJjb3ZlclwiXSArIFwiJylcIik7XHJcblxyXG4gICAgICAgIC8vIEF0dWFsaXphIGRhZG9zIGRhIE1lZGlhIFNlc3Npb24gQVBJXHJcbiAgICAgICAgaWYgKFwibWVkaWFTZXNzaW9uXCIgaW4gbmF2aWdhdG9yKSB7XHJcbiAgICAgICAgICAgIG5hdmlnYXRvci5tZWRpYVNlc3Npb24ubWV0YWRhdGEgPSBuZXcgTWVkaWFNZXRhZGF0YSh7XHJcbiAgICAgICAgICAgICAgICBcInRpdGxlXCI6IHNvbmdbXCJ0aXRsZVwiXSxcclxuICAgICAgICAgICAgICAgIFwiYXJ0aXN0XCI6IHNvbmdbXCJhcnRpc3RcIl0sXHJcbiAgICAgICAgICAgICAgICBcImFsYnVtXCI6IHNvbmdbXCJhbGJ1bVwiXSxcclxuICAgICAgICAgICAgICAgIFwiYXJ0d29ya1wiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInNyY1wiOiBzb25nW1wiY292ZXJcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic2l6ZXNcIjogXCI1MTJ4NTEyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImltYWdlL3BuZ1wiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEluaWNpYSBhIHJlcHJvZHXDp8Ojb1xyXG4gICAgICAgIGFwcC5QbGF5ZXIucGxheSgpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuUGxheWVyLnNraXBUb1Bvc2l0aW9uKClcclxuICAgIGNvbnN0IHNraXBUb1Bvc2l0aW9uID0gKHNlY29uZHMpID0+IHtcclxuICAgICAgICAkcGxheWVyLmN1cnJlbnRUaW1lID0gc2Vjb25kcztcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLlBsYXllci5wbGF5KClcclxuICAgIGNvbnN0IHBsYXkgPSAoKSA9PiB7XHJcbiAgICAgICAgJHBsYXllci5wbGF5KCk7XHJcbiAgICAgICAgJG5wLnJlbW92ZUNsYXNzKFwiLXN0YXRlLS1wYXVzZWRcIikuYWRkQ2xhc3MoXCItc3RhdGUtLXBsYXlpbmdcIik7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIGFwcC5QbGF5ZXIucGF1c2UoKVxyXG4gICAgY29uc3QgcGF1c2UgPSAoKSA9PiB7XHJcbiAgICAgICAgJHBsYXllci5wYXVzZSgpO1xyXG4gICAgICAgICRucC5yZW1vdmVDbGFzcyhcIi1zdGF0ZS0tcGxheWluZ1wiKS5hZGRDbGFzcyhcIi1zdGF0ZS0tcGF1c2VkXCIpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuUGxheWVyLnBsYXlQYXVzZSgpXHJcbiAgICBjb25zdCBwbGF5UGF1c2UgPSAoKSA9PiB7XHJcbiAgICAgICAgaWYgKCRwbGF5ZXIucGF1c2VkKSB7XHJcbiAgICAgICAgICAgIGFwcC5QbGF5ZXIucGxheSgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGFwcC5QbGF5ZXIucGF1c2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiZHVyYXRpb25cIiwgJHBsYXllci5kdXJhdGlvbik7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJ2b2x1bWVcIiwgJHBsYXllci52b2x1bWUpO1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImJ1ZmZlcmVkXCIsICRwbGF5ZXIuYnVmZmVyZWQpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwibmV0d29ya1N0YXRlXCIsICRwbGF5ZXIubmV0d29ya1N0YXRlKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcInBsYXllZFwiLCAkcGxheWVyLnBsYXllZCk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJyZWFkeVN0YXRlXCIsICRwbGF5ZXIucmVhZHlTdGF0ZSk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJzZWVrYWJsZVwiLCAkcGxheWVyLnNlZWthYmxlKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLlBsYXllci5wcmV2aW91c1RyYWNrKClcclxuICAgIGNvbnN0IHByZXZpb3VzVHJhY2sgPSAoKSA9PiB7XHJcbiAgICAgICAgLy8gU2UgdGl2ZXIgYXDDs3Mgb3MgNSBzZWd1bmRvcyBkYSBtw7pzaWNhIGF0dWFsLCB2b2x0YSBwYXJhIG8gY29tZcOnb1xyXG4gICAgICAgIGlmICgkcGxheWVyLmN1cnJlbnRUaW1lID4gNSkge1xyXG4gICAgICAgICAgICAkcGxheWVyLmN1cnJlbnRUaW1lID0gMDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBxdWV1ZV9wb3NpdGlvbiA9IChxdWV1ZV9wb3NpdGlvbiAtIDEgKyBxdWV1ZS5sZW5ndGgpICUgcXVldWUubGVuZ3RoO1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLmxvYWQocXVldWVbcXVldWVfcG9zaXRpb25dKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIGFwcC5QbGF5ZXIubmV4dFRyYWNrKClcclxuICAgIGNvbnN0IG5leHRUcmFjayA9ICgpID0+IHtcclxuICAgICAgICBpZiAocXVldWVfcG9zaXRpb24gKyAxIDwgcXVldWUubGVuZ3RoIHx8IHJlcGVhdCA9PT0gXCJhbGxcIikge1xyXG4gICAgICAgICAgICBxdWV1ZV9wb3NpdGlvbiA9IChxdWV1ZV9wb3NpdGlvbiArIDEpICUgcXVldWUubGVuZ3RoO1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLmxvYWQocXVldWVbcXVldWVfcG9zaXRpb25dKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIGFwcC5QbGF5ZXIudG9nZ2xlUmVwZWF0KClcclxuICAgIGNvbnN0IHRvZ2dsZVJlcGVhdCA9ICgpID0+IHtcclxuICAgICAgICBsZXQgY3VycmVudF92YWx1ZSA9IHJlcGVhdDtcclxuICAgICAgICBsZXQgbmV3X3ZhbHVlID0gcmVwZWF0X29wdGlvbnNbcmVwZWF0X29wdGlvbnMuaW5kZXhPZihjdXJyZW50X3ZhbHVlKSArIDFdO1xyXG5cclxuICAgICAgICByZXBlYXQgPSBuZXdfdmFsdWU7XHJcblxyXG4gICAgICAgICQoXCIucmVwZWF0XCIsICR1aVtcIm5vdy1wbGF5aW5nXCJdKVxyXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoXCItb3B0aW9uLS1cIiArIGN1cnJlbnRfdmFsdWUpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcyhcIi1vcHRpb24tLVwiICsgbmV3X3ZhbHVlKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbG9hZCxcclxuICAgICAgICBza2lwVG9Qb3NpdGlvbixcclxuICAgICAgICBwbGF5LFxyXG4gICAgICAgIHBhdXNlLFxyXG4gICAgICAgIHBsYXlQYXVzZSxcclxuICAgICAgICBwcmV2aW91c1RyYWNrLFxyXG4gICAgICAgIG5leHRUcmFjayxcclxuICAgICAgICB0b2dnbGVSZXBlYXRcclxuICAgIH07XHJcbn0pKCk7XHJcblxyXG5pZiAoXCJtZWRpYVNlc3Npb25cIiBpbiBuYXZpZ2F0b3IpIHtcclxuICAgIG5hdmlnYXRvci5tZWRpYVNlc3Npb24uc2V0QWN0aW9uSGFuZGxlcihcInBsYXlcIiwgYXBwLlBsYXllci5wbGF5KTtcclxuICAgIG5hdmlnYXRvci5tZWRpYVNlc3Npb24uc2V0QWN0aW9uSGFuZGxlcihcInBhdXNlXCIsIGFwcC5QbGF5ZXIucGF1c2UpO1xyXG4gICAgLy8gbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5zZXRBY3Rpb25IYW5kbGVyKFwic2Vla2JhY2t3YXJkXCIsIGZ1bmN0aW9uICgpIHsgfSk7XHJcbiAgICAvLyBuYXZpZ2F0b3IubWVkaWFTZXNzaW9uLnNldEFjdGlvbkhhbmRsZXIoXCJzZWVrZm9yd2FyZFwiLCBmdW5jdGlvbiAoKSB7IH0pO1xyXG4gICAgbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5zZXRBY3Rpb25IYW5kbGVyKFwicHJldmlvdXN0cmFja1wiLCBhcHAuUGxheWVyLnByZXZpb3VzVHJhY2spO1xyXG4gICAgbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5zZXRBY3Rpb25IYW5kbGVyKFwibmV4dHRyYWNrXCIsIGFwcC5QbGF5ZXIubmV4dFRyYWNrKTtcclxufVxyXG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIGFydGlzdCAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuYXBwLkFydGlzdCA9ICgoKSA9PiB7XHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuQXJ0aXN0LmxvYWQoKVxyXG4gICAgY29uc3QgbG9hZCA9IChhcnRpc3RfaWQpID0+IHtcclxuICAgICAgICAkLmdldChcImRhdGEvYXJ0aXN0cy9cIiArIGFydGlzdF9pZCArIFwiLmpzb25cIikuZG9uZSgocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgbGV0IGFydGlzdCA9IHJlc3BvbnNlO1xyXG4gICAgICAgICAgICBsZXQgJGFydGlzdCA9IF9fcmVuZGVyKFwiYXJ0aXN0XCIsIGFydGlzdCk7XHJcblxyXG4gICAgICAgICAgICAvLyDDgWxidW5zXHJcbiAgICAgICAgICAgIGxldCBhbGJ1bXMgPSBhcnRpc3RbXCJhbGJ1bXNcIl07XHJcbiAgICAgICAgICAgIGxldCAkYWxidW1zID0gJChcIi5hbGJ1bXNcIiwgJGFydGlzdCk7XHJcblxyXG4gICAgICAgICAgICBhbGJ1bXMuZm9yRWFjaCgoYWxidW0pID0+IHtcclxuICAgICAgICAgICAgICAgIGFsYnVtW1wiY292ZXItYXJ0XCJdID0gXCJiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJ1wiICsgYWxidW1bXCJjb3ZlclwiXSArIFwiJylcIjtcclxuICAgICAgICAgICAgICAgIGxldCAkYWxidW0gPSBfX3JlbmRlcihcImFydGlzdC1hbGJ1bVwiLCBhbGJ1bSkuYXBwZW5kVG8oJGFsYnVtcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gSGl0c1xyXG4gICAgICAgICAgICBsZXQgaGl0cyA9IGFydGlzdFtcImhpdHNcIl07XHJcbiAgICAgICAgICAgIGxldCAkaGl0cyA9ICQoXCIuaGl0c1wiLCAkYXJ0aXN0KTtcclxuXHJcbiAgICAgICAgICAgIGhpdHMuZm9yRWFjaCgoaGl0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBoaXRbXCJmb3JtYXR0ZWQtbGVuZ3RoXCJdID0gZHVyYXRpb24oaGl0W1wibGVuZ3RoXCJdKTtcclxuICAgICAgICAgICAgICAgIGxldCAkaGl0ID0gX19yZW5kZXIoXCJhcnRpc3QtaGl0XCIsIGhpdCkuYXBwZW5kVG8oJGhpdHMpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIENvbG9jYSBuYSB0ZWxhXHJcbiAgICAgICAgICAgICR1aVtcImxpYnJhcnlcIl0uZW1wdHkoKS5hcHBlbmQoJGFydGlzdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGxvYWRcclxuICAgIH07XHJcbn0pKCk7XHJcbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gY29tbWFuZHMgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG5sZXQgY29tbWFuZHMgPSBbXHJcbiAgICB7XHJcbiAgICAgICAgXCJ0aXRsZVwiOiBcIlBsYXkvUGF1c2VcIixcclxuICAgICAgICBcInNob3J0Y3V0XCI6IFtcImtcIiwgXCJzcGFjZVwiXSxcclxuICAgICAgICBcImZ1bmN0aW9uXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgYXBwLlBsYXllci5wbGF5UGF1c2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwidGl0bGVcIjogXCJNw7pzaWNhIGFudGVyaW9yXCIsXHJcbiAgICAgICAgXCJzaG9ydGN1dFwiOiBbXCIsXCJdLFxyXG4gICAgICAgIFwiZnVuY3Rpb25cIjogKCkgPT4ge1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLnByZXZpb3VzVHJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwidGl0bGVcIjogXCJQcsOzeGltYSBtw7pzaWNhXCIsXHJcbiAgICAgICAgXCJzaG9ydGN1dFwiOiBbXCIuXCJdLFxyXG4gICAgICAgIFwiZnVuY3Rpb25cIjogKCkgPT4ge1xyXG4gICAgICAgICAgICBhcHAuUGxheWVyLm5leHRUcmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXTtcclxuXHJcbmNvbW1hbmRzLmZvckVhY2goKGNvbW1hbmQpID0+IHtcclxuICAgIGNvbW1hbmRbXCJzaG9ydGN1dFwiXS5mb3JFYWNoKChzaG9ydGN1dCkgPT4ge1xyXG4gICAgICAgIE1vdXNldHJhcC5iaW5kKHNob3J0Y3V0LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbW1hbmRbXCJmdW5jdGlvblwiXSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG4vLyAtIEo6IHZvbHRhIDEwIHNlZ3VuZG9zXHJcbi8vIC0gTDogYXZhbsOnYSAxMCBzZWd1bmRvc1xyXG4vLyAtIFI6IHJlcGVhdFxyXG4vLyAtIFM6IHNodWZmbGVcclxuLy8gLSBNOiBtdWRvXHJcblxyXG4vLyAjIE5hdmVnYcOnw6NvXHJcbi8vIC0gZyBmOiBmYXZvcml0b3NcclxuLy8gLSBnIGw6IGJpYmxpb3RlY2FcclxuLy8gLSBnIHA6IHBsYXlsaXN0c1xyXG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIHN0YXJ0IC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuJChmdW5jdGlvbigpIHtcclxuICAgIGFwcC5BcnRpc3QubG9hZChcInRoZS1iZWF0bGVzXCIpO1xyXG59KTtcclxuIl19
