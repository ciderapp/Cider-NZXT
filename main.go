package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/imroc/req"
)

// Artwork structure
type Artwork struct {
	Url string `json:"url"`
}

// PlaybackInfo structure
type PlaybackInfo struct {
	Info struct {
		Artwork Artwork `json:"artwork"`
	} `json:"info"`
}

var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
	lastArtworkUrl string
)

func main() {
	fmt.Println("Starting server...")
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()
	r.LoadHTMLGlob("templates/*")
	fmt.Println("Server started, listening on port 3000")
	fmt.Println("Attach this instance to NZXT CAM by providing the following URL: http://localhost:3000 and hitting the arrow button")
	fmt.Println("NOTE: Don't have CAM? Download it here: https://www.nzxt.com/camapp")
	// Websocket route
	r.GET("/ws", func(c *gin.Context) {
		conn, _ := upgrader.Upgrade(c.Writer, c.Request, nil)
		go func() {
			for {
				playbackInfo := fetchPlaybackInfo()
				artwork := playbackInfo.Info.Artwork.Url
				if artwork != "" && artwork != lastArtworkUrl {
					artwork = replace(artwork, "{w}", "600")
					artwork = replace(artwork, "{h}", "600")
					if err := conn.WriteMessage(websocket.TextMessage, []byte(artwork)); err != nil {
						return
					}
					lastArtworkUrl = artwork
				}
				time.Sleep(1 * time.Second)
			}
		}()
	})

	// Home route
	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.tmpl", gin.H{})
	})

	r.Run(":3000")
}

func fetchPlaybackInfo() PlaybackInfo {
	header := req.Header{
		"Accept": "application/json",
	}

	url := "http://localhost:10769/currentPlayingSong"
	response, err := req.Get(url, header)
	if err != nil {
		log.Fatal(err)
	}

	playbackInfo := PlaybackInfo{}
	response.ToJSON(&playbackInfo)

	return playbackInfo
}

func replace(src, old, new string) string {
	return strings.Replace(src, old, new, -1)
}
