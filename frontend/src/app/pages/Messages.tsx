import { useState, useEffect, useContext, useRef } from 'react';
import { Send, User as UserIcon, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { AuthContext } from '../context/AuthContext';
import { apiUrl, wsUrl } from '../config';

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
  const [conversations, setConversations] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedUser && currentUser) {
      console.log('Attempting to connect to WebSocket...');
      const socket = new WebSocket(wsUrl('/ws'));
      console.log('WebSocket created for user:', currentUser.ID);
      setWs(socket);

      socket.onopen = () => {
        console.log('WebSocket connected');
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const isMine = String(message.from) === String(currentUser.ID);
          const id = message.id || `${message.timestamp}-${Math.random().toString(36).slice(2, 8)}`;
          setMessages((prevMessages) => [
            ...prevMessages,
            { id, content: message.content, isMine, timestamp: new Date(message.timestamp) },
          ]);
        } catch (err) {
          console.error('Failed to parse websocket message', err);
        }
      };

      socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return () => {
        socket.close();
      };
    }
  }, [selectedUser, currentUser]);

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
        const response = await fetch(apiUrl(`/api/chat/history?with=${userId}`), { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          const formattedMessages = (data || []).map((msg: any) => ({
            id: `${msg.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            isMine: String(msg.from) === String(currentUser?.ID),
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
        const res = await fetch(apiUrl(`/api/users-following/${currentUser.ID}`), { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const users = (data || []).map((u: any) => ({
            id: String(u.ID || u.id),
            fullName: u.Nickname || u.nickname || `${u.FirstName || u.first_name || ''} ${u.LastName || u.last_name || ''}`.trim(),
            avatar: u.Avatar || u.avatar,
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

  const handleSend = () => {
    if (newMessage.trim() && selectedUser && ws && currentUser) {
      const fromId = parseInt(currentUser.ID);
      const payload = {
        type: 'private',
        from: fromId,
        to: parseInt(selectedUser.id),
        content: newMessage,
        timestamp: new Date().toISOString(),
      };
      try {
        if (ws.readyState !== WebSocket.OPEN) {
          console.warn('WebSocket not open, cannot send message');
          return;
        }
        ws.send(JSON.stringify(payload));
        // optimistic update
        setNewMessage('');
      } catch (err) {
        console.error('Failed to send message', err);
      }
    }
  };

  if (!currentUser) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="w-full py-8 flex justify-center">
      <div className="w-full max-w-6xl px-4">
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
