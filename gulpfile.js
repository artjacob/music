////////////////////////////////////////////////////////////////////////////////////////////////////
// gulp ////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
const gulp = require("gulp");
const browserSync = require("browser-sync").create("gulp");

// CSS
const css = require("./dev/gulp-css.js");
gulp.task("watch-css", gulp.series(css["watch"]));
gulp.task("stage-css", gulp.series(css["stage"]));
// gulp.task("deploy-css", gulp.series(css["deploy"]));

// JS
const js = require("./dev/gulp-js.js");
gulp.task("watch-js", gulp.series(js["watch"]));
gulp.task("stage-js", gulp.series(js["stage"]));
// gulp.task("deploy-js", gulp.series(js["deploy"]));

// HTML
const html = require("./dev/gulp-html.js");
gulp.task("watch-html", gulp.series(html["watch"]));
gulp.task("stage-html", gulp.series(html["stage"]));
// gulp.task("deploy-html", gulp.series(html["deploy"]));

// Assets
const assets = require("./dev/gulp-assets.js");
gulp.task("watch-assets", gulp.series(assets["watch"]));
gulp.task("stage-assets", gulp.series(assets["stage"]));
// gulp.task("deploy-assets", gulp.series(assets["deploy"]));

////////////////////////////////////////////////////////////////////////////////////////////////////

gulp.task("watch", gulp.parallel(html["watch"], css["watch"], js["watch"], assets["watch"]));
gulp.task("stage", gulp.series(gulp.parallel(css["stage"], js["stage"], assets["stage"]), html["stage"]));
// gulp.task("deploy-assets", gulp.parallel(css["deploy"], js["deploy"]));
// gulp.task("deploy", gulp.series("deploy-assets", html["deploy"]));
gulp.task("default", gulp.parallel("stage"));

gulp.task("serve", gulp.parallel("watch", function serve(done) {
	browserSync.init({
		"logFileChanges": false,
		"notify": false,
		"open": (process.argv.includes("-s") ? false : true),
		"server": "./public",
		// "serveStatic": [{
		// 	"route": "/assets",
		// 	"dir": "bower_components"
		// }]
	});
	done();
}));
