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

var $player;
var $np = {};

if ("mediaSession" in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    "title": "Under Cover of Darkness",
    "artist": "The Strokes",
    "album": "Angles",
    "artwork": [{
      "src": "https://lh3.ggpht.com/Cc4TZKHRq_rdChujsY__QSMO0Hcmw9kPomu9zE06vz-tjKgiVaPo4evmIyN6Gp1owl9uRK_rE-c",
      "sizes": "512x512",
      "type": "image/png"
    }]
  });
  navigator.mediaSession.setActionHandler("play", app.Player.play);
  navigator.mediaSession.setActionHandler("pause", app.Player.pause); // navigator.mediaSession.setActionHandler("seekbackward", function () { });
  // navigator.mediaSession.setActionHandler("seekforward", function () { });
  // navigator.mediaSession.setActionHandler("previoustrack", function () { });
  // navigator.mediaSession.setActionHandler("nexttrack", function () { });
}

$(function () {
  $player = document.querySelector("audio.player");
  $np.position = $(".now-playing .position");
  $np.length = $(".now-playing .length");
  $np.timeline = $(".now-playing .bar");
  $np.elapsed = $(".now-playing .elapsed");
  $player.addEventListener("timeupdate", function (event) {
    var length = duration($player.duration);
    $np.length.text(length);
    var position = duration($player.currentTime);
    $np.position.text(position);
    var percent = $player.currentTime / $player.duration * 100;
    $np.elapsed.css("width", percent + "%"); // console.log(position_is_seconds, human_position);
  });
  $ui["now-playing"] = $(".now-playing");
  $(".play", $ui["now-playing"]).on("click", app.Player.playPause); // Cliques na linha do tempo

  $np.timeline.on("click", function (event) {
    var width = $(event.delegateTarget).width();
    var position = event.offsetX;
    var percent = position / width;
    var position_in_seconds = $player.duration * percent;
    app.Player.skipToPosition(position_in_seconds);
  });
});

app.Player = function () {
  // const updateTimeline
  ////////////////////////////////////////////////////////////////////////////////////////////////
  // app.Player.skipToPosition()
  var skipToPosition = function skipToPosition(seconds) {
    $player.currentTime = seconds;
  }; ////////////////////////////////////////////////////////////////////////////////////////////////
  // app.Player.play()


  var play = function play() {
    $player.play();
  }; ////////////////////////////////////////////////////////////////////////////////////////////////
  // app.Player.pause()


  var pause = function pause() {
    $player.pause();
  }; ////////////////////////////////////////////////////////////////////////////////////////////////
  // app.Player.playPause()


  var playPause = function playPause() {
    if ($player.paused) {
      $player.play();
    } else {
      $player.pause();
    } // console.log("duration", $player.duration);
    // console.log("volume", $player.volume);
    // console.log("buffered", $player.buffered);
    // console.log("networkState", $player.networkState);
    // console.log("played", $player.played);
    // console.log("readyState", $player.readyState);
    // console.log("seekable", $player.seekable);

  }; ////////////////////////////////////////////////////////////////////////////////////////////////


  return {
    skipToPosition: skipToPosition,
    play: play,
    pause: pause,
    playPause: playPause
  };
}(); ////////////////////////////////////////////////////////////////////////////////////////////////////
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
// start ///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////


