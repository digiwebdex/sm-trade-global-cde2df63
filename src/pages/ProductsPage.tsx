import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/utils/api';
import { formatBDT } from '@/lib/utils';
import { Product } from '@/types';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';

const emptyProduct = { name: '', description: '', unitPrice: 0, unitType: 'Pcs' };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    try {
      const data = await api.getProducts() as Product[];
      setProducts(data);
    } catch (err) { toast.error('Failed to load products'); }
  };
  useEffect(() => { load(); }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    try {
      if (editing) {
        await api.updateProduct(editing.id, form);
        toast.success('Product updated');
      } else {
        await api.createProduct(form);
        toast.success('Product added');
      }
      setForm(emptyProduct);
      setEditing(null);
      setDialogOpen(false);
      load();
    } catch (err) { toast.error('Failed to save product'); }
  };

  const handleEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, unitPrice: p.unitPrice, unitType: p.unitType });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this product?')) {
      try {
        await api.deleteProduct(id);
        toast.success('Product deleted');
        load();
      } catch (err) { toast.error('Failed to delete product'); }
    }
  };

  const openNew = () => { setEditing(null); setForm(emptyProduct); setDialogOpen(true); };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product catalog</p>
        </div>
        <Button onClick={openNew} className="bg-secondary hover:bg-secondary/90 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="table-responsive">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Unit Type</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No products found</TableCell></TableRow>
              ) : filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{p.description}</TableCell>
                  <TableCell>৳{formatBDT(p.unitPrice)}</TableCell>
                  <TableCell>{p.unitType}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Description</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Unit Price (৳)</label><Input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })} /></div>
            <div><label className="text-sm font-medium">Unit Type</label><Input value={form.unitType} onChange={(e) => setForm({ ...form, unitType: e.target.value })} placeholder="Pcs, Kg, Box, etc." /></div>
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
