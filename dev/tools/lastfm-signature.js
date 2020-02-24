const fs = require("fs-extra");
const crypto = require("crypto");

const lastfmSecret = fs.readFileSync("./dev/lastfm.key", "utf8").trim();

// const params = "api_key=79f87d7bebc216a33ebf3cc047ad7101&method=auth.getSession&token=u6HiKG5rfq1595ZOT9zcDn7lcmjxbCMr".split("&").sort();
const params = "api_key=79f87d7bebc216a33ebf3cc047ad7101&method=track.scrobble&artist=Red%20Hot%20Chili%20Peppers&track=Around%20The%20World&timestamp=1582511357&album=Californication&sk=xnGe6mYtpazozLD3ZvoOC5A6JFc_1gDY".split("&").sort();
const concatenatedParams = params.join("").replace(/=/g, "") + lastfmSecret;
const md5Hash = crypto.createHash("md5").update(concatenatedParams).digest("hex");

console.log(params, concatenatedParams, md5Hash);

// http://www.last.fm/api/auth/?api_key=79f87d7bebc216a33ebf3cc047ad7101
