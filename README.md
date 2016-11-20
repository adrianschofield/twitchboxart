# twitchboxart

Display Twitch game box art in your stream with this small web page.

Download all the files, there is a zip available here using the "Clone or Download" option on github and store them in a folder on your hard drive.

Edit the file twitchboxart.js in the scripts directory and change the channel name to reflect your channel name.
Edit the var displayGameName = false; to var displayGameName = true; if you want to display the Game's name across the image.

This second option is still a work in progress so please use with caution.

To use in OBS Studio:

Add a Source and choose BrowserSource
Give the source a name and then configure it as follows:

Local file: checked
Local File: browse to the twitchboxart.html in the folder you created above.
Width: 272
Height: 380

To use in OBS Classic:

Add a source and choose CLR Browser, if you don't see that option you need the correct plugin installed.
Give the source a name and then configure it as follows:

URL: Press the ? button and browse to the twitchboxart.html in the folder you created above.
Width: 272
Height: 380

To use in Xsplit:

Select Add Source from the menu and choose Media File
Browse to the twitchboxart.html in the folder you created above.
Change the layout by right clicking on the source choose the Layout Tab
Width: 272
Height: 380

