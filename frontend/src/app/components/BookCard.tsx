import { Link } from 'react-router-dom';
import { MapPin, User } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Book } from '../data/mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link to={`/books/${book.id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg cursor-pointer h-full">
        <div className="aspect-[3/4] overflow-hidden relative">
          <ImageWithFallback
            src={`http://localhost:8080${book.imageUrl}`}
            alt={book.title}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
          {!book.available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary">Not Available</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="line-clamp-1 mb-1">{book.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
          <div className="flex gap-2 mb-3">
            <Badge variant="outline">{book.genre}</Badge>
            <Badge variant="outline">{book.condition}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{book.location}</span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={book.owner.avatar} alt={book.owner.name} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{book.owner.name}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
