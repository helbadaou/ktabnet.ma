import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, User } from 'lucide-react';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from './ui/command';
import { apiUrl } from '../config';
import { authFetch } from '../utils/api';

interface BookResult {
  id: number;
  title: string;
  author: string;
  genre: string;
  city: string;
  image: string;
}

interface UserResult {
  id: number;
  first_name: string;
  last_name: string;
  nickname: string;
}

interface SearchResults {
  books: BookResult[];
  users: UserResult[];
}

export function SearchBar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ books: [], users: [] });
  const [loading, setLoading] = useState(false);

  // Debounced search
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults({ books: [], users: [] });
      return;
    }

    setLoading(true);
    try {
      const [booksRes, usersRes] = await Promise.all([
        authFetch(apiUrl(`/api/books/search?query=${encodeURIComponent(searchQuery)}`)),
        authFetch(apiUrl(`/api/search?query=${encodeURIComponent(searchQuery)}`))
      ]);

      const books = booksRes.ok ? await booksRes.json() : [];
      const users = usersRes.ok ? await usersRes.json() : [];

      setResults({
        books: books || [],
        users: users || []
      });
    } catch (err) {
      console.error('Search error:', err);
      setResults({ books: [], users: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelectBook = (bookId: number) => {
    setOpen(false);
    setQuery('');
    navigate(`/books/${bookId}`);
  };

  const handleSelectUser = (userId: number) => {
    setOpen(false);
    setQuery('');
    navigate(`/profile/${userId}`);
  };

  const hasResults = results.books.length > 0 || results.users.length > 0;

  return (
    <Popover open={open && (query.length >= 2)} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books or users..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length >= 2) {
                setOpen(true);
              }
            }}
            onFocus={() => {
              if (query.length >= 2) {
                setOpen(true);
              }
            }}
            className="pl-9 h-9"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Command shouldFilter={false}>
          <CommandList>
            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}
            {!loading && !hasResults && query.length >= 2 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {!loading && results.books.length > 0 && (
              <CommandGroup heading="Books">
                {results.books.map((book) => (
                  <CommandItem
                    key={`book-${book.id}`}
                    onSelect={() => handleSelectBook(book.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {book.image ? (
                        <img
                          src={apiUrl(`/uploads/books/${book.image}`)}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground truncate">by {book.author}</p>
                        <p className="text-xs text-muted-foreground">{book.city}</p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!loading && results.users.length > 0 && (
              <CommandGroup heading="Users">
                {results.users.map((user) => (
                  <CommandItem
                    key={`user-${user.id}`}
                    onSelect={() => handleSelectUser(user.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {user.first_name} {user.last_name}
                        </p>
                        {user.nickname && (
                          <p className="text-xs text-muted-foreground">@{user.nickname}</p>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
