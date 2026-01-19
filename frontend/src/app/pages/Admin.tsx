import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  BookOpen, 
  Flag, 
  Check, 
  X, 
  Trash2, 
  Eye,
  ArrowLeft,
  RefreshCw,
  UserCog
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import { apiUrl, absoluteUrl } from '../config';
import { authFetch } from '../utils/api';

interface Report {
  id: number;
  reporter_id: number;
  reported_type: 'user' | 'book';
  reported_id: number;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes: string;
  created_at: string;
  reporter_name: string;
  reporter_avatar: string;
  reported_name: string;
}

interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  nickname: string;
  avatar: string;
  city: string;
  role: string;
  created_at: string;
}

export function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchReports();
    fetchUsers();
  }, [isAdmin, navigate]);

  const fetchReports = async () => {
    try {
      const url = statusFilter === 'all' 
        ? apiUrl('/api/admin/reports')
        : apiUrl(`/api/admin/reports?status=${statusFilter}`);
      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        setReports(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authFetch(apiUrl('/api/admin/users'));
      if (response.ok) {
        const data = await response.json();
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchReports();
    }
  }, [statusFilter]);

  const updateReportStatus = async (reportId: number, status: string) => {
    try {
      const response = await authFetch(apiUrl(`/api/admin/reports/${reportId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: adminNotes }),
      });
      if (response.ok) {
        fetchReports();
        setSelectedReport(null);
        setAdminNotes('');
      }
    } catch (error) {
      console.error('Failed to update report:', error);
    }
  };

  const deleteReport = async (reportId: number) => {
    try {
      const response = await authFetch(apiUrl(`/api/admin/reports/${reportId}`), {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchReports();
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  const updateUserRole = async (userId: number, role: string) => {
    try {
      const response = await authFetch(apiUrl(`/api/admin/users/${userId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      const response = await authFetch(apiUrl(`/api/admin/users/${userId}`), {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const deleteBook = async (bookId: number) => {
    try {
      const response = await authFetch(apiUrl(`/api/admin/books/${bookId}`), {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchReports();
      }
    } catch (error) {
      console.error('Failed to delete book:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'destructive',
      reviewed: 'secondary',
      resolved: 'default',
      dismissed: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam',
      inappropriate: 'Inappropriate',
      fake: 'Fake/Misleading',
      harassment: 'Harassment',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  if (!isAdmin) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Access denied</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage reports, users, and content</p>
        </div>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Reports
            {reports.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {reports.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reports</CardTitle>
                  <CardDescription>Review and manage user reports</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={fetchReports}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading reports...</p>
              ) : reports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No reports found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reported</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {report.reported_type === 'book' ? (
                              <><BookOpen className="h-3 w-3 mr-1" /> Book</>
                            ) : (
                              <><Users className="h-3 w-3 mr-1" /> User</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {report.reported_name || `ID: ${report.reported_id}`}
                        </TableCell>
                        <TableCell>{getReasonLabel(report.reason)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={absoluteUrl(report.reporter_avatar)} />
                              <AvatarFallback>{report.reporter_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{report.reporter_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="View Details">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Report Details</AlertDialogTitle>
                                  <AlertDialogDescription asChild>
                                    <div className="space-y-3 text-left">
                                      <p><strong>Type:</strong> {report.reported_type}</p>
                                      <p><strong>Reported:</strong> {report.reported_name}</p>
                                      <p><strong>Reason:</strong> {getReasonLabel(report.reason)}</p>
                                      <p><strong>Description:</strong> {report.description || 'No description'}</p>
                                      <p><strong>Reporter:</strong> {report.reporter_name}</p>
                                      <p><strong>Status:</strong> {report.status}</p>
                                      {report.admin_notes && (
                                        <p><strong>Admin Notes:</strong> {report.admin_notes}</p>
                                      )}
                                      <div className="pt-4">
                                        <label className="text-sm font-medium">Add Notes:</label>
                                        <Textarea
                                          placeholder="Add admin notes..."
                                          value={adminNotes}
                                          onChange={(e) => setAdminNotes(e.target.value)}
                                          className="mt-2"
                                        />
                                      </div>
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                  <AlertDialogCancel>Close</AlertDialogCancel>
                                  {report.status === 'pending' && (
                                    <>
                                      <Button
                                        variant="outline"
                                        onClick={() => updateReportStatus(report.id, 'dismissed')}
                                      >
                                        <X className="h-4 w-4 mr-1" /> Dismiss
                                      </Button>
                                      <Button
                                        onClick={() => updateReportStatus(report.id, 'resolved')}
                                      >
                                        <Check className="h-4 w-4 mr-1" /> Resolve
                                      </Button>
                                    </>
                                  )}
                                  {report.reported_type === 'book' && (
                                    <Button
                                      variant="destructive"
                                      onClick={() => {
                                        deleteBook(report.reported_id);
                                        updateReportStatus(report.id, 'resolved');
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" /> Delete Book
                                    </Button>
                                  )}
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            {report.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Resolve"
                                  onClick={() => updateReportStatus(report.id, 'resolved')}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Dismiss"
                                  onClick={() => updateReportStatus(report.id, 'dismissed')}
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Delete Report">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Report</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this report? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteReport(report.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>Manage user accounts and roles</CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={fetchUsers}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={absoluteUrl(u.avatar)} />
                              <AvatarFallback>{u.first_name?.[0]}{u.last_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{u.first_name} {u.last_name}</p>
                              {u.nickname && (
                                <p className="text-sm text-muted-foreground">@{u.nickname}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.city || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {u.id !== user?.id && (
                              <>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" title="Change Role">
                                      <UserCog className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Change User Role</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Change the role for {u.first_name} {u.last_name}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => updateUserRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                                      >
                                        Make {u.role === 'admin' ? 'User' : 'Admin'}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" title="Delete User">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete {u.first_name} {u.last_name}? 
                                        This will also delete all their books and data. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteUser(u.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete User
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                            {u.id === user?.id && (
                              <span className="text-xs text-muted-foreground px-2">(You)</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
