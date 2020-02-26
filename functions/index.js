const admin = require("firebase-admin");
const functions = require("firebase-functions");

const gcpRegion = "us-east1";

const runtimeOptions = {
	"memory": "128MB",
	"timeoutSeconds": 10
};

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.createNewUser = functions.region(gcpRegion).runWith(runtimeOptions).auth.user().onCreate(user => {
	const uid = user.uid;
	const userJson = user.toJSON();
	const userData = {
		"displayName": userJson.displayName,
		"email": userJson.email,
		"phoneNumber": userJson.phoneNumber,
		"photoURL": userJson.photoURL,
		"providerData": { },
		"creationTime": userJson.metadata.creationTime,
		"lastSignInTime": userJson.metadata.lastSignInTime,
		"disabled": userJson.disabled,
	};

	// Provider data
	userJson.providerData.forEach(provider => {
		const providerId = provider.providerId;
		let filteredProviderData = { };

		for (const property in provider) {
			if (typeof provider[property] !== "function" && property !== "providerId") {
				filteredProviderData[property] = provider[property];
			}
		}

		userData.providerData[providerId] = filteredProviderData;
	});

	db.collection("users").doc(uid).set({ "userData": userData });

	return true;
});
