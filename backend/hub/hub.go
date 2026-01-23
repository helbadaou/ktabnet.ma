package hub

import (
	"encoding/json"
	"fmt"
	"sync"

	"social/models"
	"social/services"
)

type Hub struct {
	Clients           map[int]*Client
	Register          chan *Client
	Unregister        chan *Client
	Broadcast         chan models.Message
	services          *Handler
	groupMembersCache map[int][]int
	cacheMutex        sync.RWMutex
	messageService    *services.ChatService
	profileService    *services.ProfileService
}

func NewHub(messageService *services.ChatService) *Hub {
	return &Hub{
		Clients:           make(map[int]*Client),
		Register:          make(chan *Client),
		Unregister:        make(chan *Client),
		Broadcast:         make(chan models.Message),
		groupMembersCache: make(map[int][]int),
		messageService:    messageService,
	}
}

func (h *Hub) SetProfileService(profileService *services.ProfileService) {
	h.profileService = profileService
}

func (h *Hub) Run() {
	for {
		select {

		case client := <-h.Register:

			h.Clients[client.ID] = client

			fmt.Println("✅ Registered user", client.ID)

		case client := <-h.Unregister:

			delete(h.Clients, client.ID)

			close(client.Send)

			fmt.Println("❌ Unregistered user", client.ID)

		case msg := <-h.Broadcast:

			fmt.Printf("📢 Broadcasting message: %+v\n", msg)

			// Check if sender is banned
			if h.profileService != nil && h.profileService.IsBanned(msg.From) {
				fmt.Printf("🚫 User %d is banned, message blocked\n", msg.From)
				// Send error message back to sender
				if sender, ok := h.Clients[msg.From]; ok {
					errorMsg := map[string]string{
						"type":  "error",
						"error": "You are banned and cannot send messages",
					}
					if errorBytes, err := json.Marshal(errorMsg); err == nil {
						sender.Send <- errorBytes
					}
				}
				continue
			}

			msgBytes, err := json.Marshal(msg)
			if err != nil {

				fmt.Println("❌ Failed to marshal message:", err)

				continue

			}

			switch msg.Type {

			case "private":

				if err := h.messageService.ProcessPrivateMessage(msg); err != nil {

					fmt.Println("Error processing private message:", err)

					continue

				}

				// Send to recipient (skip duplicate send when from == to)
				if recipient, ok := h.Clients[msg.To]; ok {
					select {

					case recipient.Send <- msgBytes:

						fmt.Printf("✅ Private message sent to user %d\n", msg.To)

					default:

						delete(h.Clients, recipient.ID)

					}
				}

				// Send to sender (only if different channel or not found above)
				if msg.From != msg.To {
					if sender, ok := h.Clients[msg.From]; ok {
						select {

						case sender.Send <- msgBytes:

							fmt.Printf("✅ Private message sent to user %d\n", msg.From)

						default:

							delete(h.Clients, sender.ID)

						}
					}
				}

			default:

				fmt.Printf("❌ Unknown message type: %s\n", msg.Type)

			}

		}
	}
}

func (h *Hub) SendNotification(notification models.Notification, toID int) {
	msgBytes, _ := json.Marshal(notification)
	fmt.Println("message that will be sent :", string(msgBytes))
	if recipient, ok := h.Clients[toID]; ok {
		recipient.Send <- msgBytes
	}
}

func (h *Hub) SendMessageToUser(userID int, message models.Message) {
	msgBytes, err := json.Marshal(message)
	if err != nil {
		fmt.Printf("❌ Failed to marshal message: %v\n", err)
		return
	}

	if client, ok := h.Clients[userID]; ok {
		select {
		case client.Send <- msgBytes:
			fmt.Printf("✅ Message sent to user %d\n", userID)
		default:
			fmt.Printf("⚠️ Failed to send message to user %d (channel full or client disconnected)\n", userID)
		}
	} else {
		fmt.Printf("⚠️ User %d not connected\n", userID)
	}
}
