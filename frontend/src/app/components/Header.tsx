import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare, PlusCircle, User, Menu, LogOut, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { SearchBar } from './SearchBar';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config';
import { authFetch } from '../utils/api';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
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

  const navLinks = [
    { path: '/', label: 'Home', icon: BookOpen },
    { path: '/books', label: 'Browse Books', icon: BookOpen },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/profile', label: 'Profile', icon: User }
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
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
      const res = await authFetch(apiUrl('/api/books'), {
        method: 'POST',
        body: form,
      });
      if (res.ok) {
        setFormData({ title: '', author: '', isbn: '', description: '', genre: 'Fiction', condition: 'good', city: 'Casablanca' });
        setImages([]);
        setShowAddForm(false);
        // Navigate to my books after adding
        navigate('/books');
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-center">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold">KtabNet.ma</span>
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden md:block">
          <SearchBar />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.slice(1).map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive(link.path) ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              {link.label}
            </Link>
          ))}
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Book
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </nav>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 text-sm font-medium transition-colors hover:text-primary ${isActive(link.path) ? 'text-primary' : 'text-muted-foreground'
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
              <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-3 text-sm font-medium">
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
              <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-3 text-sm font-medium">
                <Plus className="h-5 w-5" />
                Add Book
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

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
    </header>
  );
}
