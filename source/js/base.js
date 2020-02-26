////////////////////////////////////////////////////////////////////////////////////////////////////
// base ////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// Firebase
const firebaseConfig = {
    "apiKey": "AIzaSyAUvAYQn3Ydv1QzlcX4NIfk5YBb3KJkab4",
    "authDomain": "player-e985a.firebaseapp.com",
    "databaseURL": "https://player-e985a.firebaseio.com",
    "projectId": "player-e985a",
    "storageBucket": "player-e985a.appspot.com",
    "messagingSenderId": "70806897195",
    "appId": "1:70806897195:web:a79dbcc1affa29c458206e"
};

firebase.initializeApp(firebaseConfig);

const storage = firebase.storage().ref();
const db = firebase.firestore();

// Authentication
let user;

firebase.auth().onAuthStateChanged((response) => {
    user = response;
    if (!user) window.location = "/";
});

////////////////////////////////////////////////////////////////////////////////////////////////////

let app = { };

let ui = { };
let $ui = { };

let cue = { };




// TODO: mover para lugar apropriado
$(function() {
    $ui["library"] = $(".library");
});

const duration = (seconds) => {
    return moment.utc(moment.duration(seconds, "seconds").asMilliseconds()).format("m:ss");
};
