import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { LineItem, ChallanItem, Payment } from '@/types';
import DocumentPreview from '@/components/DocumentPreview';
import { CheckCircle, XCircle, FileText } from 'lucide-react';

const NAVY = '#1B3A5C';
const GREEN = '#16a34a';

type PreviewType = 'invoice' | 'quotation' | 'challan' | 'purchaseOrder';

interface VerifyDoc {
  invoiceNumber?: string;
  quotationNumber?: string;
  challanNumber?: string;
  poNumber?: string;
  date?: string;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  supplierName?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  items?: LineItem[] | ChallanItem[];
  totalAmount?: number;
  totalQuantity?: number;
  orderNo?: string;
  status?: string;
  notes?: string;
  tax?: number;
  totalPaid?: number;
  payments?: Payment[];
  amountInWords?: string;
  signatureReceived?: string;
  signaturePrepared?: string;
  signatureAuthorize?: string;
}

export default function VerifyPage() {
  const { type, docId } = useParams<{ type: string; docId: string }>();
  const [document, setDocument] = useState<VerifyDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(false);

  useEffect(() => {
    if (!type || !docId) {
      setLoading(false);
      return;
    }

    api.verifyDocument(type, docId)
      .then((payload) => {
        if (payload?.document) {
          setDocument(payload.document as VerifyDoc);
          setFound(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setFound(false);
        setLoading(false);
      });
  }, [type, docId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7fa] p-4">
        <p className="text-base text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const typeLabel: Record<string, string> = {
    invoice: 'Invoice (Bill)',
    quotation: 'Quotation',
    challan: 'Challan',
    'purchase-order': 'Purchase Order',
  };

  const docTypeMap: Record<string, PreviewType> = {
    invoice: 'invoice',
    quotation: 'quotation',
    challan: 'challan',
    'purchase-order': 'purchaseOrder',
  };

  const previewType = docTypeMap[type || ''] || 'invoice';
  const documentNumber = String(
    document?.invoiceNumber || document?.quotationNumber || document?.challanNumber || document?.poNumber || '',
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5] pb-10">
      <div
        className="px-4 py-4 sm:px-6 sm:py-5 text-center text-white shadow-md"
        style={{ background: found ? GREEN : '#dc2626' }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-3xl mx-auto">
          {found ? <CheckCircle size={28} strokeWidth={2.5} className="shrink-0" /> : <XCircle size={28} strokeWidth={2.5} className="shrink-0" />}
          <div>
            <h1 className="text-lg sm:text-xl font-bold">
              {found ? '✅ Document Verified' : '❌ Document Not Found'}
            </h1>
            <p className="text-xs sm:text-sm mt-1 opacity-90">
              {found
                ? `This ${typeLabel[type || ''] || 'document'} is authentic and issued by S. M. Trade International`
                : 'This document could not be verified. It may not exist or the link is invalid.'}
            </p>
          </div>
        </div>
      </div>

      {found && document && (
        <>
          <div className="max-w-[794px] mx-auto mt-4 sm:mt-5 px-4 sm:px-6 py-3 bg-white rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={20} color={NAVY} className="shrink-0" />
              <div className="min-w-0">
                <span className="text-sm font-bold block truncate" style={{ color: NAVY }}>{documentNumber}</span>
                <span className="text-xs text-muted-foreground">
                  {typeLabel[type || '']} • {String(document.date || '')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:ml-auto shrink-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GREEN }} />
              <span className="text-xs font-bold" style={{ color: GREEN }}>Verified</span>
            </div>
          </div>

          <div className="max-w-[840px] mx-auto px-4 sm:px-5">
            <DocumentPreview
              type={previewType}
              documentNumber={documentNumber}
              date={String(document.date || '')}
              customerName={String(document.customerName || document.supplierName || '')}
              customerAddress={String(document.customerAddress || document.supplierAddress || '')}
              customerPhone={String(document.customerPhone || document.supplierPhone || '')}
              customerEmail={document.customerEmail || document.supplierEmail
                ? String(document.customerEmail || document.supplierEmail)
                : undefined}
              items={type === 'challan' ? undefined : (document.items as LineItem[] | undefined)}
              challanItems={type === 'challan' ? (document.items as ChallanItem[] | undefined) : undefined}
              totalAmount={document.totalAmount}
              totalQuantity={document.totalQuantity}
              orderNo={document.orderNo}
              status={document.status}
              notes={document.notes}
              tax={document.tax}
              totalPaid={document.totalPaid}
              payments={document.payments}
              amountInWords={document.amountInWords}
              signatureReceived={document.signatureReceived}
              signaturePrepared={document.signaturePrepared}
              signatureAuthorize={document.signatureAuthorize}
              supplierName={document.supplierName}
              supplierAddress={document.supplierAddress}
            />
          </div>
        </>
      )}

      <div className="text-center px-4 py-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} S. M. Trade International. All rights reserved.
      </div>
    </div>
  );
}
