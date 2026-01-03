import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { genres, cities, Book } from '../data/mockData';
import { BookCard } from '../components/BookCard';

export function BookListings() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      // In a real app, you would fetch from an API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setBooks([]); // No mock data available
      setLoading(false);
    };

    fetchBooks();
  }, []);

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || book.genre === selectedGenre;
    const matchesCity = selectedCity === 'All' || book.location === selectedCity;
    const matchesAvailability = !showAvailableOnly || book.available;

    return matchesSearch && matchesGenre && matchesCity && matchesAvailability;
  });

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl mb-2">Browse Books</h1>
        <p className="text-muted-foreground">
          Discover your next favorite book from our community
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-muted/50 rounded-lg p-6 mb-8">
        <div className="grid gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger>
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showAvailableOnly ? 'default' : 'outline'}
              onClick={() => setShowAvailableOnly(!showAvailableOnly)}
              className="w-full"
            >
              {showAvailableOnly ? 'Available Only' : 'All Books'}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('All');
                setSelectedCity('All');
                setShowAvailableOnly(false);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${filteredBooks.length} ${filteredBooks.length === 1 ? 'book' : 'books'} found`}
        </p>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Loading books...</p>
        </div>
      ) : filteredBooks.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">No books found matching your criteria</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedGenre('All');
              setSelectedCity('All');
              setShowAvailableOnly(false);
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
