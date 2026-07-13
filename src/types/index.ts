export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'admin' | 'staff';
  email: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  organization: string;
  address: string;
  phone: string;
  email: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  unitType: string;
  createdAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ChallanItem {
  id: string;
  itemName: string;
  details: string;
  size: string;
  deliveryQty: number;
  balanceQty: number;
  unit: string;
}

export interface Payment {
  id: string;
  date: string;
  method: 'Cash' | 'Bank' | 'bKash' | 'Nagad' | 'Check';
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail?: string;
  items: LineItem[];
  totalAmount: number;
  tax?: number;
  totalPaid?: number;
  payments?: Payment[];
  status: 'draft' | 'sent' | 'paid' | 'partial';
  amountInWords?: string;
  signatureReceived?: string;
  signaturePrepared?: string;
  signatureAuthorize?: string;
  notes: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: LineItem[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  amountInWords?: string;
  validUntil: string;
  notes: string;
  signatureReceived?: string;
  signaturePrepared?: string;
  signatureAuthorize?: string;
  createdAt: string;
}

export interface Challan {
  id: string;
  challanNumber: string;
  date: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: ChallanItem[];
  totalQuantity: number;
  status: 'draft' | 'delivered';
  signatureReceived?: string;
  signaturePrepared?: string;
  signatureAuthorize?: string;
  notes: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  supplierName: string;
  supplierAddress: string;
  supplierPhone: string;
  supplierEmail: string;
  items: LineItem[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'received';
  amountInWords?: string;
  notes: string;
  createdAt: string;
}

export interface CompanySettings {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  signatureReceived?: string;
  signaturePrepared?: string;
  signatureAuthorize?: string;
}

export type DocumentType = 'invoice' | 'quotation' | 'challan' | 'purchaseOrder';
