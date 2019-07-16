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
}); ////////////////////////////////////////////////////////////////////////////////////////////////////
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhc2UuanMiLCJ0ZW1wbGF0ZS1lbmdpbmUuanMiLCJhcnRpc3QuanMiLCJzdGFydC5qcyJdLCJuYW1lcyI6WyJhcHAiLCJ1aSIsIiR1aSIsImN1ZSIsIiQiLCJ0ZW1wbGF0ZSIsIiR0ZW1wbGF0ZXMiLCJlYWNoIiwiJHRoaXMiLCJuYW1lIiwiYXR0ciIsImh0bWwiLCJyZW1vdmUiLCJyZW5kZXIiLCJkYXRhIiwiJHJlbmRlciIsImNsb25lIiwiZm4iLCJmaWxsQmxhbmtzIiwiJGJsYW5rIiwiZmlsbCIsInJ1bGVzIiwic3BsaXQiLCJpIiwibGVuZ3RoIiwicGFpciIsImRlc3QiLCJ0cmltIiwic291cmNlIiwidmFsdWUiLCJqIiwiYWRkQ2xhc3MiLCJ2YWwiLCJpZl9udWxsIiwiaGlkZSIsInJlbW92ZUNsYXNzIiwicmVtb3ZlQXR0ciIsImhhc0NsYXNzIiwiX19yZW5kZXIiLCJBcnRpc3QiLCJsb2FkIiwiYXJ0aXN0X2lkIiwiZ2V0IiwiZG9uZSIsInJlc3BvbnNlIiwiYXJ0aXN0IiwiJGFydGlzdCIsImFsYnVtcyIsIiRhbGJ1bXMiLCJmb3JFYWNoIiwiYWxidW0iLCIkYWxidW0iLCJhcHBlbmRUbyIsImVtcHR5IiwiYXBwZW5kIl0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtBQUVBLElBQUFBLEdBQUEsR0FBQSxFQUFBO0FBRUEsSUFBQUMsRUFBQSxHQUFBLEVBQUE7QUFDQSxJQUFBQyxHQUFBLEdBQUEsRUFBQTtBQUVBLElBQUFDLEdBQUEsR0FBQSxFQUFBLEMsQ0FLQTs7QUFDQUMsQ0FBQSxDQUFBLFlBQUE7QUFDQUYsRUFBQUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxHQUFBRSxDQUFBLENBQUEsVUFBQSxDQUFBO0FBQ0EsQ0FGQSxDQUFBLEMsQ0NmQTtBQUNBO0FBQ0E7O0FBRUFILEVBQUEsQ0FBQUksUUFBQSxHQUFBLFlBQUE7QUFDQSxNQUFBQyxVQUFBLEdBQUEsRUFBQTtBQUVBRixFQUFBQSxDQUFBLENBQUEsWUFBQTtBQUNBQSxJQUFBQSxDQUFBLENBQUEsVUFBQSxDQUFBLENBQUFHLElBQUEsQ0FBQSxZQUFBO0FBQ0EsVUFBQUMsS0FBQSxHQUFBSixDQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsVUFBQUssSUFBQSxHQUFBRCxLQUFBLENBQUFFLElBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxVQUFBQyxJQUFBLEdBQUFILEtBQUEsQ0FBQUcsSUFBQSxFQUFBO0FBRUFMLE1BQUFBLFVBQUEsQ0FBQUcsSUFBQSxDQUFBLEdBQUFMLENBQUEsQ0FBQU8sSUFBQSxDQUFBO0FBQ0FILE1BQUFBLEtBQUEsQ0FBQUksTUFBQTtBQUNBLEtBUEE7QUFRQSxHQVRBLENBQUE7O0FBV0EsTUFBQUMsTUFBQSxHQUFBLFNBQUFBLE1BQUEsQ0FBQVIsUUFBQSxFQUFBUyxJQUFBLEVBQUE7QUFDQSxRQUFBLENBQUFSLFVBQUEsQ0FBQUQsUUFBQSxDQUFBLEVBQUE7QUFBQSxhQUFBLEtBQUE7QUFBQTs7QUFDQSxRQUFBVSxPQUFBLEdBQUFULFVBQUEsQ0FBQUQsUUFBQSxDQUFBLENBQUFXLEtBQUEsRUFBQTtBQUVBRCxJQUFBQSxPQUFBLENBQUFELElBQUEsQ0FBQUEsSUFBQTs7QUFFQVYsSUFBQUEsQ0FBQSxDQUFBYSxFQUFBLENBQUFDLFVBQUEsR0FBQSxZQUFBO0FBQ0EsVUFBQUMsTUFBQSxHQUFBZixDQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsVUFBQWdCLElBQUEsR0FBQUQsTUFBQSxDQUFBTCxJQUFBLENBQUEsTUFBQSxDQUFBO0FBRUEsVUFBQU8sS0FBQSxHQUFBRCxJQUFBLENBQUFFLEtBQUEsQ0FBQSxHQUFBLENBQUE7O0FBQ0EsV0FBQSxJQUFBQyxDQUFBLEdBQUEsQ0FBQSxFQUFBQSxDQUFBLEdBQUFGLEtBQUEsQ0FBQUcsTUFBQSxFQUFBRCxDQUFBLEVBQUEsRUFBQTtBQUNBLFlBQUFFLElBQUEsR0FBQUosS0FBQSxDQUFBRSxDQUFBLENBQUEsQ0FBQUQsS0FBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLFlBQUFJLElBQUEsR0FBQUQsSUFBQSxDQUFBLENBQUEsQ0FBQSxHQUFBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLENBQUFFLElBQUEsRUFBQSxHQUFBLE1BQUE7QUFDQSxZQUFBQyxNQUFBLEdBQUFILElBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBRSxJQUFBLEVBQUEsR0FBQUYsSUFBQSxDQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUFJLEtBQUEsR0FBQWYsSUFBQSxDQUFBYyxNQUFBLENBQUE7QUFFQUEsUUFBQUEsTUFBQSxHQUFBQSxNQUFBLENBQUFOLEtBQUEsQ0FBQSxHQUFBLENBQUE7O0FBQ0EsWUFBQU0sTUFBQSxDQUFBSixNQUFBLEdBQUEsQ0FBQSxJQUFBLE9BQUFLLEtBQUEsS0FBQSxXQUFBLEVBQUE7QUFDQUEsVUFBQUEsS0FBQSxHQUFBZixJQUFBLENBQUFjLE1BQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQTs7QUFFQSxlQUFBLElBQUFFLENBQUEsR0FBQSxDQUFBLEVBQUFBLENBQUEsR0FBQUYsTUFBQSxDQUFBSixNQUFBLEVBQUFNLENBQUEsRUFBQSxFQUFBO0FBQ0FELFlBQUFBLEtBQUEsR0FBQUEsS0FBQSxDQUFBRCxNQUFBLENBQUFFLENBQUEsQ0FBQSxDQUFBLEdBQUFELEtBQUEsQ0FBQUQsTUFBQSxDQUFBRSxDQUFBLENBQUEsQ0FBQSxHQUFBLElBQUE7QUFDQTtBQUNBOztBQUVBLFlBQUEsT0FBQUQsS0FBQSxLQUFBLFdBQUEsSUFBQUEsS0FBQSxLQUFBLElBQUEsRUFBQTtBQUNBLGNBQUFILElBQUEsS0FBQSxPQUFBLEVBQUE7QUFDQVAsWUFBQUEsTUFBQSxDQUFBWSxRQUFBLENBQUFGLEtBQUE7QUFDQSxXQUZBLE1BRUEsSUFBQUgsSUFBQSxLQUFBLE1BQUEsRUFBQTtBQUNBUCxZQUFBQSxNQUFBLENBQUFSLElBQUEsQ0FBQWtCLEtBQUE7QUFDQSxXQUZBLE1BRUEsSUFBQUgsSUFBQSxLQUFBLE9BQUEsRUFBQTtBQUNBUCxZQUFBQSxNQUFBLENBQUFhLEdBQUEsQ0FBQUgsS0FBQTtBQUNBLFdBRkEsTUFFQTtBQUNBVixZQUFBQSxNQUFBLENBQUFULElBQUEsQ0FBQWdCLElBQUEsRUFBQUcsS0FBQTtBQUNBO0FBQ0EsU0FWQSxNQVVBO0FBQ0EsY0FBQUksT0FBQSxHQUFBZCxNQUFBLENBQUFMLElBQUEsQ0FBQSxXQUFBLENBQUE7O0FBQ0EsY0FBQW1CLE9BQUEsS0FBQSxNQUFBLEVBQUE7QUFDQWQsWUFBQUEsTUFBQSxDQUFBZSxJQUFBO0FBQ0EsV0FGQSxNQUVBLElBQUFELE9BQUEsS0FBQSxRQUFBLEVBQUE7QUFDQWQsWUFBQUEsTUFBQSxDQUFBUCxNQUFBO0FBQ0E7QUFDQTtBQUNBOztBQUVBTyxNQUFBQSxNQUFBLENBQ0FnQixXQURBLENBQ0EsTUFEQSxFQUVBQyxVQUZBLENBRUEsV0FGQSxFQUdBQSxVQUhBLENBR0EsZ0JBSEE7QUFJQSxLQTVDQTs7QUE4Q0EsUUFBQXJCLE9BQUEsQ0FBQXNCLFFBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQTtBQUNBdEIsTUFBQUEsT0FBQSxDQUFBRyxVQUFBO0FBQ0E7O0FBRUFkLElBQUFBLENBQUEsQ0FBQSxPQUFBLEVBQUFXLE9BQUEsQ0FBQSxDQUFBUixJQUFBLENBQUEsWUFBQTtBQUNBSCxNQUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLENBQUFjLFVBQUE7QUFDQSxLQUZBO0FBSUEsV0FBQUgsT0FBQTtBQUNBLEdBN0RBOztBQStEQSxTQUFBO0FBQ0FGLElBQUFBLE1BQUEsRUFBQUE7QUFEQSxHQUFBO0FBR0EsQ0FoRkEsRUFBQTs7QUFrRkEsSUFBQXlCLFFBQUEsR0FBQXJDLEVBQUEsQ0FBQUksUUFBQSxDQUFBUSxNQUFBLEMsQ0N0RkE7QUFDQTtBQUNBOztBQUVBYixHQUFBLENBQUF1QyxNQUFBLEdBQUEsWUFBQTtBQUVBO0FBQ0E7QUFDQSxNQUFBQyxJQUFBLEdBQUEsU0FBQUEsSUFBQSxDQUFBQyxTQUFBLEVBQUE7QUFDQXJDLElBQUFBLENBQUEsQ0FBQXNDLEdBQUEsQ0FBQSxrQkFBQUQsU0FBQSxHQUFBLE9BQUEsRUFBQUUsSUFBQSxDQUFBLFVBQUFDLFFBQUEsRUFBQTtBQUNBLFVBQUFDLE1BQUEsR0FBQUQsUUFBQTs7QUFDQSxVQUFBRSxPQUFBLEdBQUFSLFFBQUEsQ0FBQSxRQUFBLEVBQUFPLE1BQUEsQ0FBQSxDQUZBLENBSUE7OztBQUNBLFVBQUFFLE1BQUEsR0FBQUYsTUFBQSxDQUFBLFFBQUEsQ0FBQTtBQUNBLFVBQUFHLE9BQUEsR0FBQTVDLENBQUEsQ0FBQSxTQUFBLEVBQUEwQyxPQUFBLENBQUE7QUFFQUMsTUFBQUEsTUFBQSxDQUFBRSxPQUFBLENBQUEsVUFBQUMsS0FBQSxFQUFBO0FBQ0FBLFFBQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsR0FBQSw0QkFBQUEsS0FBQSxDQUFBLE9BQUEsQ0FBQSxHQUFBLElBQUE7O0FBQ0EsWUFBQUMsTUFBQSxHQUFBYixRQUFBLENBQUEsY0FBQSxFQUFBWSxLQUFBLENBQUEsQ0FBQUUsUUFBQSxDQUFBSixPQUFBLENBQUE7QUFDQSxPQUhBLEVBUkEsQ0FhQTs7QUFDQTlDLE1BQUFBLEdBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQW1ELEtBQUEsR0FBQUMsTUFBQSxDQUFBUixPQUFBO0FBQ0EsS0FmQTtBQWdCQSxHQWpCQSxDQUpBLENBd0JBOzs7QUFFQSxTQUFBO0FBQ0FOLElBQUFBLElBQUEsRUFBQUE7QUFEQSxHQUFBO0FBR0EsQ0E3QkEsRUFBQSxDLENDSkE7QUFDQTtBQUNBOzs7QUFFQXBDLENBQUEsQ0FBQSxZQUFBO0FBQ0FKLEVBQUFBLEdBQUEsQ0FBQXVDLE1BQUEsQ0FBQUMsSUFBQSxDQUFBLGFBQUE7QUFDQSxDQUZBLENBQUEiLCJmaWxlIjoibXVzaWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIGJhc2UgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxubGV0IGFwcCA9IHsgfTtcclxuXHJcbmxldCB1aSA9IHsgfTtcclxubGV0ICR1aSA9IHsgfTtcclxuXHJcbmxldCBjdWUgPSB7IH07XHJcblxyXG5cclxuXHJcblxyXG4vLyBUT0RPOiBtb3ZlciBwYXJhIGx1Z2FyIGFwcm9wcmlhZG9cclxuJChmdW5jdGlvbigpIHtcclxuICAgICR1aVtcImxpYnJhcnlcIl0gPSAkKFwiLmxpYnJhcnlcIik7XHJcbn0pO1xyXG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIGNvcmUgLyB0ZW1wbGF0ZSBlbmdpbmUgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxudWkudGVtcGxhdGUgPSAoKCkgPT4ge1xyXG4gICAgbGV0ICR0ZW1wbGF0ZXMgPSB7IH07XHJcblxyXG4gICAgJChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJChcInRlbXBsYXRlXCIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9ICR0aGlzLmF0dHIoXCJpZFwiKTtcclxuICAgICAgICAgICAgdmFyIGh0bWwgPSAkdGhpcy5odG1sKCk7XHJcblxyXG4gICAgICAgICAgICAkdGVtcGxhdGVzW25hbWVdID0gJChodG1sKTtcclxuICAgICAgICAgICAgJHRoaXMucmVtb3ZlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCByZW5kZXIgPSAodGVtcGxhdGUsIGRhdGEpID0+IHtcclxuICAgICAgICBpZiAoISR0ZW1wbGF0ZXNbdGVtcGxhdGVdKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIHZhciAkcmVuZGVyID0gJHRlbXBsYXRlc1t0ZW1wbGF0ZV0uY2xvbmUoKTtcclxuXHJcbiAgICAgICAgJHJlbmRlci5kYXRhKGRhdGEpO1xyXG5cclxuICAgICAgICAkLmZuLmZpbGxCbGFua3MgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkYmxhbmsgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICB2YXIgZmlsbCA9ICRibGFuay5kYXRhKFwiZmlsbFwiKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBydWxlcyA9IGZpbGwuc3BsaXQoXCIsXCIpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFpciA9IHJ1bGVzW2ldLnNwbGl0KFwiOlwiKTtcclxuICAgICAgICAgICAgICAgIHZhciBkZXN0ID0gKHBhaXJbMV0gPyBwYWlyWzBdLnRyaW0oKSA6IFwiaHRtbFwiKTtcclxuICAgICAgICAgICAgICAgIHZhciBzb3VyY2UgPSAocGFpclsxXSA/IHBhaXJbMV0udHJpbSgpIDogcGFpclswXSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW3NvdXJjZV07XHJcblxyXG4gICAgICAgICAgICAgICAgc291cmNlID0gc291cmNlLnNwbGl0KFwiL1wiKTtcclxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2UubGVuZ3RoID4gMSAmJiB0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGRhdGFbc291cmNlWzBdXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDE7IGogPCBzb3VyY2UubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAodmFsdWVbc291cmNlW2pdXSkgPyB2YWx1ZVtzb3VyY2Vbal1dIDogbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiB2YWx1ZSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZXN0ID09PSBcImNsYXNzXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGJsYW5rLmFkZENsYXNzKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlc3QgPT09IFwiaHRtbFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRibGFuay5odG1sKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlc3QgPT09IFwidmFsdWVcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsudmFsKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsuYXR0cihkZXN0LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWZfbnVsbCA9ICRibGFuay5kYXRhKFwiZmlsbC1udWxsXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpZl9udWxsID09PSBcImhpZGVcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaWZfbnVsbCA9PT0gXCJyZW1vdmVcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkYmxhbmsucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAkYmxhbmtcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhcImZpbGxcIilcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVBdHRyKFwiZGF0YS1maWxsXCIpXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlQXR0cihcImRhdGEtZmlsbC1udWxsXCIpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICgkcmVuZGVyLmhhc0NsYXNzKFwiZmlsbFwiKSkge1xyXG4gICAgICAgICAgICAkcmVuZGVyLmZpbGxCbGFua3MoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICQoXCIuZmlsbFwiLCAkcmVuZGVyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJCh0aGlzKS5maWxsQmxhbmtzKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiAkcmVuZGVyO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVuZGVyXHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxubGV0IF9fcmVuZGVyID0gdWkudGVtcGxhdGUucmVuZGVyO1xyXG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIGFydGlzdCAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuYXBwLkFydGlzdCA9ICgoKSA9PiB7XHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgICAvLyBhcHAuQXJ0aXN0LmxvYWQoKVxyXG4gICAgY29uc3QgbG9hZCA9IChhcnRpc3RfaWQpID0+IHtcclxuICAgICAgICAkLmdldChcImRhdGEvYXJ0aXN0cy9cIiArIGFydGlzdF9pZCArIFwiLmpzb25cIikuZG9uZSgocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgbGV0IGFydGlzdCA9IHJlc3BvbnNlO1xyXG4gICAgICAgICAgICBsZXQgJGFydGlzdCA9IF9fcmVuZGVyKFwiYXJ0aXN0XCIsIGFydGlzdCk7XHJcblxyXG4gICAgICAgICAgICAvLyDDgWxidW5zXHJcbiAgICAgICAgICAgIGxldCBhbGJ1bXMgPSBhcnRpc3RbXCJhbGJ1bXNcIl07XHJcbiAgICAgICAgICAgIGxldCAkYWxidW1zID0gJChcIi5hbGJ1bXNcIiwgJGFydGlzdCk7XHJcblxyXG4gICAgICAgICAgICBhbGJ1bXMuZm9yRWFjaCgoYWxidW0pID0+IHtcclxuICAgICAgICAgICAgICAgIGFsYnVtW1wiY292ZXItYXJ0XCJdID0gXCJiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJ1wiICsgYWxidW1bXCJjb3ZlclwiXSArIFwiJylcIjtcclxuICAgICAgICAgICAgICAgIGxldCAkYWxidW0gPSBfX3JlbmRlcihcImFydGlzdC1hbGJ1bVwiLCBhbGJ1bSkuYXBwZW5kVG8oJGFsYnVtcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gQ29sb2NhIG5hIHRlbGFcclxuICAgICAgICAgICAgJHVpW1wibGlicmFyeVwiXS5lbXB0eSgpLmFwcGVuZCgkYXJ0aXN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbG9hZFxyXG4gICAgfTtcclxufSkoKTtcclxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBzdGFydCAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbiQoZnVuY3Rpb24oKSB7XHJcbiAgICBhcHAuQXJ0aXN0LmxvYWQoXCJ0aGUtYmVhdGxlc1wiKTtcclxufSk7XHJcbiJdfQ==