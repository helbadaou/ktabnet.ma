package hub

import (
	"log"
	"net/http"
	"social/services"

	"github.com/gorilla/websocket"
)

type Handler struct {
	service *services.AuthService
	session *services.SessionService
	serv    *services.ChatService
	hub     *Hub
}

func NewHandler(service *services.AuthService, session *services.SessionService, hubS *Hub) *Handler {
	return &Handler{service: service, session: session, hub: hubS}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // allow all origins for now
	},
}

func (h *Handler) ServeWS(hub *Hub, w http.ResponseWriter, r *http.Request) {
	// Try to get token from query parameter first (for WebSocket connections)
	tokenFromQuery := r.URL.Query().Get("token")
	if tokenFromQuery != "" {
		r.Header.Set("Authorization", "Bearer "+tokenFromQuery)
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}

	userID, ok := h.session.GetUserIDFromSession(w, r) // 🔐 Your own logic
	if !ok {
		conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseUnsupportedData, "Authentication required"))
		conn.Close()
		return
	}

	client := &Client{
		ID:   userID,
		Conn: conn,
		Send: make(chan []byte),
	}

	hub.Register <- client

	go client.writePump()
	go client.readPump(hub)
}
