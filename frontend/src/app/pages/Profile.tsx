import { useState, useEffect } from 'react';
import { User, MapPin, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Book } from '../data/mockData';
import { BookCard } from '../components/BookCard';
import { apiUrl, absoluteUrl } from '../config';
import { authFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface ProfileUser {
  id: number;
  first_name: string;
  last_name: string;
  nickname: string;
  email: string;
  about: string;
  avatar: string;
  city: string;
  date_of_birth: string;
  booksListed: number;
  booksExchanged: number;
}

export function Profile() {
  const { user, updateUser } = useAuth();
  const isBanned = Boolean(user?.is_banned);
  const [currentUser, setCurrentUser] = useState<ProfileUser | null>(null);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    nickname: '',
    about: '',
    city: '',
    date_of_birth: '',
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const res = await authFetch(apiUrl(`/api/auth/me`));

        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();

        const mappedUser: ProfileUser = {
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          nickname: data.nickname || '',
          email: data.email || '',
          about: data.about || '',
          avatar: data.avatar || "",
          city: data.city || "Unknown",
          date_of_birth: data.date_of_birth || '',
          booksListed: data.booksListed || 0,
          booksExchanged: data.booksExchanged || 0,
        };
        setCurrentUser(mappedUser);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          nickname: data.nickname || '',
          about: data.about || '',
          city: data.city || '',
          date_of_birth: data.date_of_birth || '',
        });
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBanned) return;
    setSaving(true);
    setSaveError('');

    try {
      const payload = new FormData();
      payload.append('first_name', formData.first_name);
      payload.append('last_name', formData.last_name);
      payload.append('nickname', formData.nickname);
      payload.append('about', formData.about);
      payload.append('city', formData.city);
      payload.append('date_of_birth', formData.date_of_birth);
      if (avatarFile) {
        payload.append('avatar', avatarFile);
      }

      const res = await authFetch(apiUrl('/api/profile/update'), {
        method: 'POST',
        body: payload,
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to update profile');
      }

      const data = await res.json();
      const updatedUser: ProfileUser = {
        id: data.id,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        nickname: data.nickname || '',
        email: data.email || '',
        about: data.about || '',
        avatar: data.avatar || '',
        city: data.city || '',
        date_of_birth: data.date_of_birth || '',
        booksListed: currentUser.booksListed,
        booksExchanged: currentUser.booksExchanged,
      };

      setCurrentUser(updatedUser);
      updateUser({
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        nickname: updatedUser.nickname,
        avatar: updatedUser.avatar,
        city: updatedUser.city,
        email: updatedUser.email,
      });
      setFormData({
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        nickname: updatedUser.nickname,
        about: updatedUser.about,
        city: updatedUser.city,
        date_of_birth: updatedUser.date_of_birth,
      });
      setShowEditForm(false);
      setAvatarFile(null);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      {isBanned && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Your account is banned. Editing your profile and listing books are disabled.
        </div>
      )}
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

            <Button
              disabled={isBanned}
              title={isBanned ? 'Banned users cannot edit their profile' : undefined}
              onClick={() => {
                setFormData({
                  first_name: currentUser.first_name || '',
                  last_name: currentUser.last_name || '',
                  nickname: currentUser.nickname || '',
                  about: currentUser.about || '',
                  city: currentUser.city || '',
                  date_of_birth: currentUser.date_of_birth || '',
                });
                setShowEditForm(true);
              }}
            >
              Edit Profile
            </Button>
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
                <Button disabled={isBanned} title={isBanned ? 'Banned users cannot list books' : undefined}>List Your First Book</Button>
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

      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="about">About</Label>
              <Textarea
                id="about"
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
            </div>

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}

            <Button type="submit" className="w-full" disabled={saving || isBanned}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
