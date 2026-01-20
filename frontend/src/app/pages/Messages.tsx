import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Send, User as UserIcon, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { AuthContext } from '../context/AuthContext';
import { useWebSocket, WebSocketMessage } from '../context/WebSocketContext';
import { apiUrl } from '../config';
import { authFetch } from '../utils/api';

// Define a message type with an `isMine` property for display purposes
interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isMine: boolean;
}

interface User {
  id: string;
  fullName: string;
  avatar: string;
}

export function Messages() {
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.user;
  const { status: wsStatus, sendMessage: wsSendMessage, subscribe } = useWebSocket();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const selectedUserRef = useRef<User | null>(null);

  // Keep selectedUserRef in sync
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Subscribe to private messages
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribe('private', (message: WebSocketMessage) => {
      const isMine = String(message.from) === String(currentUser.id);
      
      // Skip if this is our own message (already added via optimistic update)
      if (isMine) {
        return;
      }

      // Only add message if it's from the currently selected user
      const currentSelectedUser = selectedUserRef.current;
      if (currentSelectedUser && String(message.from) === currentSelectedUser.id) {
        const id = `${message.timestamp}-${Math.random().toString(36).slice(2, 8)}`;
        setMessages((prevMessages) => [
          ...prevMessages,
          { id, content: message.content || '', isMine: false, timestamp: new Date(message.timestamp || Date.now()) },
        ]);
      }
    });

    return unsubscribe;
  }, [currentUser, subscribe]);

  // Handle URL query parameter ?user=id
  useEffect(() => {
    const userIdFromUrl = searchParams.get('user');
    if (userIdFromUrl && currentUser) {
      // Fetch user info from API
      const fetchUserInfo = async () => {
        try {
          const res = await authFetch(apiUrl(`/api/users/${userIdFromUrl}`));
          if (res.ok) {
            const userData = await res.json();
            const userFromUrl: User = {
              id: String(userData.id),
              fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User',
              avatar: userData.avatar || '',
            };
            setSelectedUser(userFromUrl);
            // Clear the URL parameter
            setSearchParams({});
          }
        } catch (err) {
          console.error('Error fetching user info:', err);
        }
      };
      fetchUserInfo();
    }
  }, [searchParams, currentUser, setSearchParams]);

  // Handle navigation state from BookDetail page
  useEffect(() => {
    if (location.state?.selectedUserId) {
      const userFromState: User = {
        id: String(location.state.selectedUserId),
        fullName: location.state.selectedUserName || 'Book Owner',
        avatar: location.state.selectedUserAvatar || '',
      };
      setSelectedUser(userFromState);
      // Clear the state to prevent re-selecting on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      try {
        bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } catch (err) {
        // ignore
      }
    }
  }, [messages]);


  useEffect(() => {
    const fetchMessages = async (userId: string) => {
      setLoadingMessages(true);
      setMessages([]);
      try {
        const response = await authFetch(apiUrl(`/api/chat/history?with=${userId}`));
        if (response.ok) {
          const data = await response.json();
          const formattedMessages = (data || []).map((msg: any) => ({
            id: `${msg.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            isMine: String(msg.from) === String(currentUser?.id),
          }));
          setMessages(formattedMessages);
        } else {
          console.error('Failed to fetch messages');
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    if (selectedUser && currentUser) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser, currentUser]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser) return;
      setLoadingConversations(true);
      try {
        const res = await authFetch(apiUrl('/api/chat-users'));
        if (res.ok) {
          const data = await res.json();
          const users = (data || []).map((u: any) => ({
            id: String(u.id ?? u.ID),
            fullName: u.full_name || u.FullName || `${u.first_name || u.FirstName || ''} ${u.last_name || u.LastName || ''}`.trim(),
            avatar: u.avatar || u.Avatar || '',
          }));
          setConversations(users);
        } else {
          console.error('Failed to fetch conversations');
        }
      } catch (err) {
        console.error('Error fetching conversations', err);
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [currentUser]);

  const handleSend = useCallback(() => {
    if (newMessage.trim() && selectedUser && currentUser && wsStatus === 'connected') {
      const fromId = parseInt(String(currentUser.id));
      const messageContent = newMessage.trim();
      const timestamp = new Date().toISOString();
      
      const success = wsSendMessage({
        type: 'private',
        from: fromId,
        to: parseInt(selectedUser.id),
        content: messageContent,
        timestamp: timestamp,
      });

      if (success) {
        // Optimistic update - add message to UI immediately
        const optimisticMessage: Message = {
          id: `${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
          content: messageContent,
          timestamp: new Date(timestamp),
          isMine: true,
        };
        setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
        setNewMessage('');
      }
    }
  }, [newMessage, selectedUser, currentUser, wsStatus, wsSendMessage]);

  if (!currentUser) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="w-full py-8 flex justify-center mx-auto">
      <div className="w-full max-w-6xl px-4 mx-auto">
        <h1 className="text-4xl mb-6">Messages</h1>

        <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className={`md:col-span-1 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
            <CardHeader>
              <h2>Conversations</h2>
            </CardHeader>
            <Separator />
            <ScrollArea className="flex-1">
              {loadingConversations ? (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              ) : conversations.length > 0 ? (
                <div className="p-4 space-y-2">
                  {conversations.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${selectedUser?.id === user.id
                        ? 'bg-primary/10'
                        : 'hover:bg-muted'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.fullName} />
                          <AvatarFallback>
                            <UserIcon className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium truncate">{user.fullName}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground h-full flex items-center justify-center">
                  No conversations yet.
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className={`md:col-span-2 flex flex-col min-h-0 ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
            {selectedUser ? (
              <>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 md:hidden">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    </div>
                    <Avatar>
                      <AvatarImage src={selectedUser.avatar} alt={selectedUser.fullName} />
                      <AvatarFallback>
                        <UserIcon className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedUser.fullName}</p>
                    </div>
                  </div>
                </CardHeader>
                <Separator />

                <ScrollArea className="flex-1 p-4 min-h-0">
                  {loadingMessages ? (
                    <div className="text-center text-muted-foreground">Loading messages...</div>
                  ) : messages.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${message.isMine
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                              }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${message.isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                }`}
                            >
                              {message.timestamp.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                      No messages in this conversation yet.
                    </div>
                  )}
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button onClick={handleSend}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a conversation to start messaging</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
