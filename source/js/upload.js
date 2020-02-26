////////////////////////////////////////////////////////////////////////////////////////////////////
// upload //////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// const musicStorage = storage.child("songs");

const $upload = $(".upload");
const dropzone = new Dropzone(".upload", {
	url: "/upload",
	acceptedFiles: "audio/*"
});

// Mostra/esconde dropzone ao entrar com arquivo na página
$(window).on("dragenter", (event) => {
	$upload.addClass("-state--active");
});

$(window).on("dragleave", (event) => {
	if ($(event.target).hasClass("upload")) {
		$upload.removeClass("-state--active");
	}
});

// Arquivo adicionado
dropzone.on("addedfile", (file) => {
	console.log(file);

	jsmediatags.read(file, {
		onSuccess: tags => {
			console.log(tags);
			// return false;

			const fileInfo = structureTagsFromFile(tags);
			const fileRef = `songs/${user.uid}/${file.name}`;
			fileInfo["fileRef"] = fileRef;

			const uploadTask = storage.child(fileRef).put(file);
			uploadTask.on("state_changed", (snapshot) => {
				const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
				console.log("Upload is " + progress + "% done");

				// switch (snapshot.state) {
				// 	case "paused":
				// 		console.log("Upload is paused");
				// 		break;
				// 	case "running":
				// 		console.log("Upload is running");
				// 		break;
				// }
			}, (error) => {
				console.log(error);
			}, () => {
				// Quando terminar o upload, insere a música no banco
				db.collection(`users/${user.uid}/songs`).add(fileInfo);

				uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
					console.log("File available at", downloadURL);
				});
			});

		},
		onError: error => {
			console.log(error);
		}
	});



});

const structureTagsFromFile = (file) => {
	const tags = file.tags;

	let data = {
		"title": tags.title,
		"sortTitle": null,
		"artist": tags.artist,
		"sortArtist": null,
		"albumTitle": tags.album,
		"sortalbumTitle": null,
		"albumTrackNumber": (tags.track? tags.track.split("/")[0] : null),
		"albumTrackCount": null,
		"albumArtist": null,
		"releaseDate": tags.year,
		"releaseYear": moment(tags.year, [moment.defaultFormatUtc, moment.defaultFormat, "YYYY"]).year(),
		"fileType": null,
	};

	if (file.type === "MP4") {
		data["sortTitle"] = (tags.sonm? tags.sonm.data : tags.title);
		data["sortArtist"] = (tags.soar? tags.soar.data : tags.artist);
		data["sortAlbumTitle"] = (tags.soal? tags.soal.data : tags.album);
		data["albumTrackCount"] = (tags.trkn && tags.trkn.data? tags.trkn.data.total : null);
		data["albumArtist"] = (tags.aART? tags.aART.data : null);
		data["fileType"] = file.ftyp.trim().toLowerCase();
	} else if (file.type === "ID3") {
		data["sortTitle"] = (tags.sonm? tags.sonm.data : tags.title);
		data["fileType"] = "mp3";

	}

	return data;
};
