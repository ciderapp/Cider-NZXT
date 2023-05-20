// Import required modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Instantiate an Express.js object
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let lastArtworkUrl = '';

// Route handler for GET requests to the root path
app.get('/', (req, res) => {
    // Send an HTML response to the client
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body, html {
              height: 100%;
              width: 100%;
              margin: 0;
              background-repeat: no-repeat;
              background-position: center center;
              background-size: cover;
              transition: background-image 1s;
              background-color: black;
            }
            .bg1, .bg2 {
              position: absolute;
              width: 100%;
              height: 100%;
              background-repeat: no-repeat;
              background-position: center center;
              background-size: cover;
              transition: opacity 1s;
            }
            .bg1 {
              opacity: 1;
              z-index: 2;
            }
            .bg2 {
              opacity: 0;
              z-index: 1;
            }
          </style>
          <script src="/socket.io/socket.io.js"></script>
        </head>
        <body>
          <div class="bg1"></div>
          <div class="bg2"></div>
          <script>
            var bg1 = document.querySelector('.bg1');
            var bg2 = document.querySelector('.bg2');
            var currentBg = bg1;
            var socket = io();
            socket.on('newArtwork', function(artworkUrl) {
              var nextBg = currentBg === bg1 ? bg2 : bg1;
              nextBg.style.backgroundImage = 'url(' + artworkUrl + ')';
              currentBg.style.opacity = '0';
              nextBg.style.opacity = '1';
              currentBg = nextBg;
            });
          </script>
        </body>
      </html>
    `);
});

// Fetch the artwork from the API every second and emit it to the clients
setInterval(async () => {
  try {
    let playbackInfo = await grabPlaybackInfo();
    let artwork = playbackInfo.info?.artwork?.url?.replace('{w}', '600').replace('{h}', '600');;
    if (playbackInfo && artwork && artwork !== lastArtworkUrl) {
        io.emit('newArtwork', artwork);
        lastArtworkUrl = artwork;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}, 1000);

async function grabPlaybackInfo() {
	return fetch('http://localhost:10769/currentPlayingSong', {
		method: 'GET',
		headers: {
		  'Content-Type': 'application/json'
		},
	})
	.then(response => response.json())
	.then(json => {
		return json;
	})
	.catch(error => console.debug("[DEBUG] [ERROR] An error occurred while processing the request:", error));
}

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));
