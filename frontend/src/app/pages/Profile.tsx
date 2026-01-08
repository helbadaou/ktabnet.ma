import { useState, useEffect } from 'react';
import { User, MapPin, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Book, User as UserType } from '../data/mockData';
import { BookCard } from '../components/BookCard';
import { apiUrl, absoluteUrl } from '../config';

export function Profile() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const res = await fetch(apiUrl(`/api/profile/me`), {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();

        const mappedUser = {
          id: data.Id,
          first_name: data.FirstName,
          last_name: data.LastName,
          name: `${data.Firstname} ${data.Fastname}`,
          avatar: data.Avatar || "",
          city: data.City || "Unknown",
          booksListed: data.booksListed || 0,
          booksExchanged: data.booksExchanged || 0,
        };
        console.log(data.FirstName)
        setCurrentUser(mappedUser);
        setUserBooks(data.books || []);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  if (loading) {
    return (
      <div className="container py-8 text-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container py-8 text-center">
        <p>Could not load profile. Please log in.</p>
        <Button asChild className="mt-4">
          <a href="/login">Login</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage src={absoluteUrl(currentUser.avatar)} alt={currentUser.first_name} />
              <AvatarFallback>
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-3xl mb-2">
                {currentUser.first_name} {currentUser.last_name}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{currentUser.city}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <div>
                  <p className="text-2xl font-semibold">{currentUser.booksListed}</p>
                  <p className="text-sm text-muted-foreground">Books Listed</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{currentUser.booksExchanged}</p>
                  <p className="text-sm text-muted-foreground">Books Exchanged</p>
                </div>
              </div>
            </div>

            <Button>Edit Profile</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="listed" className="space-y-6">
        <TabsList>
          <TabsTrigger value="listed">My Listed Books</TabsTrigger>
          <TabsTrigger value="exchanged">Exchange History</TabsTrigger>
        </TabsList>

        <TabsContent value="listed">
          {userBooks.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">You haven't listed any books yet</p>
                <Button>List Your First Book</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="exchanged">
          <Card>
            <CardHeader>
              <h2>Exchange History</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">No exchange history yet.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}