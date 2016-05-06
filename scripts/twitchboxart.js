'use strict';

//Update this value to reflect your own channel name otherwise you will get images for what I am playing
var channel = 'unshapedadrian';

//The box art is available in various sizes, large is configured as default but uncomment one of the lines
//below if you require medium or small, sizes in pixels follow each size just for info

var size = 'large';//272px x 380px
//var size = 'medium'; //136px x 190px
//var size = 'small'; //52px x 72px

//How often should we poll to check if the game has changed, default every five minutes
var pollTimeSec = 300000;


//Do not change anything below this line unless you are familiar with javascript and jQuery
//Some globals that track what urls and game we are using as well as a default image.

var globalGameName;
var globalBoxartUrl;

var defaultLargeBoxArt = 'http://static-cdn.jtvnw.net/ttv-static/404_boxart-272x380.jpg';


//This code runs when the DOM objects are initialised as defined in the jQuery documentation

$(document).ready(function start() {

    //First things first let's set a global default art variable , provided one is not already present, and apply it to the html

    if (globalBoxartUrl === null || typeof globalBoxartUrl === 'undefined') {
        globalBoxartUrl = defaultLargeBoxArt;
    }
    //Update the image
    updateImage(globalBoxartUrl);

    //Let's get the current game straight away and update
    getCurrentGame();

    //Now let's set up polling to Twitch so that we check for new games every five minutes

    var myTimer = setInterval(getCurrentGame, pollTimeSec);
    
});

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

//This is where we start, this function sends a request to twitch for the JSON associated with the channel
//It sets a callback for the data and that is all

function getCurrentGame() {
   
    //If you are testing this in IE you may need to uncomment the line below to allow cross site scripting
	//$.support.cors = true;
    
    //Using ajax here, could have used getJSON but the error handling is awful
	$.ajax({
	    url: "https://api.twitch.tv/kraken/channels/" + channel,
	    dataType: 'json',
        success: getCurrentGameCallback
	})
    
}
   
//This is the callback for getCurrentGame that handles the data once the call to Twitch has completed

function getCurrentGameCallback(data) {

    //if the game name is the same we don't need to make the second call as we already have the url
    //stored in the global

    if (data["game"] === globalGameName) {
        return;
    }
    else {
        globalGameName = data["game"];
    }

    //We found a new game so we need to call into Twitch again to get the JSON for the game itself
    getGameImageUrl(globalGameName);
}

//This function sends a request to twitch for the JSON associated with the game
//It sets a callback for the data and that is all

function getGameImageUrl(gameName) {

    //If you are testing this in IE you may need to uncomment the line below to allow cross site scripting
    //$.support.cors = true;
    
    $.ajax({
        url: "https://api.twitch.tv/kraken/search/games?q=" + gameName + "&type=suggest",
        dataType: 'json',
        headers: {
            'Client-ID': 'nfmebw2293663r1rski1j8d5vezfvpz'
        },
        success: getGameImageUrlCallback
    })

}

//This is the callback for getGameImageUrl that handles the data once the call to Twitch has completed

function getGameImageUrlCallback(data) {

    //The url for the box art is deep in the JSON hence the strange array here.
    globalBoxartUrl = data["games"]["0"]["box"][size];

    //Now we have a new image we can update the html
    updateImage(globalBoxartUrl);
}

//Some debugging code, removed from final version probably

/*function upDateText(comment) {
	$('#res').html(comment);
	//document.getElementById('res').value = comment;
}*/

// A Sample that I found on the internet.
/*Sample scripts<script src="http://code.jquery.com/jquery-1.11.2.min.js"></script>
<script>
$.getJSON('https://api.twitch.tv/kraken/streams/Jonathan_x64', function(channel) {

    if (channel["stream"] == null) { 
        window.alert("nie wow");

    } else {
        window.alert("wow");
    
    }
});
</script>*/