////////////////////////////////////////////////////////////////////////////////////////////////////
// upload //////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

const storage = firebase.storage().ref();
// const musicStorage = storage.child("songs");

const $upload = $(".upload");
const dropzone = new Dropzone(".upload", { url: "/upload" });

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
	const uploadTask = storage.child(`songs/${user.uid}/${file.name}`).put(file);

	uploadTask.on("state_changed",
		(snapshot) => {
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
		uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
			console.log("File available at", downloadURL);
		});
	});

	jsmediatags.read(file, {
		onSuccess: function (tag) {
			console.log(tag);
		},
		onError: function (error) {
			console.log(error);
		}
	});
});
