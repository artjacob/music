////////////////////////////////////////////////////////////////////////////////////////////////////
// gulp / config ///////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
let config = { };

// CSS
config["css"] = {
	"color": "cyan",
	"dir": "./source/css/",
	"watch": ["**/**.scss"],
	"source": ["./source/css/music.scss"],
	"destination": {
		"development": "./public/"
	}
};

// JS
config["js"] = {
	"color": "yellow",
	"dir": "./source/js/",
	"watch": ["**/**.js", "**/**.json"],
	"source": ["./source/js/modules.json"],
	"destination": {
		"development": "./public/"
	}
};

// HTML
config["html"] = {
	"color": "magenta",
	"dir": "./source/html/",
	"watch": ["**/**.pug", "**/**.html"],
	"source": ["./source/html/music.pug"],
	"destination": {
		"development": "./public/",
		"production": "./deploy/"
	}
};

// Assets
config["assets"] = {
	"color": "green",
	"dir": "./source/assets/",
	"watch": ["**"],
	"files": [
		// // Service Worker e Manifest
		// {
		// 	"title": "service-worker",
		// 	"type": "js",
		// 	"source": "./source/assets/service-worker.js",
		// 	"destination": {
		// 		"development": "./public/",
		// 		"production": "./deploy/"
		// 	},
		// 	"filename": "service-worker.js"
		// },
		// {
		// 	"title": "manifest",
		// 	"type": "json",
		// 	"source": "./source/assets/manifest.json",
		// 	"destination": {
		// 		"development": "./public/",
		// 		"production": "./deploy/"
		// 	},
		// 	"filename": "manifest.json"
		// },

		// // Ícone
		// {
		// 	"title": "icon",
		// 	"type": "png",
		// 	"source": "./source/assets/icon.png",
		// 	"destination": {
		// 		"development": "./public/",
		// 		"production": "./deploy/"
		// 	},
		// 	"filename": "icon.png"
		// },

		// // Fontes
		// {
		// 	"title": "material-icons",
		// 	"type": "font",
		// 	"source": "./source/assets/material-icons.woff2",
		// 	"destination": {
		// 		"development": "./public/",
		// 		"production": "./deploy/"
		// 	},
		// 	"filename": "material-icons.woff2"
		// }
	]
};

module.exports = config;
