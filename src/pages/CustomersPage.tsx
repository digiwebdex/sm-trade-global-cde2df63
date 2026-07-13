import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/utils/api';
import { Customer } from '@/types';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';

const emptyCustomer = { name: '', organization: '', address: '', phone: '', email: '' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyCustomer);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    try {
      const data = await api.getCustomers() as Customer[];
      setCustomers(data);
    } catch (err) { toast.error('Failed to load customers'); }
  };
  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.organization.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const handleSave = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    try {
      if (editing) {
        await api.updateCustomer(editing.id, form);
        toast.success('Customer updated');
      } else {
        await api.createCustomer(form);
        toast.success('Customer added');
      }
      setForm(emptyCustomer);
      setEditing(null);
      setDialogOpen(false);
      load();
    } catch (err) { toast.error('Failed to save customer'); }
  };

  const handleEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, organization: c.organization, address: c.address, phone: c.phone, email: c.email });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this customer?')) {
      try {
        await api.deleteCustomer(id);
        toast.success('Customer deleted');
        load();
      } catch (err) { toast.error('Failed to delete customer'); }
    }
  };

  const openNew = () => { setEditing(null); setForm(emptyCustomer); setDialogOpen(true); };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage your customer database</p>
        </div>
        <Button onClick={openNew} className="bg-secondary hover:bg-secondary/90 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="table-responsive">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No customers found</TableCell></TableRow>
              ) : filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.organization}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{c.address}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Organization</label><Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Phone</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Email</label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Address</label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={handleSave} className="bg-secondary hover:bg-secondary/90 w-full sm:w-auto">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
