"use client";
import { useState, useEffect, useContext } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AuthContext } from '../context/AuthContext';
import { BookCard } from '../components/BookCard';
import { Book } from '../data/mockData';
import BookDetailModal from '../components/BookDetailModal';

export function Books() {
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.user;
  const [feedBooks, setFeedBooks] = useState<Book[]>([]);
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingMyBooks, setLoadingMyBooks] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-books'>('browse');
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    genre: 'Fiction',
    condition: 'good',
    city: 'Casablanca',
  });
  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    fetchFeedBooks();
  }, [currentUser]);

  const fetchFeedBooks = async () => {
    if (!currentUser) return;
    setLoadingFeed(true);
    try {
      const res = await fetch('/api/books', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const mappedBooks = (data || []).map((book: any) => ({
          ...book,
          id: String(book.id),
          imageUrl: book.images?.[0] || '/placeholder-book.png',
          owner: {
            name: `${book.owner_first_name || ''} ${book.owner_last_name || ''}`.trim() || 'Unknown User',
            avatar: book.owner_avatar || '/default-avatar.png',
            id: String(book.owner_id),
            city: book.owner_city || 'Unknown',
            booksListed: 0,
            booksExchanged: 0,
          },
          location: book.owner_city || 'Unknown Location',
        }));
        setFeedBooks(mappedBooks);
      }
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setLoadingFeed(false);
    }
  };

  const fetchMyBooks = async () => {
    if (!currentUser) return;
    setLoadingMyBooks(true);
    try {
      const res = await fetch('/api/my-books', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const mappedBooks = (data || []).map((book: any) => ({
          ...book,
          id: String(book.id),
          imageUrl: book.images?.[0] || '/placeholder-book.png',
          owner: {
            name: `${book.owner_first_name || ''} ${book.owner_last_name || ''}`.trim() || currentUser.first_name || 'Unknown User',
            avatar: book.owner_avatar || currentUser.avatar || '/default-avatar.png',
            id: String(book.owner_id),
            city: book.owner_city || 'Unknown',
            booksListed: 0,
            booksExchanged: 0,
          },
          location: book.owner_city || 'Unknown Location',
        }));
        setMyBooks(mappedBooks);
      }
    } catch (err) {
      console.error('Error fetching my books:', err);
    } finally {
      setLoadingMyBooks(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author) {
      alert('Please fill in title and author');
      return;
    }

    const form = new FormData();
    form.append('title', formData.title);
    form.append('author', formData.author);
    form.append('isbn', formData.isbn);
    form.append('description', formData.description);
    form.append('genre', formData.genre);
    form.append('condition', formData.condition);
    form.append('city', formData.city);
    images.forEach((img) => form.append('images', img));

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      if (res.ok) {
        setFormData({ title: '', author: '', isbn: '', description: '', genre: 'Fiction', condition: 'good', city: 'Casablanca' });
        setImages([]);
        setShowAddForm(false);
        fetchMyBooks();
      }
    } catch (err) {
      console.error('Error adding book:', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  if (!currentUser) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="text-4xl mb-6">Books</h1>

      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          const next = val as 'browse' | 'my-books';
          setActiveTab(next);
          if (next === 'my-books') {
            fetchMyBooks();
          } else if (next === 'browse') {
            fetchFeedBooks();
          }
        }}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="browse">Browse Books</TabsTrigger>
          <TabsTrigger value="my-books">My Books</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          {loadingFeed ? (
            <div className="text-center text-muted-foreground">Loading books...</div>
          ) : feedBooks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {feedBooks.map((book) => (
                <div key={book.id} onClick={() => setSelectedBook(book)} className="cursor-pointer">
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">No books available</div>
          )}
        </TabsContent>

        <TabsContent value="my-books" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">My Books</h2>
            <Button onClick={() => { setShowAddForm(true); fetchMyBooks(); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Book
            </Button>
          </div>

          {loadingMyBooks ? (
            <div className="text-center text-muted-foreground">Loading books...</div>
          ) : myBooks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {myBooks.map((book) => (
                <div key={book.id} onClick={() => setSelectedBook(book)} className="cursor-pointer">
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">No books yet. Add your first book!</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Book Form Modal */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a New Book</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBook} className="space-y-4">
            <Input
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <Input
              placeholder="Author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
            />
            <Input
              placeholder="ISBN (optional)"
              value={formData.isbn}
              onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
            />
            <select
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="Fiction">Fiction</option>
              <option value="Romance">Romance</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Science Fiction">Science Fiction</option>
              <option value="Mystery">Mystery</option>
              <option value="Biography">Biography</option>
              <option value="History">History</option>
              <option value="Self-Help">Self-Help</option>
            </select>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
            />
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
            <select
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="Marrakesh">Marrakesh</option>
              <option value="Beni Mellal">Beni Mellal</option>
              <option value="Casablanca">Casablanca</option>
              <option value="Rabat">Rabat</option>
            </select>
            <div>
              <label className="block text-sm mb-2">Upload Images (up to 5)</label>
              <Input type="file" multiple accept="image/*" onChange={handleImageChange} />
              {images.length > 0 && <p className="text-sm mt-2">{images.length} image(s) selected</p>}
            </div>
            <Button type="submit" className="w-full">
              Add Book
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Book Detail Modal */}
      {selectedBook && <BookDetailModal book={selectedBook as any} onClose={() => setSelectedBook(null)} />}
    </div>
  );
}
