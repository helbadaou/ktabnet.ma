import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { BookDetail } from './pages/BookDetail';
import { Books } from './pages/Books';
import { Messages } from './pages/Messages';
import { Profile } from './pages/Profile';
import { UserProfile } from './pages/UserProfile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Admin } from './pages/Admin';
import { ExchangeRequests } from './pages/ExchangeRequests';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Admin route protection component
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

function AppContent() {
  const { user, loading } = useAuth();
  // Access user data
  console.log(user?.id);        // User ID
  console.log(user?.nickname);  // Username/nickname
  console.log(user?.email);     // Emai
  const isBanned = Boolean(user?.is_banned);

  return (
    <div className="min-h-screen flex flex-col">
      {!loading && user && <Header />}
      {!loading && user && isBanned && (
        <div className="border-b bg-amber-50 text-amber-900">
          <div className="container mx-auto py-2 text-sm">
            Your account is banned. You can browse books, but messaging and exchanges are disabled.
          </div>
        </div>
      )}
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/books" element={<Books />} />
            <Route path="/books/:id" element={<BookDetail />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/exchanges" element={<ExchangeRequests />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<UserProfile />} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          </Route>
        </Routes>
      </main>
      <footer className="border-t py-8 mt-16 bg-background flex items-center justify-center">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2024 KtabNet.ma. Connecting book lovers across Morocco.</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <NotificationProvider>
            <AppContent />
            <Toaster />
          </NotificationProvider>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
