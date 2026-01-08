import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, MessageSquare, MapPin } from 'lucide-react';
import { absoluteUrl } from '../config';

interface Book {
  id: number;
  owner_id: number;
  owner?: {
    first_name?: string;
    last_name?: string;
    avatar?: string;
    city?: string;
  };
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
  const [ownerName, setOwnerName] = useState<string>('');
  const navigate = useNavigate();
  const currentImage = book.images?.[currentImageIndex] || '/placeholder-book.png';

  const asAbsoluteImage = (path: string) => absoluteUrl(path);
  useEffect(() => {
    const full = [book.owner?.first_name, book.owner?.last_name].filter(Boolean).join(' ').trim();
    if (full) setOwnerName(full);
    else if (book.owner_id) setOwnerName(`User ${book.owner_id}`);
  }, [book]);

  const handlePrevImage = () => {
    if (book.images && book.images.length > 0) {
      setCurrentImageIndex((prev) => (prev === 0 ? book.images.length - 1 : prev - 1));
    }
  };

  const handleNextImage = () => {
    if (book.images && book.images.length > 0) {
      setCurrentImageIndex((prev) => (prev === book.images.length - 1 ? 0 : prev + 1));
    }
  };

  const handleChatAboutBook = () => {
    navigate('/messages', { state: { bookId: book.id, bookTitle: book.title, ownerId: book.owner_id } });
    onClose();
  };

  if (!book) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Book details</DialogTitle>
        <DialogDescription>Review the book information and images.</DialogDescription>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Carousel */}
          <div className="relative">
            <div className="relative h-96 bg-muted rounded-lg overflow-hidden">
              <img src={asAbsoluteImage(currentImage)} alt={book.title} className="w-full h-full object-cover" />
              {book.images && book.images.length > 1 && (
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
                    {currentImageIndex + 1} / {book.images.length}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Book Details */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{book.title}</h2>
              <p className="text-lg text-muted-foreground">{book.author}</p>
              {ownerName && (
                <p className="text-sm text-muted-foreground">Owner: {ownerName}</p>
              )}
              {book.city && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" /> {book.city}
                </p>
              )}
            </div>

            {book.isbn && (
              <p className="text-sm text-muted-foreground">ISBN: {book.isbn}</p>
            )}

            <div className="flex gap-2 flex-wrap">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded text-sm">{book.condition}</span>
              {book.genre && <span className="bg-secondary/10 text-secondary px-3 py-1 rounded text-sm">{book.genre}</span>}
            </div>

            {book.description && (
              <div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{book.description}</p>
              </div>
            )}

            {book.available && (
              <Button onClick={handleChatAboutBook} className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" /> Chat About This Book
              </Button>
            )}

            {!book.available && (
              <p className="text-sm text-muted-foreground text-center py-4">This book is not available for exchange</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
