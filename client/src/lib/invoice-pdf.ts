import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface InvoicePDFData {
  id: string;
  jobId: string;
  amount: string | number;
  currency: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'card';
  description: string;
  notes?: string;
  status: 'draft' | 'sent' | 'approved' | 'declined' | 'paid' | 'cancelled';
  createdAt: string;
  sentAt?: string;
  approvedAt?: string;
  providerName?: string;
  requesterName?: string;
}

/**
 * Generate invoice PDF from HTML element
 */
export async function generateInvoicePDF(
  elementId: string,
  invoiceData: InvoicePDFData
): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Invoice element not found');
    }

    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    // Create PDF
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Save the PDF
    const fileName = `invoice-${invoiceData.id}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Share invoice via email
 */
export function shareViaEmail(
  invoiceData: InvoicePDFData,
  recipientEmail: string,
  recipientName: string
): void {
  const subject = encodeURIComponent(`Invoice #${invoiceData.id}`);
  const body = encodeURIComponent(`
Hi ${recipientName},

Please find the invoice details below:

Amount: BWP ${invoiceData.amount}
Payment Method: ${invoiceData.paymentMethod.replace('_', ' ')}
Description: ${invoiceData.description}
Status: ${invoiceData.status}

Invoice ID: ${invoiceData.id}
Created: ${new Date(invoiceData.createdAt).toLocaleDateString()}

Best regards
  `);

  window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
}

/**
 * Share invoice via WhatsApp
 */
export function shareViaWhatsApp(invoiceData: InvoicePDFData, recipientPhone?: string): void {
  const message = encodeURIComponent(`
📋 Invoice #${invoiceData.id}

💰 Amount: BWP ${invoiceData.amount}
💳 Payment Method: ${invoiceData.paymentMethod.replace('_', ' ')}

📝 Description: ${invoiceData.description}

${invoiceData.notes ? `📌 Notes: ${invoiceData.notes}` : ''}

Status: ${invoiceData.status}
Created: ${new Date(invoiceData.createdAt).toLocaleDateString()}

---
Sent via SASA Job Delivery Platform
  `);

  // If phone number provided, use direct message link
  if (recipientPhone) {
    const phoneNumberFormatted = recipientPhone.replace(/\D/g, '');
    window.open(
      `https://wa.me/${phoneNumberFormatted}?text=${message}`,
      '_blank'
    );
  } else {
    // Otherwise open WhatsApp Web
    window.open(
      `https://web.whatsapp.com/send?text=${message}`,
      '_blank'
    );
  }
}

/**
 * Get payment method display name
 */
export function getPaymentMethodDisplay(method: string): string {
  const methods: Record<string, string> = {
    cash: '💵 Cash (Manual Confirmation)',
    bank_transfer: '🏦 Bank Transfer',
    card: '💳 Card Payment',
  };
  return methods[method] || method;
}
