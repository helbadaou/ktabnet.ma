import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, User, MessageSquare, ArrowLeft, ChevronLeft, ChevronRight, X, Flag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { Book } from '../data/mockData';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { apiUrl, absoluteUrl } from '../config';
import { authFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ReportModal } from '../components/ReportModal';


type ApiBook = Book & {
  images?: string[];
  city?: string;
  isbn?: string;
  imageUrl?: string;
  location?: string;
  owner_id?: number;
};

export function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<ApiBook | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerCity, setOwnerCity] = useState('');
  const [ownerAvatar, setOwnerAvatar] = useState('');
  const {user} = useAuth();
  console.log('Current user in BookDetail:', user);

  
  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      try {
        const response = await authFetch(apiUrl(`/api/books/${id}`));
        if (response.ok) {
          const data = await response.json();
          setBook(data);
          setCurrentImageIndex(0);
        } else {
          setBook(null);
        }
      } catch (error) {
        console.error('Failed to fetch book:', error);
        setBook(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBook();
    }
  }, [id]);

  useEffect(() => {
    const populateOwner = async () => {
      if (!book) return;
      if (!book.owner) return;

      const full = [book.owner.first_name, book.owner.last_name].filter(Boolean).join(' ').trim();
      if (full) setOwnerName(full);
      setOwnerCity(book.owner.city || '');
      setOwnerAvatar(book.owner.avatar || '');
    };
    populateOwner();
  }, [book]);

  if (loading) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Loading book details...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Book not found</p>
        <Button onClick={() => navigate('/books')} className="mt-4">
          Back to Books
        </Button>
      </div>
    );
  }

  const toAbsolute = (path: string) => absoluteUrl(path);
  const currentUserId = typeof user?.id === 'string' ? Number(user.id) : user?.id;

  const images = book.images && book.images.length > 0
    ? book.images
    : book.imageUrl
      ? [book.imageUrl]
      : ['/placeholder-book.png'];
  const primaryImage = images[currentImageIndex % images.length];

  return (
    <>
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/books')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Books
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Book Image */}
          <div className="relative flex justify-center">
            <div className="aspect-[3/4] overflow-hidden rounded-lg max-h-[480px] relative group">
              <button
                type="button"
                className="w-full h-full"
                onClick={() => setIsLightboxOpen(true)}
              >
                <ImageWithFallback
                  src={toAbsolute(primaryImage)}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </button>

              {book.images && book.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((i) => (i === 0 ? book.images!.length - 1 : i - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 z-10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((i) => (i === book.images!.length - 1 ? 0 : i + 1));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 z-10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                    {currentImageIndex + 1} / {book.images.length}
                  </div>
                </>
              )}
            </div>
            {!book.available && (
              <Badge className="absolute top-4 right-4" variant="secondary">
                Not Available
              </Badge>
            )}
          </div>

          {/* Book Details */}
          <div>
            <div className="mb-6">
              <div className="flex items-start justify-between">
                <h1 className="text-4xl font-bold mb-2">{book.title}</h1>
                {/* Report Book Button */}
                {user?.id !== book.owner_id && user?.id !== book.owner?.id && (
                  <ReportModal
                    reportedType="book"
                    reportedId={book.id}
                    reportedName={book.title}
                    trigger={
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Flag className="h-5 w-5" />
                      </Button>
                    }
                  />
                )}
              </div>
              <p className="text-xl text-muted-foreground mb-4">{book.author}</p>
              {ownerName && (
                <p className="text-sm text-muted-foreground mb-2">Owner: {ownerName}</p>
              )}
              {book.isbn && (
                <p className="text-sm text-muted-foreground mb-2">ISBN: {book.isbn}</p>
              )}
              <div className="flex gap-2 mb-4">
                <Badge variant="outline">{book.genre}</Badge>
                <Badge variant="outline">{book.condition} Condition</Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{book.city || book.location}</span>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground leading-relaxed">{book.description}</p>
            </div>

            <Separator className="my-6" />

            {/* Owner Info */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Book Owner</h3>
                {book.owner || ownerName ? (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={book.owner?.avatar || ownerAvatar} alt={book.owner?.first_name || ownerName || 'Owner'} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{book.owner?.first_name + " " + book.owner?.last_name || ownerName}</p>
                        <p className="text-sm text-muted-foreground">{book.owner?.city || ownerCity}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Books Listed</p>
                        <p className="font-medium">{book.owner?.booksListed ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Books Exchanged</p>
                        <p className="font-medium">{book.owner?.booksExchanged ?? '—'}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mb-4 text-muted-foreground">Owner information unavailable</div>
                )}
                {book.available && (
                  <Button
                    className="w-full"
                    onClick={() => navigate('/messages', {
                      state: {
                        selectedUserId: book.owner_id || book.owner?.id,
                        selectedUserName: ownerName || (book.owner?.first_name + " " + book.owner?.last_name),
                        selectedUserAvatar: ownerAvatar || book.owner?.avatar,
                        bookId: book.id,
                        bookTitle: book.title
                      }
                    })}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message Owner
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(false);
            }}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={toAbsolute(primaryImage)}
            alt={book.title}
            className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

