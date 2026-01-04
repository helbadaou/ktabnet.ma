import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare, PlusCircle, User, Menu, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navLinks = [
    { path: '/', label: 'Home', icon: BookOpen },
    { path: '/books', label: 'Browse Books', icon: BookOpen },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/profile', label: 'Profile', icon: User }
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-center">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold">KtabNet.ma</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.slice(1).map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive(link.path) ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              {link.label}
            </Link>
          ))}
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </nav>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 text-sm font-medium transition-colors hover:text-primary ${isActive(link.path) ? 'text-primary' : 'text-muted-foreground'
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
              <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-3 text-sm font-medium">
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
