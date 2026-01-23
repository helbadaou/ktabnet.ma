import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, MapPin, BookOpen, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BookCard } from '../components/BookCard';
import { Book } from '../data/mockData';
import { apiUrl, absoluteUrl } from '../config';
import { authFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface UserProfileData {
  id: number;
  first_name: string;
  last_name: string;
  nickname: string;
  email: string;
  about: string;
  avatar: string;
  city: string;
  date_of_birth: string;
  is_private: boolean;
  is_owner: boolean;
  is_followed: boolean;
  is_pending: boolean;
}

export function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isBanned = Boolean(currentUser?.is_banned);
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch user profile
        const userRes = await authFetch(apiUrl(`/api/users/${id}`));
        if (!userRes.ok) {
          if (userRes.status === 404) {
            setError('User not found');
          } else {
            setError('Failed to load profile');
          }
          return;
        }
        const userData = await userRes.json();
        setUser(userData);

        // If it's the current user's profile, redirect to /profile
        if (userData.is_owner) {
          navigate('/profile', { replace: true });
          return;
        }

        // Fetch user's books
        try {
          const booksRes = await authFetch(apiUrl(`/api/books`));
          if (booksRes.ok) {
            const allBooks = await booksRes.json();
            // Filter books by this user and map to correct format
            const filteredBooks = (allBooks || [])
              .filter((book: any) => book.owner_id === parseInt(id))
              .map((book: any) => ({
                ...book,
                id: String(book.id),
                imageUrl: book.images?.[0] || '/placeholder-book.png',
                description: book.description || '',
                available: book.available ?? true,
                owner: {
                  id: book.owner_id,
                  first_name: book.owner_first_name || '',
                  last_name: book.owner_last_name || '',
                  name: `${book.owner_first_name || ''} ${book.owner_last_name || ''}`.trim() || 'Unknown User',
                  avatar: book.owner_avatar || '/default-avatar.png',
                  city: book.owner_city || 'Unknown',
                  booksListed: 0,
                  booksExchanged: 0,
                },
                location: book.owner_city || book.city || 'Unknown Location',
              }));
            setUserBooks(filteredBooks);
          }
        } catch {
          setUserBooks([]);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id, navigate]);

  const handleSendMessage = () => {
    if (isBanned) return;
    navigate(`/messages?user=${id}`);
  };

  if (loading) {
    return (
      <div className="container py-8 text-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container py-8 text-center">
        <p className="text-muted-foreground">{error || 'User not found'}</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage src={absoluteUrl(user.avatar)} alt={user.first_name} />
              <AvatarFallback>
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-3xl mb-2">
                {user.first_name} {user.last_name}
              </h1>
              {user.nickname && (
                <p className="text-muted-foreground mb-2">@{user.nickname}</p>
              )}
              {user.city && (
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{user.city}</span>
                </div>
              )}
              {user.about && (
                <p className="text-sm text-muted-foreground mb-4">{user.about}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSendMessage} disabled={isBanned} title={isBanned ? 'Banned users cannot send messages' : undefined}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User's Books */}
      <Tabs defaultValue="books" className="space-y-6">
        <TabsList>
          <TabsTrigger value="books">Listed Books</TabsTrigger>
        </TabsList>

        <TabsContent value="books">
          {user.is_private && !user.is_followed ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">This profile is private</p>
              </CardContent>
            </Card>
          ) : userBooks.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No books listed yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
