import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, RefreshCw, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { BookCard } from '../components/BookCard';
import { Book } from '../data/mockData';

export function HomePage() {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true); 
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setFeaturedBooks([]); // No mock data available
      setLoading(false);
    };

    fetchBooks();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background flex items-center min-h-[60vh]">
        <div className="container py-24 md:py-32">
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
              <Button asChild variant="outline" size="lg">
                <Link to="/list-book">
                  <BookOpen className="mr-2 h-5 w-5" />
                  List a Book
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-16">
        <h2 className="text-3xl text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2">List Your Books</h3>
              <p className="text-sm text-muted-foreground">
                Add books you want to exchange with details and photos. It's quick and easy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2">Find Books</h3>
              <p className="text-sm text-muted-foreground">
                Browse available books by genre, author, or location. Filter to find your next read.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
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

      {/* Featured Books */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl">Featured Books</h2>
          <Button asChild variant="ghost">
            <Link to="/books">View All</Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p>Loading...</p>
          ) : (
            featuredBooks.map((book) => <BookCard key={book.id} book={book} />)
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted py-16">
        <div className="container text-center">
          <h2 className="text-3xl mb-4">Ready to Start Exchanging?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join BookNet.ma today and become part of Morocco's growing book-loving community.
          </p>
          <Button asChild size="lg">
            <Link to="/list-book">
              <BookOpen className="mr-2 h-5 w-5" />
              List Your First Book
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
