'use strict';

// Update these variables to reflect your configuration
var channel = 'unshapedadrian';
var displayGameName = false;

// Use this to see if we had to refresh the token
var needToRefreshToken = false;

// How often should we poll to check if the game has changed, default every five minutes
var pollTimeSec = 300000;

// Do not change anything below this line unless you are familiar with javascript and jQuery
// Some globals that track what urls and game we are using as well as a default image.

var globalGameId;
var globalGameName;
var globalBoxartUrl;

var defaultLargeBoxArt = 'http://static-cdn.jtvnw.net/ttv-static/404_boxart-272x380.jpg';

// API calling information

// Helix headers
var helixheaders = new Headers();
helixheaders.append('Client-ID', clientId);
if (oAuthToken !== '') {
    helixheaders.append('Authorization', 'Bearer ' + oAuthToken);
}

// We need  different headers for the Token Refresh call
// Refresh Headers
var refreshHeaders = new Headers();
refreshHeaders.append('Content-Type', 'x-www-form-urlencoded');

// Let's get this script started when the DOM objects are initialised
window.onload = function (){

    // I moved this to an async function
    doWork(); 
}

// TODO refactor this even more so that calling Twitch is done in one function and so
// can more easily handle Token Refresh

async function doWork () {
    // First things first let's set a global default art variable , provided one is not already present, and apply it to the html

    if (globalBoxartUrl === null || typeof globalBoxartUrl === 'undefined') {
        globalBoxartUrl = defaultLargeBoxArt;
    }
    // Update the image
    updateImage(globalBoxartUrl);

    // Let's get the current game straight away and update
    await getChannelId();
    if (needToRefreshToken) {
        // We got here because the token was refreshed let's try again
        needToRefreshToken = false;
        await getChannelId();
    }

    // Now let's set up polling to Twitch so that we check for new games every five minutes
    var myTimer = setInterval(getCurrentGame, pollTimeSec);
}



// Need this section for Helix API calls to convert names to ids
// Helix needs a Channel Id rather than a channel name

async function getChannelId() {
   
    // Rewritten to use fetch rather than ajax

    // Some detailed comments so I remember what I did
    // Set up the request, we need url, method and headers which are defined as globals to aid reuse
    // var request = new Request('https://api.twitch.tv/kraken/search/channels?query=' + channel, {
    //     headers: v5headers,
    //     method: 'GET'
    // });

    var request = new Request('https://api.twitch.tv/helix/users?login=' + channel, {
        headers: helixheaders,
        method: 'GET'
    });

    var json = null;

    // Make the call using fetch, which returns a promise
    // When the fetch succeeds return the response as json
    // Then manage the data it contained
    // Catch just in case
    try {
        var response = await fetch(request);
        json = await response.json();
    } catch (err) {
        console.log(err);
    }
    
    // OK if we need to refresh the token we'll find that out here
    if (json.message === 'Invalid OAuth token') {
        await postRefreshToken();
    }

    // Now we check if the token was refreshed
    if (!needToRefreshToken) {
        // Update the global variable with the channel id rather than the name
        channel = json.data[0]["id"];
        // Now we can get the current game
        getCurrentGame();
    }
    return;    
}

// This is where we start, this function sends a request to twitch for the JSON associated with the channel
// It sets a callback for the data and that is all

async function getCurrentGame() {

    // With the new API it looks like you can only do this when the stream is live

    var request = new Request('https://api.twitch.tv/helix/channels?broadcaster_id=' + channel, {
        headers: helixheaders,
        method: 'GET'
    });

    // Create a variable for our returned json data
    var json = null;

    // Make the call using fetch, which returns a promise so need to await
    // When the fetch succeeds return the response as json
    // Then manage the data it contained
    // Catch just in case
    try {
        var response = await fetch(request);
        json = await response.json();
    } catch (err) {
        console.log(err);
    }

    // There's a potential for us to need to refresh the token here
    // If we don't need to refresh then do the work
    // If we do need to refresh then just wait until the next interval 
    // OK if we need to refresh the token we'll find that out here
    if (json.message === 'Invalid OAuth token') {
        await postRefreshToken();
    } else {
        // Need to make sure we don't get stuck in a refresh loop
        needToRefreshToken = false;
    }
    if (!needToRefreshToken) {
        // data is an array if it has length zero the player is offline so do nothing
        if (json.data.length > 0){
            if (json.data[0]["game_id"] === globalGameId) {
                return;
            }
            else {
                globalGameId = json.data[0]["game_id"];
            }
            // We found a new game so we need to call into Twitch again to get the JSON for the game itself
            await getGameImageUrl(globalGameId);
        }
    }
    return;
}
   
// This function sends a request to twitch for the JSON associated with the game

async function getGameImageUrl(gameId) {

    var request = new Request("https://api.twitch.tv/helix/games?id=" + gameId, {
        headers: helixheaders,
        method: 'GET'
    });

    // Make the call using fetch, which returns a promise so need to await
    // When the fetch succeeds return the response as json
    // Then manage the data it contained
    // Catch just in case
    try {
        var response = await fetch(request);
        var json = await response.json();
    } catch (err) {
        console.log(err);
    }
    
    // It's possible that there is more than one result
    // If so loop through each entry until we find an exact game name match and use that entry
    // Otherwise just use the only entry returned
    if (json.data.length > 1) {
        json.data.forEach(element => {
            if(globalGameName === element.name) {
                globalBoxartUrl = element.box_art_url.replace("{width}x{height}", "272x380");
                globalGameName = element.name;
            }
        });
        
    } else {
        globalBoxartUrl = json.data[0].box_art_url.replace("{width}x{height}", "272x380");
        globalGameName = json.data[0].name;
    }
    // Now we have a new image we can update the html
    updateImage(globalBoxartUrl);

    // Check to see if we are displaying the Game name
    if(displayGameName === true) {
        updateGameName(globalGameName);
    }
    return;
}

// This function sends a POST request to twitch to handle the situation wher a token needs to be refreshed

async function postRefreshToken() {
    // DBG
    console.log('Need to refresh');

    // Set up the url and body
    var url = 'https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=' + refreshToken + '&client_id=' + clientId + '&client_secret=' + clientSecret;
    var body = JSON.stringify({
        "access_token": oAuthToken,
        "refresh_token": refreshToken,
        "expires_in": 3600,
        "scope": "channel_read",
        "token_type": "bearer"
    });

    var request = new Request(url, {
        headers: refreshHeaders,
        method: 'POST',
        body: body
    });

    // await the response and convert to json
    var response = await fetch(request);
    var data = await response.json();
    // DBG
    console.log(data.access_token);

    // Update the global with the correct value and set the flag appropriately
    oAuthToken = data.access_token;
    needToRefreshToken = true;
    // Now rebuild the headers
    helixheaders = new Headers();
    helixheaders.append('Client-ID', clientId);
    if (oAuthToken !== '') {
        helixheaders.append('Authorization', 'Bearer ' + oAuthToken);
    }
    return;
}

// Update the image in the html, passed the url
function updateImage(url) {

    // Function created as we may need to do more than update the image.
    // Select the image from the htnl
    var image = document.getElementById("myImage");

    // Check if the url passed in is invalid, this should never be the case but if it is then set the image
    // to be the default image
    if (url === null | typeof url === "undefined") {
        url = defaultLargeBoxArt;
    }

    // update the image in the html
    image.src = url;
}

// Update the image in the html, passed the url
function updateGameName(name) {

    var text = document.getElementById("GameName");

     if (name !== null && typeof name !== "undefined") {
        text.innerHTML = name;
    }

}


