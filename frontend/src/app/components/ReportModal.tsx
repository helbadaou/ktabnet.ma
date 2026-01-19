import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { apiUrl } from '../config';
import { authFetch } from '../utils/api';

interface ReportModalProps {
  reportedType: 'user' | 'book';
  reportedId: string | number;
  reportedName: string;
  trigger?: React.ReactNode;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'fake', label: 'Fake or Misleading' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
];

export function ReportModal({ reportedType, reportedId, reportedName, trigger }: ReportModalProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authFetch(apiUrl('/api/report'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_type: reportedType,
          reported_id: reportedId,
          reason,
          description,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          setReason('');
          setDescription('');
        }, 2000);
      } else {
        const data = await response.text();
        setError(data || 'Failed to submit report');
      }
    } catch (err) {
      setError('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <Flag className="h-4 w-4 mr-2" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report {reportedType === 'book' ? 'Book' : 'User'}</DialogTitle>
          <DialogDescription>
            Report "{reportedName}" for violating our community guidelines.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="text-green-600 text-lg font-medium mb-2">✓ Report Submitted</div>
            <p className="text-muted-foreground text-sm">
              Thank you for helping keep our community safe.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Additional Details (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Provide more context about this report..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading} variant="destructive">
                {loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
