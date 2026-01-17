import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, RefreshCw, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { BookCard } from '../components/BookCard';
import { Book } from '../data/mockData';
import { apiUrl } from '../config';
import { authFetch } from '../utils/api';

export function HomePage() {
  const FEATURED_LIMIT = 10;
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const res = await authFetch(apiUrl('/api/books'));
        if (!res.ok) {
          setFeaturedBooks([]);
          return;
        }
        const data = await res.json();
        const mapped = (data || []).map((book: any) => ({
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
        setFeaturedBooks(mapped);
      } catch (err) {
        console.error('Error fetching featured books:', err);
        setFeaturedBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  return (
    <div className="flex flex-col items-center w-full mx-auto">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/10 to-background min-h-[60vh] w-full">
        <div className="container mx-auto py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6">
              Share Books, Build Community
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              BookNet.ma connects book lovers across Morocco. Exchange books, discover new stories,
              and join a community passionate about reading.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg">
                <Link to="/books">
                  <Search className="mr-2 h-5 w-5" />
                  Browse Books
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto py-16 text-center">
        <h2 className="text-3xl text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 place-items-center">
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2">List Your Books</h3>
              <p className="text-sm text-muted-foreground">
                Add books you want to exchange with details and photos. It's quick and easy.
              </p>
            </CardContent>
          </Card>

          <Card className="w-full max-w-sm">
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2">Find Books</h3>
              <p className="text-sm text-muted-foreground">
                Browse available books by genre, author, or location. Filter to find your next read.
              </p>
            </CardContent>
          </Card>

          <Card className="w-full max-w-sm">
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2">Exchange</h3>
              <p className="text-sm text-muted-foreground">
                Message book owners, arrange meetups, and swap books safely within your community.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
