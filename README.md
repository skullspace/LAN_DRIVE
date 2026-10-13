# LAN DRIVE

This is a sick html page of LAN games at SkullSpace.

Visit it here: https://lan-drive.nitrodist.workers.dev/

Host it yourself at your next LAN party and/or the next Skullspace LAN party.

## Reviews

"Great project for hosting local games. The folder automation for uploading files and having them automatically populate the list saves a ton of time and makes the site convenient to update. The music player is a fun added touch, it made me laugh playing goofy MIDI files."

## How to deploy

You will (probably, most likely) want to host this project with a webserver so that people can access it from your machine (or the Internet - we have hosted it at https://lan-drive.nitrodist.workers.dev/)

## To add more music

Add a new file to the `music/` directory. It can be a mp3 or midi file. Other files are probably supported, any your browser plays.

## To add more games

Add more zip files inside the games directory and the list of Downloads should reflect the new zip files.

### Development notes

MIDI support through webaudio-tinysynth: https://github.com/g200kg/webaudio-tinysynth

