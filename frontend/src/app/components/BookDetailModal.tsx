import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, MessageSquare, MapPin } from 'lucide-react';

interface Book {
  id: number;
  owner_id: number;
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  genre?: string;
  condition: string;
  available: boolean;
  images: string[];
  city?: string;
  created_at: string;
  updated_at: string;
}

export default function BookDetailModal({ book, onClose }: { book: Book; onClose: () => void }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bookData, setBookData] = useState<Book | null>(book);
  const [ownerName, setOwnerName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookDetails();
    fetchOwnerName();
  }, [book.id]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/books/${book.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch book details');
      }
      const data = await response.json();
      setBookData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching book:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentImage = bookData?.images?.[currentImageIndex] || '/placeholder-book.png';

  const asAbsoluteImage = (path: string) =>
    path.startsWith('http://') || path.startsWith('https://')
      ? path
      : `http://localhost:8080${path}`;

  const handlePrevImage = () => {
    if (bookData?.images && bookData.images.length > 0) {
      setCurrentImageIndex((prev) => (prev === 0 ? bookData.images.length - 1 : prev - 1));
    }
  };

  const handleNextImage = () => {
    if (bookData?.images && bookData.images.length > 0) {
      setCurrentImageIndex((prev) => (prev === bookData.images.length - 1 ? 0 : prev + 1));
    }
  };

  const fetchOwnerName = async () => {
    try {
      const res = await fetch(`/api/users/${book.owner_id}`);
      if (!res.ok) return;
      const data = await res.json();
      const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
      setOwnerName(fullName || 'Unknown user');
    } catch (err) {
      console.error('Error fetching owner profile:', err);
    }
  };

  const handleChatAboutBook = () => {
    if (bookData) {
      navigate('/messages', { state: { bookId: bookData.id, bookTitle: bookData.title, ownerId: bookData.owner_id } });
      onClose();
    }
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Loading book</DialogTitle>
          <DialogDescription>Fetching the latest details for this book.</DialogDescription>
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Loading book details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !bookData) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Error</DialogTitle>
          <DialogDescription>There was a problem loading the book details.</DialogDescription>
          <div className="flex items-center justify-center h-96">
            <p className="text-destructive">{error || 'Failed to load book'}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Book details</DialogTitle>
        <DialogDescription>Review the book information and images.</DialogDescription>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Carousel */}
          <div className="relative">
            <div className="relative h-96 bg-muted rounded-lg overflow-hidden">
              <img src={asAbsoluteImage(currentImage)} alt={bookData.title} className="w-full h-full object-cover" />
              {bookData.images && bookData.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                    {currentImageIndex + 1} / {bookData.images.length}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Book Details */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{bookData.title}</h2>
              <p className="text-lg text-muted-foreground">{bookData.author}</p>
              {ownerName && (
                <p className="text-sm text-muted-foreground">Owner: {ownerName}</p>
              )}
              {bookData.city && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" /> {bookData.city}
                </p>
              )}
            </div>

            {bookData.isbn && (
              <p className="text-sm text-muted-foreground">ISBN: {bookData.isbn}</p>
            )}

            <div className="flex gap-2 flex-wrap">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded text-sm">{bookData.condition}</span>
              {bookData.genre && <span className="bg-secondary/10 text-secondary px-3 py-1 rounded text-sm">{bookData.genre}</span>}
            </div>

            {bookData.description && (
              <div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{bookData.description}</p>
              </div>
            )}

            {bookData.available && (
              <Button onClick={handleChatAboutBook} className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" /> Chat About This Book
              </Button>
            )}

            {!bookData.available && (
              <p className="text-sm text-muted-foreground text-center py-4">This book is not available for exchange</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
