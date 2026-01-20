package main

import (
	"fmt"
	"net/http"
	"os"
	"social/db/sqlite"
	"social/handlers"
	hubS "social/hub"
	"social/repositories"
	"social/services"
	"social/utils"
)

func main() {
	sqlite.InitDB()
	db := sqlite.GetDB()
	folderName := []string{
		"uploads/avatars",
		"uploads/group_posts",
	}

	for _, folder := range folderName {
		if err := os.MkdirAll(folder, os.ModePerm); err != nil {
			fmt.Printf("❌ Failed to create '%s': %v\n", folder, err)
			return
		}
	}

	authRepo := repositories.NewUserRepository(db)
	chatRepo := repositories.NewChatRepository(db)
	followRepo := repositories.NewFollowRepository(db)
	notifRepo := repositories.NewNotificationRepository(db)
	postRepo := repositories.NewPostRepository(db)
	profileRepo := repositories.NewProfileRepository(db)
	sessionRepo := repositories.NewSessionRepo(db)
	bookRepo := repositories.NewBookRepository(db)

	authService := services.NewService(*authRepo)
	sessionService := services.NewSessionService(sessionRepo)

	chatService := services.NewChatService(chatRepo)

	followService := services.NewFollowService(followRepo, notifRepo)
	notifService := services.NewNotificationService(notifRepo)
	profileService := services.NewProfileService(*profileRepo)

	postService := services.NewPostService(postRepo)
	bookService := services.NewBookService(bookRepo)

	hub := hubS.NewHub(chatService)
	go hub.Run()

	// 5. Initialize Handlers
	authHandler := handlers.NewHandler(authService, sessionService, hub)
	chatHandler := handlers.NewChatHandler(chatService, sessionService)
	followHandler := handlers.NewFollowHandler(followService, sessionService, hub)
	hubHandler := hubS.NewHandler(authService, sessionService, hub)
	notifHandler := handlers.NewNotificationHandler(notifService, sessionService)
	postHandler := handlers.NewPostHandler(postService, sessionService)
	profileHandler := handlers.NewProfileHandler(profileService, sessionService, hub)
	bookHandler := handlers.NewBookHandler(bookService, sessionService)

	// 6. Setup Router
	mux := http.NewServeMux()

	// Authentication routes
	mux.HandleFunc("/api/login", authHandler.LoginHandler)
	mux.HandleFunc("/api/register", authHandler.RegisterHandler)
	mux.HandleFunc("/api/logout", authHandler.LogoutHandler)

	// User profile routes
	mux.Handle("/api/profile/", sessionService.Middleware(http.HandlerFunc(profileHandler.ProfileHandler)))
	mux.Handle("/api/users/", sessionService.Middleware(http.HandlerFunc(profileHandler.GetUserByIDHandler)))
	mux.Handle("/api/search", sessionService.Middleware(http.HandlerFunc(profileHandler.SearchUsers)))
	mux.Handle("/api/user/toggle-privacy", sessionService.Middleware(http.HandlerFunc(profileHandler.TogglePrivacy)))
	mux.Handle("/api/auth/me", sessionService.Middleware(http.HandlerFunc(profileHandler.GetMe)))

	// Post routes
	mux.Handle("/api/posts", sessionService.Middleware(http.HandlerFunc(postHandler.PostsHandler)))
	mux.Handle("/api/user-posts/", sessionService.Middleware(http.HandlerFunc(postHandler.GetUserPostsHandler)))
	mux.Handle("/api/comments", sessionService.Middleware(http.HandlerFunc(postHandler.CreateCommentHandler)))
	mux.Handle("/api/comments/post", sessionService.Middleware(http.HandlerFunc(postHandler.GetCommentsByPostHandler)))

	// Follow routes
	mux.Handle("/api/follow", sessionService.Middleware(http.HandlerFunc(followHandler.SendFollowRequest)))
	mux.Handle("/api/follow/status/", sessionService.Middleware(http.HandlerFunc(followHandler.GetFollowStatus)))
	mux.Handle("/api/follow/accept", sessionService.Middleware(http.HandlerFunc(followHandler.AcceptFollow)))
	mux.Handle("/api/follow/reject", sessionService.Middleware(http.HandlerFunc(followHandler.RejectFollow)))
	mux.Handle("/api/unfollow", sessionService.Middleware(http.HandlerFunc(followHandler.UnfollowUser)))
	mux.Handle("/api/users-followers/", sessionService.Middleware(http.HandlerFunc(followHandler.GetFollowersHandler)))
	mux.Handle("/api/users-following/", sessionService.Middleware(http.HandlerFunc(followHandler.GetFollowingHandler)))
	mux.Handle("/api/recipients", sessionService.Middleware(http.HandlerFunc(followHandler.GetRecipientsHandler)))

	// Chat routes
	mux.Handle("/api/chat-users", sessionService.Middleware(http.HandlerFunc(chatHandler.GetAllChatUsers)))
	mux.Handle("/api/chat/history", sessionService.Middleware(http.HandlerFunc(chatHandler.GetChatHistory)))

	// Notification routes
	mux.Handle("/api/notifications", sessionService.Middleware(http.HandlerFunc(notifHandler.GetUserNotifications)))
	mux.Handle("/api/notifications/seen", sessionService.Middleware(http.HandlerFunc(notifHandler.MarkNotificationSeen)))
	mux.Handle("/api/notifications/delete", sessionService.Middleware(http.HandlerFunc(notifHandler.DeleteNotification)))

	// Book routes
	mux.Handle("/api/books", sessionService.Middleware(http.HandlerFunc(bookHandler.BooksHandler)))
	mux.Handle("/api/books/search", sessionService.Middleware(http.HandlerFunc(bookHandler.SearchBooksHandler)))
	mux.Handle("/api/books/", sessionService.Middleware(http.HandlerFunc(bookHandler.GetBookHandler)))
	mux.Handle("/api/my-books", sessionService.Middleware(http.HandlerFunc(bookHandler.GetMyBooksHandler)))

	// Group routes

	// WebSocket route
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("🧲 WebSocket connection initiated")
		hubHandler.ServeWS(hub, w, r)
	})

	// Static files route
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))

	// 7. Setup Middleware
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/ws" {
			// Bypass CORS for WebSocket
			mux.ServeHTTP(w, r)
			return
		}
		// Apply CORS to all other routes
		utils.CorsMiddleware(mux).ServeHTTP(w, r)
	})

	// 8. Start Server
	fmt.Println("✅ Server started on :8080")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		fmt.Printf("❌ Server error: %v\n", err)
	}
}