$(function () {
  app.Artist.load("the-beatles");
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhc2UuanMiLCJ0ZW1wbGF0ZS1lbmdpbmUuanMiLCJwbGF5ZXIuanMiLCJhcnRpc3QuanMiLCJzdGFydC5qcyJdLCJuYW1lcyI6WyJhcHAiLCJ1aSIsIiR1aSIsImN1ZSIsIiQiLCJkdXJhdGlvbiIsInNlY29uZHMiLCJtb21lbnQiLCJ1dGMiLCJhc01pbGxpc2Vjb25kcyIsImZvcm1hdCIsInRlbXBsYXRlIiwiJHRlbXBsYXRlcyIsImVhY2giLCIkdGhpcyIsIm5hbWUiLCJhdHRyIiwiaHRtbCIsInJlbW92ZSIsInJlbmRlciIsImRhdGEiLCIkcmVuZGVyIiwiY2xvbmUiLCJmbiIsImZpbGxCbGFua3MiLCIkYmxhbmsiLCJmaWxsIiwicnVsZXMiLCJzcGxpdCIsImkiLCJsZW5ndGgiLCJwYWlyIiwiZGVzdCIsInRyaW0iLCJzb3VyY2UiLCJ2YWx1ZSIsImoiLCJhZGRDbGFzcyIsInZhbCIsImlmX251bGwiLCJoaWRlIiwicmVtb3ZlQ2xhc3MiLCJyZW1vdmVBdHRyIiwiaGFzQ2xhc3MiLCJfX3JlbmRlciIsIiRwbGF5ZXIiLCIkbnAiLCJuYXZpZ2F0b3IiLCJtZWRpYVNlc3Npb24iLCJtZXRhZGF0YSIsIk1lZGlhTWV0YWRhdGEiLCJzZXRBY3Rpb25IYW5kbGVyIiwiUGxheWVyIiwicGxheSIsInBhdXNlIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yIiwicG9zaXRpb24iLCJ0aW1lbGluZSIsImVsYXBzZWQiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJ0ZXh0IiwiY3VycmVudFRpbWUiLCJwZXJjZW50IiwiY3NzIiwib24iLCJwbGF5UGF1c2UiLCJ3aWR0aCIsImRlbGVnYXRlVGFyZ2V0Iiwib2Zmc2V0WCIsInBvc2l0aW9uX2luX3NlY29uZHMiLCJza2lwVG9Qb3NpdGlvbiIsInBhdXNlZCIsIkFydGlzdCIsImxvYWQiLCJhcnRpc3RfaWQiLCJnZXQiLCJkb25lIiwicmVzcG9uc2UiLCJhcnRpc3QiLCIkYXJ0aXN0IiwiYWxidW1zIiwiJGFsYnVtcyIsImZvckVhY2giLCJhbGJ1bSIsIiRhbGJ1bSIsImFwcGVuZFRvIiwiaGl0cyIsIiRoaXRzIiwiaGl0IiwiJGhpdCIsImVtcHR5IiwiYXBwZW5kIl0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtBQUVBLElBQUFBLEdBQUEsR0FBQSxFQUFBO0FBRUEsSUFBQUMsRUFBQSxHQUFBLEVBQUE7QUFDQSxJQUFBQyxHQUFBLEdBQUEsRUFBQTtBQUVBLElBQUFDLEdBQUEsR0FBQSxFQUFBLEMsQ0FLQTs7QUFDQUMsQ0FBQSxDQUFBLFlBQUE7QUFDQUYsRUFBQUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxHQUFBRSxDQUFBLENBQUEsVUFBQSxDQUFBO0FBQ0EsQ0FGQSxDQUFBOztBQUlBLElBQUFDLFFBQUEsR0FBQSxTQUFBQSxRQUFBLENBQUFDLE9BQUEsRUFBQTtBQUNBLFNBQUFDLE1BQUEsQ0FBQUMsR0FBQSxDQUFBRCxNQUFBLENBQUFGLFFBQUEsQ0FBQUMsT0FBQSxFQUFBLFNBQUEsRUFBQUcsY0FBQSxFQUFBLEVBQUFDLE1BQUEsQ0FBQSxNQUFBLENBQUE7QUFDQSxDQUZBLEMsQ0NuQkE7QUFDQTtBQUNBOzs7QUFFQVQsRUFBQSxDQUFBVSxRQUFBLEdBQUEsWUFBQTtBQUNBLE1BQUFDLFVBQUEsR0FBQSxFQUFBO0FBRUFSLEVBQUFBLENBQUEsQ0FBQSxZQUFBO0FBQ0FBLElBQUFBLENBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQVMsSUFBQSxDQUFBLFlBQUE7QUFDQSxVQUFBQyxLQUFBLEdBQUFWLENBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxVQUFBVyxJQUFBLEdBQUFELEtBQUEsQ0FBQUUsSUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLFVBQUFDLElBQUEsR0FBQUgsS0FBQSxDQUFBRyxJQUFBLEVBQUE7QUFFQUwsTUFBQUEsVUFBQSxDQUFBRyxJQUFBLENBQUEsR0FBQVgsQ0FBQSxDQUFBYSxJQUFBLENBQUE7QUFDQUgsTUFBQUEsS0FBQSxDQUFBSSxNQUFBO0FBQ0EsS0FQQTtBQVFBLEdBVEEs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QUFBckYsQ0FBQSxDQUFBLE9BQUEsRUFBQTZFLE9BQUEsQ0FBQTtBQUVBTyxNQUFBQSxJQUFBLENBQUFKLE9BQUEsQ0FBQSxVQUFBTSxHQUFBLEVBQUE7QUFDQUEsUUFBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUEsR0FBQXJGLFFBQUEsQ0FBQXFGLEdBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTs7QUFDQSxZQUFBQyxJQUFBLEdBQUEvQyxRQUFBLENBQUEsWUFBQSxFQUFBOEMsR0FBQSxDQUFBLENBQUFILFFBQUEsQ0FBQUUsS0FBQSxDQUFBO0FBQ0EsT0FIQSxFQWpCQSxDQXNCQTs7QUFDQXZGLE1BQUFBLEdBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQTBGLEtBQUEsR0FBQUMsTUFBQSxDQUFBWixPQUFBO0FBQ0EsS0F4QkE7QUF5QkEsR0ExQkEsQ0FKQSxDQWlDQTs7O0FBRUEsU0FBQTtBQUNBTixJQUFBQSxJQUFBLEVBQUFBO0FBREEsR0FBQTtBQUdBLENBdENBLEVBQUEsQyxDQ0pBO0FBQ0E7QUFDQTs7O0FBRUF2RSxDQUFBLENBQUEsWUFBQTtBQUNBSixFQUFBQSxHQUFBLENBQUEwRSxNQUFBLENBQUFDLElBQUEsQ0FBQSxhQUFBO0FBQ0EsQ0FGQSxDQUFBIiwiZmlsZSI6Im11c2ljLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBiYXNlIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbmxldCBhcHAgPSB7IH07XHJcblxyXG5sZXQgdWkgPSB7IH07XHJcbmxldCAkdWkgPSB7IH07XHJcblxyXG5sZXQgY3VlID0geyB9O1xyXG5cclxuXHJcblxyXG5cclxuLy8gVE9ETzogbW92ZXIgcGFyYSBsdWdhciBhcHJvcHJpYWRvXHJcbiQoZnVuY3Rpb24oKSB7XHJcbiAgICAkdWlbXCJsaWJyYXJ5XCJdID0gJChcIi5saWJyYXJ5XCIpO1xyXG59KTtcclxuXHJcbmNvbnN0IGR1cmF0aW9uID0gKHNlY29uZHMpID0+IHtcclxuICAgIHJldHVybiBtb21lbnQudXRjKG1vbWVudC5kdXJhdGlvbihzZWNvbmRzLCBcInNlY29uZHNcIikuYXNNaWxsaXNlY29uZHMoKSkuZm9ybWF0KFwibTpzc1wiKTtcclxufTtcclxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBjb3JlIC8gdGVtcGxhdGUgZW5naW5lIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbnVpLnRlbXBsYXRlID0gKCgpID0+IHtcclxuICAgIGxldCAkdGVtcGxhdGVzID0geyB9O1xyXG5cclxuICAgICQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQoXCJ0ZW1wbGF0ZVwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSAkdGhpcy5hdHRyKFwiaWRcIik7XHJcbiAgICAgICAgICAgIHZhciBodG1sID0gJHRoaXMuaHRtbCgpO1xyXG5cclxuICAgICAgICAgICAgJHRlbXBsYXRlc1tuYW1lXSA9ICQoaHRtbCk7XHJcbiAgICAgICAgICAgICR0aGlzLnJlbW92ZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgcmVuZGVyID0gKHRlbXBsYXRlLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgaWYgKCEkdGVtcGxhdGVzW3RlbXBsYXRlXSkgeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICB2YXIgJHJlbmRlciA9ICR0ZW1wbGF0ZXNbdGVtcGxhdGVdLmNsb25lKCk7XHJcblxyXG4gICAgICAgICRyZW5kZXIuZGF0YShkYXRhKTtcclxuXHJcbiAgICAgICAgJC5mbi5maWxsQmxhbmtzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJGJsYW5rID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgdmFyIGZpbGwgPSAkYmxhbmsuZGF0YShcImZpbGxcIik7XHJcblxyXG4gICAgICAgICAgICB2YXIgcnVsZXMgPSBmaWxsLnNwbGl0KFwiLFwiKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhaXIgPSBydWxlc1tpXS5zcGxpdChcIjpcIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGVzdCA9IChwYWlyWzFdID8gcGFpclswXS50cmltKCkgOiBcImh0bWxcIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlID0gKHBhaXJbMV0gPyBwYWlyWzFdLnRyaW0oKSA6IHBhaXJbMF0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtzb3VyY2VdO1xyXG5cclxuICAgICAgICAgICAgICAgIHNvdXJjZSA9IHNvdXJjZS5zcGxpdChcIi9cIik7XHJcbiAgICAgICAgICAgICAgICBpZiAoc291cmNlLmxlbmd0aCA+IDEgJiYgdHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkYXRhW3NvdXJjZVswXV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAxOyBqIDwgc291cmNlLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gKHZhbHVlW3NvdXJjZVtqXV0pID8gdmFsdWVbc291cmNlW2pdXSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIgJiYgdmFsdWUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGVzdCA9PT0gXCJjbGFzc1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRibGFuay5hZGRDbGFzcyh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkZXN0ID09PSBcImh0bWxcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsuaHRtbCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkZXN0ID09PSBcInZhbHVlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLnZhbCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLmF0dHIoZGVzdCwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlmX251bGwgPSAkYmxhbmsuZGF0YShcImZpbGwtbnVsbFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaWZfbnVsbCA9PT0gXCJoaWRlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlmX251bGwgPT09IFwicmVtb3ZlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgJGJsYW5rXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoXCJmaWxsXCIpXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlQXR0cihcImRhdGEtZmlsbFwiKVxyXG4gICAgICAgICAgICAgICAgLnJlbW92ZUF0dHIoXCJkYXRhLWZpbGwtbnVsbFwiKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoJHJlbmRlci5oYXNDbGFzcyhcImZpbGxcIikpIHtcclxuICAgICAgICAgICAgJHJlbmRlci5maWxsQmxhbmtzKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkKFwiLmZpbGxcIiwgJHJlbmRlcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQodGhpcykuZmlsbEJsYW5rcygpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gJHJlbmRlcjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlbmRlclxyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmxldCBfX3JlbmRlciA9IHVpLnRlbXBsYXRlLnJlbmRlcjtcclxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBwbGF5ZXIgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbmxldCAkcGxheWVyO1xyXG5cclxubGV0ICRucCA9IHsgfTtcclxuXHJcbmlmIChcIm1lZGlhU2Vzc2lvblwiIGluIG5hdmlnYXRvcikge1xyXG4gICAgbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5tZXRhZGF0YSA9IG5ldyBNZWRpYU1ldGFkYXRhKHtcclxuICAgICAgICBcInRpdGxlXCI6IFwiVW5kZXIgQ292ZXIgb2YgRGFya25lc3NcIixcclxuICAgICAgICBcImFydGlzdFwiOiBcIlRoZSBTdHJva2VzXCIsXHJcbiAgICAgICAgXCJhbGJ1bVwiOiBcIkFuZ2xlc1wiLFxyXG4gICAgICAgIFwiYXJ0d29ya1wiOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwic3JjXCI6IFwiaHR0cHM6Ly9saDMuZ2dwaHQuY29tL0NjNFRaS0hScV9yZENodWpzWV9fUVNNTzBIY213OWtQb211OXpFMDZ2ei10aktnaVZhUG80ZXZtSXlONkdwMW93bDl1UktfckUtY1wiLFxyXG4gICAgICAgICAgICAgICAgXCJzaXplc1wiOiBcIjUxMng1MTJcIixcclxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImltYWdlL3BuZ1wiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICB9KTtcclxuXHJcbiAgICBuYXZpZ2F0b3IubWVkaWFTZXNzaW9uLnNldEFjdGlvbkhhbmRsZXIoXCJwbGF5XCIsIGFwcC5QbGF5ZXIucGxheSk7XHJcbiAgICBuYXZpZ2F0b3IubWVkaWFTZXNzaW9uLnNldEFjdGlvbkhhbmRsZXIoXCJwYXVzZVwiLCBhcHAuUGxheWVyLnBhdXNlKTtcclxuICAgIC8vIG5hdmlnYXRvci5tZWRpYVNlc3Npb24uc2V0QWN0aW9uSGFuZGxlcihcInNlZWtiYWNrd2FyZFwiLCBmdW5jdGlvbiAoKSB7IH0pO1xyXG4gICAgLy8gbmF2aWdhdG9yLm1lZGlhU2Vzc2lvbi5zZXRBY3Rpb25IYW5kbGVyKFwic2Vla2ZvcndhcmRcIiwgZnVuY3Rpb24gKCkgeyB9KTtcclxuICAgIC8vIG5hdmlnYXRvci5tZWRpYVNlc3Npb24uc2V0QWN0aW9uSGFuZGxlcihcInByZXZpb3VzdHJhY2tcIiwgZnVuY3Rpb24gKCkgeyB9KTtcclxuICAgIC8vIG5hdmlnYXRvci5tZWRpYVNlc3Npb24uc2V0QWN0aW9uSGFuZGxlcihcIm5leHR0cmFja1wiLCBmdW5jdGlvbiAoKSB7IH0pO1xyXG59XHJcblxyXG4kKGZ1bmN0aW9uKCkge1xyXG4gICAgJHBsYXllciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJhdWRpby5wbGF5ZXJcIik7XHJcblxyXG4gICAgJG5wLnBvc2l0aW9uID0gJChcIi5ub3ctcGxheWluZyAucG9zaXRpb25cIik7XHJcbiAgICAkbnAubGVuZ3RoID0gJChcIi5ub3ctcGxheWluZyAubGVuZ3RoXCIpO1xyXG4gICAgJG5wLnRpbWVsaW5lID0gJChcIi5ub3ctcGxheWluZyAuYmFyXCIpO1xyXG4gICAgJG5wLmVsYXBzZWQgPSAkKFwiLm5vdy1wbGF5aW5nIC5lbGFwc2VkXCIpO1xyXG5cclxuICAgICRwbGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRpbWV1cGRhdGVcIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgbGV0IGxlbmd0aCA9IGR1cmF0aW9uKCRwbGF5ZXIuZHVyYXRpb24pO1xyXG4gICAgICAgICRucC5sZW5ndGgudGV4dChsZW5ndGgpO1xyXG5cclxuICAgICAgICBsZXQgcG9zaXRpb24gPSBkdXJhdGlvbigkcGxheWVyLmN1cnJlbnRUaW1lKTtcclxuICAgICAgICAkbnAucG9zaXRpb24udGV4dChwb3NpdGlvbik7XHJcblxyXG4gICAgICAgIGxldCBwZXJjZW50ID0gJHBsYXllci5jdXJyZW50VGltZSAvICRwbGF5ZXIuZHVyYXRpb24gKiAxMDA7XHJcbiAgICAgICAgJG5wLmVsYXBzZWQuY3NzKFwid2lkdGhcIiwgcGVyY2VudCArIFwiJVwiKTtcclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2cocG9zaXRpb25faXNfc2Vjb25kcywgaHVtYW5fcG9zaXRpb24pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgJHVpW1wibm93LXBsYXlpbmdcIl0gPSAkKFwiLm5vdy1wbGF5aW5nXCIpO1xyXG4gICAgJChcIi5wbGF5XCIsICR1aVtcIm5vdy1wbGF5aW5nXCJdKS5vbihcImNsaWNrXCIsIGFwcC5QbGF5ZXIucGxheVBhdXNlKTtcclxuXHJcbiAgICAvLyBDbGlxdWVzIG5hIGxpbmhhIGRvIHRlbXBvXHJcbiAgICAkbnAudGltZWxpbmUub24oXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcclxuICAgICAgICBsZXQgd2lkdGggPSAkKGV2ZW50LmRlbGVnYXRlVGFyZ2V0KS53aWR0aCgpO1xyXG4gICAgICAgIGxldCBwb3NpdGlvbiA9IGV2ZW50Lm9mZnNldFg7XHJcbiAgICAgICAgbGV0IHBlcmNlbnQgPSBwb3NpdGlvbiAvIHdpZHRoO1xyXG5cclxuICAgICAgICBsZXQgcG9zaXRpb25faW5fc2Vjb25kcyA9ICRwbGF5ZXIuZHVyYXRpb24gKiBwZXJjZW50O1xyXG4gICAgICAgIGFwcC5QbGF5ZXIuc2tpcFRvUG9zaXRpb24ocG9zaXRpb25faW5fc2Vjb25kcyk7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5hcHAuUGxheWVyID0gKCgpID0+IHtcclxuXHJcbiAgICAvLyBjb25zdCB1cGRhdGVUaW1lbGluZVxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLlBsYXllci5za2lwVG9Qb3NpdGlvbigpXHJcbiAgICBjb25zdCBza2lwVG9Qb3NpdGlvbiA9IChzZWNvbmRzKSA9PiB7XHJcbiAgICAgICAgJHBsYXllci5jdXJyZW50VGltZSA9IHNlY29uZHM7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIC8vIGFwcC5QbGF5ZXIucGxheSgpXHJcbiAgICBjb25zdCBwbGF5ID0gKCkgPT4ge1xyXG4gICAgICAgICRwbGF5ZXIucGxheSgpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuUGxheWVyLnBhdXNlKClcclxuICAgIGNvbnN0IHBhdXNlID0gKCkgPT4ge1xyXG4gICAgICAgICRwbGF5ZXIucGF1c2UoKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gYXBwLlBsYXllci5wbGF5UGF1c2UoKVxyXG4gICAgY29uc3QgcGxheVBhdXNlID0gKCkgPT4ge1xyXG4gICAgICAgIGlmICgkcGxheWVyLnBhdXNlZCkge1xyXG4gICAgICAgICAgICAkcGxheWVyLnBsYXkoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkcGxheWVyLnBhdXNlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImR1cmF0aW9uXCIsICRwbGF5ZXIuZHVyYXRpb24pO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwidm9sdW1lXCIsICRwbGF5ZXIudm9sdW1lKTtcclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJidWZmZXJlZFwiLCAkcGxheWVyLmJ1ZmZlcmVkKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIm5ldHdvcmtTdGF0ZVwiLCAkcGxheWVyLm5ldHdvcmtTdGF0ZSk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJwbGF5ZWRcIiwgJHBsYXllci5wbGF5ZWQpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwicmVhZHlTdGF0ZVwiLCAkcGxheWVyLnJlYWR5U3RhdGUpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwic2Vla2FibGVcIiwgJHBsYXllci5zZWVrYWJsZSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHNraXBUb1Bvc2l0aW9uLFxyXG4gICAgICAgIHBsYXksXHJcbiAgICAgICAgcGF1c2UsXHJcbiAgICAgICAgcGxheVBhdXNlXHJcbiAgICB9O1xyXG59KSgpO1xyXG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIGFydGlzdCAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuYXBwLkFydGlzdCA9ICgoKSA9PiB7XHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuQXJ0aXN0LmxvYWQoKVxyXG4gICAgY29uc3QgbG9hZCA9IChhcnRpc3RfaWQpID0+IHtcclxuICAgICAgICAkLmdldChcImRhdGEvYXJ0aXN0cy9cIiArIGFydGlzdF9pZCArIFwiLmpzb25cIikuZG9uZSgocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgbGV0IGFydGlzdCA9IHJlc3BvbnNlO1xyXG4gICAgICAgICAgICBsZXQgJGFydGlzdCA9IF9fcmVuZGVyKFwiYXJ0aXN0XCIsIGFydGlzdCk7XHJcblxyXG4gICAgICAgICAgICAvLyDDgWxidW5zXHJcbiAgICAgICAgICAgIGxldCBhbGJ1bXMgPSBhcnRpc3RbXCJhbGJ1bXNcIl07XHJcbiAgICAgICAgICAgIGxldCAkYWxidW1zID0gJChcIi5hbGJ1bXNcIiwgJGFydGlzdCk7XHJcblxyXG4gICAgICAgICAgICBhbGJ1bXMuZm9yRWFjaCgoYWxidW0pID0+IHtcclxuICAgICAgICAgICAgICAgIGFsYnVtW1wiY292ZXItYXJ0XCJdID0gXCJiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJ1wiICsgYWxidW1bXCJjb3ZlclwiXSArIFwiJylcIjtcclxuICAgICAgICAgICAgICAgIGxldCAkYWxidW0gPSBfX3JlbmRlcihcImFydGlzdC1hbGJ1bVwiLCBhbGJ1bSkuYXBwZW5kVG8oJGFsYnVtcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gSGl0c1xyXG4gICAgICAgICAgICBsZXQgaGl0cyA9IGFydGlzdFtcImhpdHNcIl07XHJcbiAgICAgICAgICAgIGxldCAkaGl0cyA9ICQoXCIuaGl0c1wiLCAkYXJ0aXN0KTtcclxuXHJcbiAgICAgICAgICAgIGhpdHMuZm9yRWFjaCgoaGl0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBoaXRbXCJmb3JtYXR0ZWQtbGVuZ3RoXCJdID0gZHVyYXRpb24oaGl0W1wibGVuZ3RoXCJdKTtcclxuICAgICAgICAgICAgICAgIGxldCAkaGl0ID0gX19yZW5kZXIoXCJhcnRpc3QtaGl0XCIsIGhpdCkuYXBwZW5kVG8oJGhpdHMpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIENvbG9jYSBuYSB0ZWxhXHJcbiAgICAgICAgICAgICR1aVtcImxpYnJhcnlcIl0uZW1wdHkoKS5hcHBlbmQoJGFydGlzdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGxvYWRcclxuICAgIH07XHJcbn0pKCk7XHJcbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gc3RhcnQgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4kKGZ1bmN0aW9uKCkge1xyXG4gICAgYXBwLkFydGlzdC5sb2FkKFwidGhlLWJlYXRsZXNcIik7XHJcbn0pO1xyXG4iXX0=
