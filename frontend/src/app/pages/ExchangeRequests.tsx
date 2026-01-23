import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Check, X, Clock, BookOpen, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config';
import { authFetch } from '../utils/api';

interface ExchangeRequest {
  id: number;
  book_id: number;
  book_title: string;
  book_author: string;
  book_image: string;
  offered_book_id: number;
  offered_title: string;
  offered_author: string;
  offered_image: string;
  requester_id: number;
  requester_name: string;
  requester_avatar: string;
  owner_id: number;
  owner_name: string;
  owner_avatar: string;
  status: string;
  created_at: string;
  is_incoming: boolean;
}

export function ExchangeRequests() {
  const { user } = useAuth();
  const isBanned = Boolean(user?.is_banned);
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await authFetch(apiUrl('/api/exchange-requests'));
      if (res.ok) {
        const data = await res.json();
        setRequests(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch exchange requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (exchangeId: number, status: 'accepted' | 'declined') => {
    setUpdating(exchangeId);
    try {
      const res = await authFetch(apiUrl('/api/exchange-requests/update'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchange_id: exchangeId, status }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === exchangeId ? { ...r, status } : r))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(null);
    }
  };

  const handleCancel = async (exchangeId: number) => {
    setUpdating(exchangeId);
    try {
      const res = await authFetch(apiUrl('/api/exchange-requests/cancel'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchange_id: exchangeId }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === exchangeId ? { ...r, status: 'cancelled' } : r))
        );
      }
    } catch (err) {
      console.error('Failed to cancel request:', err);
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <Check className="w-3 h-3" /> Accepted
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <X className="w-3 h-3" /> Declined
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const incomingRequests = requests.filter((r) => r.is_incoming);
  const outgoingRequests = requests.filter((r) => !r.is_incoming);

  const RequestCard = ({ request }: { request: ExchangeRequest }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Requested Book */}
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-2">
              {request.is_incoming ? 'Your book' : 'Requested book'}
            </p>
            <Link to={`/books/${request.book_id}`} className="flex gap-3 hover:opacity-80">
              <div className="w-16 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                {request.book_image ? (
                  <img
                    src={apiUrl(request.book_image)}
                    alt={request.book_title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium line-clamp-1">{request.book_title}</p>
                <p className="text-sm text-muted-foreground">{request.book_author}</p>
              </div>
            </Link>
          </div>

          {/* Exchange Arrow */}
          <div className="flex items-center justify-center px-4">
            <ArrowLeftRight className="w-6 h-6 text-muted-foreground" />
          </div>

          {/* Offered Book */}
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-2">
              {request.is_incoming ? 'Offered in exchange' : 'Your offered book'}
            </p>
            <Link to={`/books/${request.offered_book_id}`} className="flex gap-3 hover:opacity-80">
              <div className="w-16 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                {request.offered_image ? (
                  <img
                    src={apiUrl(request.offered_image)}
                    alt={request.offered_title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium line-clamp-1">{request.offered_title}</p>
                <p className="text-sm text-muted-foreground">{request.offered_author}</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Footer: User info, status, actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4 pt-4 border-t gap-4">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${request.is_incoming ? request.requester_id : request.owner_id}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={apiUrl(request.is_incoming ? request.requester_avatar : request.owner_avatar)}
                />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <p className="text-sm font-medium">
                {request.is_incoming ? request.requester_name : request.owner_name}
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(request.created_at)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge(request.status)}

            {request.status === 'pending' && (
              <>
                {request.is_incoming ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(request.id, 'accepted')}
                      disabled={isBanned || updating === request.id}
                      title={isBanned ? 'Banned users cannot accept exchanges' : undefined}
                    >
                      <Check className="w-4 h-4 mr-1" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(request.id, 'declined')}
                      disabled={isBanned || updating === request.id}
                      title={isBanned ? 'Banned users cannot decline exchanges' : undefined}
                    >
                      <X className="w-4 h-4 mr-1" /> Decline
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancel(request.id)}
                    disabled={isBanned || updating === request.id}
                    title={isBanned ? 'Banned users cannot cancel exchanges' : undefined}
                  >
                    Cancel Request
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Loading exchange requests...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <ArrowLeftRight className="w-8 h-8" />
        Exchange Requests
      </h1>
      {isBanned && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Your account is banned. Exchange actions are disabled.
        </div>
      )}

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="incoming">
            Incoming ({incomingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            Outgoing ({outgoingRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          {incomingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No incoming exchange requests</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When someone wants to exchange books with you, it will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            incomingRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          )}
        </TabsContent>

        <TabsContent value="outgoing">
          {outgoingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No outgoing exchange requests</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <Link to="/books" className="text-primary hover:underline">
                    Browse books
                  </Link>{' '}
                  and request an exchange!
                </p>
              </CardContent>
            </Card>
          ) : (
            outgoingRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
