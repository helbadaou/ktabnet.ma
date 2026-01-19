export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  condition: string;
  description: string;
  imageUrl: string;
  owner: User;
  available: boolean;
  location: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  avatar: string;
  city: string;
  booksListed: number;
  booksExchanged: number;
}

export const genres = [
  'All',
  'Fiction',
  'Non-Fiction',
  'Science Fiction',
  'Romance',
  'Mystery',
  'Classic',
  'Biography',
  'History'
];

export const cities = [
  'All',
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Fes',
  'Tangier',
  'Agadir'
];

export const conditions = ['Excellent', 'Good', 'Fair'];
