import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { BookListings } from './pages/BookListings';
import { BookDetail } from './pages/BookDetail';
import { Books } from './pages/Books';
import { Messages } from './pages/Messages';
import { ListBook } from './pages/ListBook';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function AppContent() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {!loading && user && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/books" element={<Books />} />
            <Route path="/books/:id" element={<BookDetail />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </main>
      <footer className="border-t py-8 mt-16">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2024 BookNet.ma. Connecting book lovers across Morocco.</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}
