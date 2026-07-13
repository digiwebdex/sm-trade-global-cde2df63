import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Database, Download, Trash2, RefreshCw, HardDrive, Clock, CloudUpload, Loader2,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BackupFile {
  filename: string;
  size: number;
  created: string;
  type: 'manual' | 'auto';
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export default function BackupsPage() {
  const { isAdmin } = useAuth();
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploadingDrive, setUploadingDrive] = useState<string | null>(null);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('sm_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const fetchBackups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/backups`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch backups');
      const data = await res.json();
      setBackups(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load backups';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const createBackup = async () => {
    try {
      setCreating(true);
      const res = await fetch(`${API_BASE}/backups`, { method: 'POST', headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Backup failed');
      const data = await res.json();
      toast.success(`Backup created: ${data.filename}`);
      fetchBackups();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Backup creation failed';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = (filename: string) => {
    const url = `${API_BASE}/backups/${encodeURIComponent(filename)}/download`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    fetch(url, { headers: getAuthHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.click();
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => toast.error('Download failed'));
  };

  const deleteBackup = async (filename: string) => {
    try {
      const res = await fetch(`${API_BASE}/backups/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Backup deleted');
      fetchBackups();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast.error(message);
    }
  };

  const uploadToDrive = async (filename: string) => {
    try {
      setUploadingDrive(filename);
      const res = await fetch(`${API_BASE}/backups/${encodeURIComponent(filename)}/upload-drive`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(data.error || 'Google Drive upload failed');
      }
      toast.success('Uploaded to Google Drive');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
    } finally {
      setUploadingDrive(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-shell">
        <p className="text-destructive">শুধুমাত্র Admin এই পেজ দেখতে পারবেন।</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Database className="h-6 w-6 shrink-0" /> ব্যাকাপ ম্যানেজমেন্ট
          </h1>
          <p className="page-subtitle">
            ম্যানুয়াল ব্যাকাপ তৈরি করুন এবং Google Drive-এ আপলোড করুন
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={fetchBackups} disabled={loading} className="flex-1 sm:flex-none">
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> রিফ্রেশ
          </Button>
          <Button onClick={createBackup} disabled={creating} className="flex-1 sm:flex-none">
            {creating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <HardDrive className="h-4 w-4 mr-1" />
            )}
            {creating ? 'ব্যাকাপ হচ্ছে...' : 'ম্যানুয়াল ব্যাকাপ'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" /> ব্যাকাপ তালিকা
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">কোনো ব্যাকাপ নেই</p>
          ) : (
            <div className="space-y-3">
              {backups.map((b) => (
                <div
                  key={b.filename}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Database className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{b.filename}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{formatDate(b.created)}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{formatBytes(b.size)}</span>
                        <Badge variant={b.type === 'auto' ? 'secondary' : 'outline'} className="text-[10px] h-4">
                          {b.type === 'auto' ? 'অটো' : 'ম্যানুয়াল'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => downloadBackup(b.filename)}
                      title="ডাউনলোড"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => uploadToDrive(b.filename)}
                      disabled={uploadingDrive === b.filename}
                      title="Google Drive-এ আপলোড"
                    >
                      {uploadingDrive === b.filename ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CloudUpload className="h-4 w-4" />
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>ব্যাকাপ ডিলিট করবেন?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{b.filename}" ডিলিট করলে আর ফিরে পাবেন না।
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>বাতিল</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteBackup(b.filename)}>
                            ডিলিট
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CloudUpload className="h-5 w-5" /> অটো ব্যাকাপ (Google Drive)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            প্রতিদিন রাত ২:০০ টায় স্বয়ংক্রিয়ভাবে ব্যাকাপ তৈরি হয়ে Google Drive-এ আপলোড হবে।
            সর্বশেষ ৭ দিনের ব্যাকাপ রাখা হবে।
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
