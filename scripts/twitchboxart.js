'use strict';

//Update this value to reflect your own channel name otherwise you will get images for what I am playing
var channel = 'unshapedadrian';
var displayGameName = false;
var oAuthToken = '';

//TODO remove when happy with using Helix
//The box art is available in various sizes, large is configured as default but uncomment one of the lines
//below if you require medium or small, sizes in pixels follow each size just for info

//var size = 'large';//272px x 380px
//var size = 'medium'; //136px x 190px
//var size = 'small'; //52px x 72px


//How often should we poll to check if the game has changed, default every five minutes
var pollTimeSec = 300000;


//Do not change anything below this line unless you are familiar with javascript and jQuery
//Some globals that track what urls and game we are using as well as a default image.

var globalGameId;
var globalGameName;
var globalBoxartUrl;

var defaultLargeBoxArt = 'http://static-cdn.jtvnw.net/ttv-static/404_boxart-272x380.jpg';

//API calling information
//Kraken v5 Headers
var v5headers = new Headers();
v5headers.append('Client-ID', 'nfmebw2293663r1rski1j8d5vezfvpz');
v5headers.append('Accept', 'application/vnd.twitchtv.v5+json');
v5headers.append('Content-Type', 'application/json');

//Helix headers
var helixheaders = new Headers();
helixheaders.append('Client-ID', 'nfmebw2293663r1rski1j8d5vezfvpz');
if (oAuthToken !== '') {
    helixheaders.append('Authorization', 'Bearer ' + oAuthToken);
}


//Let's get this script started when the DOM objects are initialised
window.onload = function (){

    //First things first let's set a global default art variable , provided one is not already present, and apply it to the html

    if (globalBoxartUrl === null || typeof globalBoxartUrl === 'undefined') {
        globalBoxartUrl = defaultLargeBoxArt;
    }
    //Update the image
    updateImage(globalBoxartUrl);

    //Let's get the current game straight away and update
    //getCurrentGame();
    getChannelId();

    //Now let's set up polling to Twitch so that we check for new games every five minutes

    var myTimer = setInterval(getCurrentGame, pollTimeSec);
    
}

//Update the image in the html, passed the url
function updateImage(url) {

    //function created as we may need to do more than update the image.
    //Select the image from the htnl
    var image = document.getElementById("myImage");

    //Check if the url passed in is invalid, this should never be the case but if it is then set the image
    //to be the default image
    if (url === null | typeof url === "undefined") {
        url = defaultLargeBoxArt;
    }

    //update the image in the html
    image.src = url;
}

//Update the image in the html, passed the url
function updateGameName(name) {

    var text = document.getElementById("GameName");

     if (name !== null && typeof name !== "undefined") {
        text.innerHTML = name;
    }

}

//Need this section for Kraken v5 API calls to convert names to ids
//v5 needs a Channel Id rather than a channel name

function getChannelId() {
   
    //Rewritten to use fetch rather than ajax

    //Some detailed comments so I remember what I did
    //Set up the request, we need url, method and headers which are defined as globals to aid reuse
    //var request = new Request('https://api.twitch.tv/kraken/search/channels?query=' + channel, {
    //    headers: v5headers,
    //    method: 'GET'
    //});

    var request = new Request('https://api.twitch.tv/helix/users?login=' + channel, {
        headers: helixheaders,
        method: 'GET'
    });

    //Make the call using fetch, which returns a promise
    //When the fetch succeeds return the response as json
    //Then manage the data it contained
    //Catch just in case
    fetch(request).then(function(response) {
        //Success, return the response as JSON
        return response.json();
    }).then(function (json){
        //Data contains the JSON from the response
        //Update the global variable with the channel id rather than the name
        //channel = data["channels"][0]["_id"];
        channel = json.data[0]["id"];
        //Now we can get the current game
        getCurrentGame();
    }).catch(function (err) {
       console.log(err);
    });
    
}

//End of Kraken v5 requirement

//This is where we start, this function sends a request to twitch for the JSON associated with the channel
//It sets a callback for the data and that is all

function getCurrentGame() {

    //var request = new Request('https://api.twitch.tv/kraken/channels/' + channel, {
    //    headers: v5headers,
    //    method: 'GET'
    //});

    // With the new API it looks like you can only do this when the stream is live

    var request = new Request('https://api.twitch.tv/helix/streams?user_id=' + channel, {
        headers: helixheaders,
        method: 'GET'
    });

    //Make the call using fetch, which returns a promise
    //When the fetch succeeds return the response as json
    //Then manage the data it contained
    //Catch just in case
    fetch(request).then(function(response) {
        //Success, return the response as JSON
        return response.json();
    }).then(function (json){
        // data is an array if it has length zero the player is offline so do nothing
        if (json.data.length > 0){
            if (json.data[0]["game_id"] === globalGameId) {
                return;
            }
            else {
                globalGameId = json.data[0]["game_id"];
            }
            //We found a new game so we need to call into Twitch again to get the JSON for the game itself
            getGameImageUrl(globalGameId);
        }
        
    }).catch(function (err) {
       console.log(err);
    });
    
}
   
//This function sends a request to twitch for the JSON associated with the game
//It sets a callback for the data and that is all

function getGameImageUrl(gameId) {

    /* var request = new Request("https://api.twitch.tv/kraken/search/games?query=" + gameName + "&type=suggest", {
        headers: v5headers,
        method: 'GET'
    }); */

    var request = new Request("https://api.twitch.tv/helix/games?id=" + gameId, {
        headers: helixheaders,
        method: 'GET'
    });

    //Make the call using fetch, which returns a promise
    //When the fetch succeeds return the response as json
    //Then manage the data it contained
    //Catch just in case
    fetch(request).then(function(response) {
        //Success, return the response as JSON
        return response.json();
    }).then(function (json){
    //It's possible that there is more than result
    //If so loop through each entry until we find an exact game name match and use that entry
    //Otherwise just use the only entry returned
    /* if(data["games"].length > 1){
        data["games"].forEach(element => {
            if(globalGameName === element["name"]){
                globalBoxartUrl = element["box"][size];
            }
        });
    } else {
        //The url for the box art is deep in the JSON hence the strange array here.
        globalBoxartUrl = data["games"]["0"]["box"][size];
    } */
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
    //Now we have a new image we can update the html
    updateImage(globalBoxartUrl);

    //check to see if we are displaying the Game name

    if(displayGameName === true) {
        updateGameName(globalGameName);
    }
    }).catch(function (err) {
       console.log(err);
    });

}
