import { jsPDF } from 'jspdf';
import { AppSettings, Customer, Equipment, Quote, ServiceOrder, ServicePart } from '../types';
import { FOZ_SISTEMAS_LOGO_PNG } from '../assets/logoBase64';

export interface GenerateA5Options {
  order: ServiceOrder;
  customer: Customer;
  equipment: Equipment;
  settings: AppSettings;
  versionNumber?: number;
}

export class PdfService {
  /**
   * Generates a 148 x 210 mm exact A5 physical PDF for Service Order sheet
   */
  static generateA5ServiceSheet({
    order,
    customer,
    equipment,
    settings,
    versionNumber = 1,
  }: GenerateA5Options): jsPDF {
    // Physical A5 portrait dimensions in millimeters
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [148, 210],
      compress: true,
    });

    const margin = settings.a5MarginsMm || 8;
    const pageWidth = 148;
    const pageHeight = 210;
    const contentWidth = pageWidth - margin * 2; // 132mm with 8mm margin
    let y = margin;

    // Monochrome high-contrast palette
    const black = '#000000';
    const darkGray = '#333333';
    const lightGray = '#f3f4f6';
    const borderGray = '#9ca3af';

    // 1. HEADER: Foz Sistemas Vector Logo & Company Info (Left) + Ticket Box (Right)
    doc.setDrawColor(borderGray);
    doc.setFillColor(lightGray);

    // Draw FozSistemas official logo image
    const logoX = margin;
    const logoY = y;
    const logoWidth = 24;
    const logoHeight = 11.7;
    try {
      doc.addImage(FOZ_SISTEMAS_LOGO_PNG, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch {
      drawFozLogo(doc, logoX, logoY, 14);
    }

    // Company block next to logo
    const compTextX = logoX + logoWidth + 2.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(220, 38, 38); // Brand Red
    doc.text('FSYS360 SERVICE', compTextX, y + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text('GESTÃO DE ASSISTÊNCIAS TÉCNICAS • FOZSISTEMAS', compTextX, y + 7.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(darkGray);
    doc.text(`NIF: ${settings.taxNumber} | Tel: ${settings.phone}`, compTextX, y + 10.5);
    doc.text(`${settings.address}, ${settings.postalCode} ${settings.city}`, compTextX, y + 13.5);
    doc.text(`Email: ${settings.email} | Web: ${settings.website}`, compTextX, y + 16.5);

    // Ticket Number Callout Box (Right)
    const ticketBoxWidth = 52;
    const ticketBoxHeight = 17;
    const ticketBoxX = pageWidth - margin - ticketBoxWidth;

    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(ticketBoxX, y, ticketBoxWidth, ticketBoxHeight, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(black);
    doc.text('FOLHA DE ASSISTÊNCIA TÉCNICA', ticketBoxX + ticketBoxWidth / 2, y + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(order.visibleNumber, ticketBoxX + ticketBoxWidth / 2, y + 10.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const dateFormatted = new Date(order.createdAt).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(`Entrada: ${dateFormatted} | v${versionNumber}`, ticketBoxX + ticketBoxWidth / 2, y + 14.5, { align: 'center' });

    y += 19;

    // 2. CLIENT & EQUIPMENT DUAL BOX (Side by Side)
    const colWidth = (contentWidth - 3) / 2;
    const clientBoxX = margin;
    const equipBoxX = margin + colWidth + 3;
    const clientEquipHeight = 29;

    // Client Box
    doc.setDrawColor(borderGray);
    doc.setLineWidth(0.2);
    doc.rect(clientBoxX, y, colWidth, clientEquipHeight);

    // Section title bar
    doc.setFillColor(235, 238, 242);
    doc.rect(clientBoxX, y, colWidth, 5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(black);
    doc.text('1. DADOS DO CLIENTE', clientBoxX + 2, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(darkGray);
    doc.text(`Nome: ${truncateText(customer.name, 28)}`, clientBoxX + 2, y + 9);
    doc.text(`Telefone: ${customer.phone}${customer.altPhone ? ` / ${customer.altPhone}` : ''}`, clientBoxX + 2, y + 13.5);
    doc.text(`Email: ${truncateText(customer.email, 30)}`, clientBoxX + 2, y + 18);
    doc.text(`NIF: ${customer.taxNumber || 'Consumidor Final'}`, clientBoxX + 2, y + 22.5);
    doc.text(`Localidade: ${customer.city}`, clientBoxX + 2, y + 27);

    // Equipment Box
    doc.rect(equipBoxX, y, colWidth, clientEquipHeight);
    doc.setFillColor(235, 238, 242);
    doc.rect(equipBoxX, y, colWidth, 5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(black);
    doc.text('2. EQUIPAMENTO IDENTIFICADO', equipBoxX + 2, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(darkGray);
    doc.text(`Tipo / Marca: ${equipment.category.toUpperCase()} | ${equipment.brand}`, equipBoxX + 2, y + 9);
    doc.text(`Modelo: ${truncateText(equipment.model, 26)}`, equipBoxX + 2, y + 13.5);
    doc.text(`Nº Série: ${equipment.serialNumber || 'N/A'}`, equipBoxX + 2, y + 18);
    doc.text(`Etiqueta SAT: ${equipment.internalTag}`, equipBoxX + 2, y + 22.5);
    doc.text(`Garantia: ${order.isWarranty ? 'SIM (Em Garantia)' : 'NÃO (Fora de Garantia)'}`, equipBoxX + 2, y + 27);

    y += clientEquipHeight + 3;

    // 3. CONDITIONS OF ENTRY (Reported Fault, Damages, Accessories)
    const conditionsHeight = 35;
    doc.rect(margin, y, contentWidth, conditionsHeight);
    doc.setFillColor(235, 238, 242);
    doc.rect(margin, y, contentWidth, 5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(black);
    doc.text('3. CONDIÇÕES DE ENTRADA & REGISTO DE RECEÇÃO', margin + 2, y + 3.5);

    // Right badge for Priority
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(`PRIORIDADE: ${order.priority.toUpperCase()}`, pageWidth - margin - 2, y + 3.5, { align: 'right' });

    let condY = y + 9;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text('Avaria reportada pelo cliente:', margin + 2, condY);
    doc.setFont('helvetica', 'normal');
    const faultLines = doc.splitTextToSize(order.reportedFault, contentWidth - 4);
    doc.text(faultLines.slice(0, 2), margin + 2, condY + 4);

    condY += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('Estado exterior e danos prévios:', margin + 2, condY);
    doc.setFont('helvetica', 'normal');
    const damageLines = doc.splitTextToSize(order.externalDamageState || 'Sem danos cosméticos visíveis.', contentWidth - 4);
    doc.text(damageLines.slice(0, 1), margin + 2, condY + 3.8);

    condY += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Acessórios entregues:', margin + 2, condY);
    doc.setFont('helvetica', 'normal');
    doc.text(truncateText(order.accessoriesReceived || 'Apenas equipamento sem acessórios adicionais.', 65), margin + 34, condY);

    y += conditionsHeight + 3;

    // 4. WORKSHOP NOTES / DIAGNOSIS AREA (Physical Ruled / Box area for Technician)
    const labHeight = 44;
    doc.rect(margin, y, contentWidth, labHeight);
    doc.setFillColor(235, 238, 242);
    doc.rect(margin, y, contentWidth, 5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(black);
    doc.text('4. DIAGNÓSTICO TÉCNICO & REGISTO DE BANCADA', margin + 2, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(`Técnico Alocado: ${order.assignedTechnicianId ? 'Rui Duarte' : 'Por atribuir'} | Estado Atual: ${formatOrderStatus(order.status)}`, pageWidth - margin - 2, y + 3.5, { align: 'right' });

    let labY = y + 8.5;
    if (order.diagnosis) {
      doc.setFont('helvetica', 'bold');
      doc.text('Diagnóstico registado no sistema:', margin + 2, labY);
      doc.setFont('helvetica', 'normal');
      const diagLines = doc.splitTextToSize(order.diagnosis, contentWidth - 4);
      doc.text(diagLines.slice(0, 2), margin + 2, labY + 3.8);
      labY += 12;
    }

    // Ruled lines for physical pen annotations during bench work
    doc.setDrawColor(215, 220, 228);
    doc.setLineDashPattern([1, 1], 0);
    const startRuledY = labY;
    for (let lineY = startRuledY; lineY <= y + labHeight - 4; lineY += 5) {
      doc.line(margin + 2, lineY, margin + contentWidth - 2, lineY);
    }
    doc.setLineDashPattern([], 0); // reset to solid
    doc.setDrawColor(borderGray);

    y += labHeight + 3;

    // 5. QR CODE & OPAC TRACKING LINK + TERMS & CONDITIONS
    const termsHeight = 32;
    const qrBoxWidth = 24;
    const termsWidth = contentWidth - qrBoxWidth - 3;

    // QR & Barcode Placeholder box (Opaque URL only: no PII)
    doc.rect(margin, y, qrBoxWidth, termsHeight);
    drawSimulatedQRCode(doc, margin + 2, y + 2, qrBoxWidth - 4, order.visibleNumber);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(black);
    doc.text(order.visibleNumber, margin + qrBoxWidth / 2, y + termsHeight - 2, { align: 'center' });

    // Terms of Service Summary
    doc.rect(margin + qrBoxWidth + 3, y, termsWidth, termsHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('TERMOS DE SERVIÇO & CONDIÇÕES:', margin + qrBoxWidth + 5, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(darkGray);
    const termsArray = [
      '1. Diagnóstico comunicado no prazo de 48h úteis. O cliente autoriza testes de bancada.',
      '2. Equipamentos não reclamados após 90 dias da notificação de conclusão incorrem em taxa de parqueamento.',
      '3. A reparação goza de 90 dias de garantia sobre componentes substituídos e mão de obra descrita.',
      '4. O cliente confirma que efetuou salvaguarda (backup) de todos os dados pessoais e profissionais.',
    ];
    let termY = y + 7.5;
    termsArray.forEach(t => {
      doc.text(t, margin + qrBoxWidth + 5, termY);
      termY += 4.5;
    });

    y += termsHeight + 3;

    // 6. SIGNATURE BOXES (Reception & Customer)
    const sigHeight = 22;
    const sigColWidth = (contentWidth - 3) / 2;

    // Reception Signature
    doc.rect(margin, y, sigColWidth, sigHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(black);
    doc.text('Pela Receção / SAT:', margin + 2, y + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('Assinatura e carimbo:', margin + 2, y + 7);
    doc.line(margin + 5, y + 17, margin + sigColWidth - 5, y + 17);

    // Customer Signature
    doc.rect(margin + sigColWidth + 3, y, sigColWidth, sigHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('Concordância do Cliente:', margin + sigColWidth + 5, y + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.text('Tomei conhecimento e aceito as condições e avarias registadas:', margin + sigColWidth + 5, y + 7);
    doc.line(margin + sigColWidth + 8, y + 17, margin + contentWidth - 5, y + 17);

    // 7. FOOTER BAR
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(120, 120, 120);
    const printTimestamp = new Date().toLocaleString('pt-PT');
    doc.text(
      `Folha de Assistência Técnica A5 (148x210mm) | Emitido em: ${printTimestamp} | ID: ${order.id} | FSYS360 Service • FozSistemas (fozsistemas.com)`,
      pageWidth / 2,
      pageHeight - 2.5,
      { align: 'center' }
    );

    return doc;
  }

  /**
   * Generates a formal Quote / Proposal Document in A5 format
   */
  static generateQuoteProposal({
    order,
    customer,
    equipment,
    quote,
    settings,
  }: {
    order: ServiceOrder;
    customer: Customer;
    equipment: Equipment;
    quote: Quote;
    settings: AppSettings;
  }): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [148, 210],
      compress: true,
    });

    const margin = settings.a5MarginsMm || 8;
    const pageWidth = 148;
    const pageHeight = 210;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // 1. Header with FozSistemas Logo
    const logoW = 24;
    const logoH = 11.7;
    try {
      doc.addImage(FOZ_SISTEMAS_LOGO_PNG, 'PNG', margin, y, logoW, logoH);
    } catch {
      drawFozLogo(doc, margin, y, 13);
    }

    const compTextX = margin + logoW + 2.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(220, 38, 38);
    doc.text('FSYS360 SERVICE', compTextX, y + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text('GESTÃO DE ASSISTÊNCIAS TÉCNICAS • FOZSISTEMAS', compTextX, y + 7.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(51, 51, 51);
    doc.text(`NIF: ${settings.taxNumber} | Tel: ${settings.phone}`, compTextX, y + 10.5);
    doc.text(`Email: ${settings.email} | Web: ${settings.website}`, compTextX, y + 13.5);

    // Right Header Box (Quote Number & Version)
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(pageWidth - margin - 56, y, 56, 15, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text('PROPOSTA DE ORÇAMENTO', pageWidth - margin - 28, y + 4.5, { align: 'center' });
    doc.setFontSize(9.5);
    doc.setTextColor(220, 38, 38);
    doc.text(quote.visibleNumber, pageWidth - margin - 28, y + 9.5, { align: 'center' });
    doc.setFontSize(6);
    doc.setTextColor(70, 70, 70);
    doc.text(`AT: ${order.visibleNumber} • v${quote.version}`, pageWidth - margin - 28, y + 13.5, { align: 'center' });

    y += 18;

    // 2. Client & Equipment Summary Box
    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, 23);
    doc.setFillColor(235, 238, 242);
    doc.rect(margin, y, contentWidth, 5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text('DADOS DO CLIENTE & EQUIPAMENTO EM OFICINA', margin + 2, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Cliente: ${customer.name} (NIF: ${customer.taxNumber || 'Consumidor Final'})`, margin + 2, y + 9);
    doc.text(`Email: ${customer.email || 'Não indicado'} | Tel: ${customer.phone || 'N/A'}`, margin + 2, y + 13.5);
    doc.text(`Equipamento: ${equipment.brand} ${equipment.model} (S/N: ${equipment.serialNumber || 'N/A'})`, margin + 2, y + 18);
    doc.text(`Avaria Reportada: ${truncateText(order.reportedFault || 'N/A', 60)}`, margin + 2, y + 21.5);

    y += 26;

    // 3. Quoted Lines Table
    doc.rect(margin, y, contentWidth, 75);
    doc.setFillColor(235, 238, 242);
    doc.rect(margin, y, contentWidth, 5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text('DISCRIMINAÇÃO DE SERVIÇOS, MÃO DE OBRA E PEÇAS', margin + 2, y + 3.5);

    // Table Header
    let lineY = y + 6;
    doc.setFillColor(245, 247, 250);
    doc.rect(margin + 1, lineY, contentWidth - 2, 4.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(51, 65, 85);
    doc.text('Artigo / Descrição', margin + 3, lineY + 3);
    doc.text('Qtd', margin + 74, lineY + 3);
    doc.text('Preço Unit.', margin + 86, lineY + 3);
    doc.text('IVA', margin + 106, lineY + 3);
    doc.text('Total c/ IVA', margin + contentWidth - 3, lineY + 3, { align: 'right' });

    lineY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(30, 41, 59);

    quote.lines.forEach((l, idx) => {
      const lineSubtotal = l.quantity * l.unitPrice;
      const lineTotWithVat = lineSubtotal * (1 + l.taxRate / 100);
      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin + 1, lineY - 0.5, contentWidth - 2, 4.5, 'F');
      }
      doc.text(truncateText(l.description, 45), margin + 3, lineY + 2.8);
      doc.text(String(l.quantity), margin + 75, lineY + 2.8);
      doc.text(`${l.unitPrice.toFixed(2)}€`, margin + 87, lineY + 2.8);
      doc.text(`${l.taxRate}%`, margin + 107, lineY + 2.8);
      doc.text(`${lineTotWithVat.toFixed(2)}€`, margin + contentWidth - 3, lineY + 2.8, { align: 'right' });
      lineY += 4.5;
    });

    // Subtotals & Total box at bottom of table
    const totY = y + 58;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin + 60, totY, margin + contentWidth - 2, totY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Subtotal Ilíquido:', margin + 70, totY + 4);
    doc.text(`${quote.subtotal.toFixed(2)} €`, margin + contentWidth - 3, totY + 4, { align: 'right' });

    doc.text(`Total IVA (${settings.defaultVatRate || 23}%):`, margin + 70, totY + 8);
    doc.text(`${quote.taxTotal.toFixed(2)} €`, margin + contentWidth - 3, totY + 8, { align: 'right' });

    doc.setFillColor(239, 246, 255);
    doc.rect(margin + 60, totY + 9.5, contentWidth - 62, 6, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(220, 38, 38);
    doc.text('TOTAL DA PROPOSTA:', margin + 63, totY + 14);
    doc.text(`${quote.total.toFixed(2)} €`, margin + contentWidth - 3, totY + 14, { align: 'right' });

    y += 79;

    // 4. Validity & Client Approval Section
    doc.rect(margin, y, contentWidth, 31);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text('VALIDADE & DECISÃO DO CLIENTE', margin + 2, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);
    doc.text(`• Proposta emitida a: ${new Date(quote.createdAt).toLocaleDateString('pt-PT')} | Válida até: ${quote.validUntil || '15 dias'}`, margin + 2, y + 8.5);
    doc.text('• Pode aprovar respondendo ao email de notificação, por telefone ou presencialmente.', margin + 2, y + 12);
    doc.text('• As peças orçadas ficam reservadas durante o período de validade da proposta.', margin + 2, y + 15.5);

    doc.setDrawColor(150, 150, 150);
    doc.line(margin + 10, y + 24, margin + 60, y + 24);
    doc.setFontSize(5.5);
    doc.text('Assinatura do Técnico SAT', margin + 18, y + 28);

    doc.line(margin + contentWidth - 60, y + 24, margin + contentWidth - 10, y + 24);
    doc.text('Decisão / Assinatura do Cliente', margin + contentWidth - 55, y + 28);

    // 5. Footer Bar
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Proposta de Orçamento (${quote.visibleNumber}) | FSYS360 Service • FozSistemas (fozsistemas.com) | Email: ${settings.email}`,
      pageWidth / 2,
      pageHeight - 2.5,
      { align: 'center' }
    );

    return doc;
  }

  /**
   * Generates a Delivery Document (Folha / Comprovativo de Entrega com Garantia)
   */
  static generateDeliveryNote({
    order,
    customer,
    equipment,
    settings,
    parts,
  }: {
    order: ServiceOrder;
    customer: Customer;
    equipment: Equipment;
    settings: AppSettings;
    parts: ServicePart[];
  }): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [148, 210],
      compress: true,
    });

    const margin = settings.a5MarginsMm || 8;
    const pageWidth = 148;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Header with FozSistemas Logo
    const logoW = 24;
    const logoH = 11.7;
    try {
      doc.addImage(FOZ_SISTEMAS_LOGO_PNG, 'PNG', margin, y, logoW, logoH);
    } catch {
      drawFozLogo(doc, margin, y, 13);
    }

    const compTextX = margin + logoW + 2.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(220, 38, 38);
    doc.text('FSYS360 SERVICE', compTextX, y + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text('GESTÃO DE ASSISTÊNCIAS TÉCNICAS • FOZSISTEMAS', compTextX, y + 7.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(51, 51, 51);
    doc.text(`NIF: ${settings.taxNumber} | Tel: ${settings.phone}`, compTextX, y + 10.5);
    doc.text(`${settings.address}, ${settings.postalCode} ${settings.city}`, compTextX, y + 13.5);

    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(pageWidth - margin - 55, y, 55, 15, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('COMPROVATIVO DE ENTREGA', pageWidth - margin - 27.5, y + 5.5, { align: 'center' });
    doc.setFontSize(10);
    doc.text(order.visibleNumber, pageWidth - margin - 27.5, y + 11.5, { align: 'center' });

    y += 18;

    // Summary box
    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, 22);
    doc.setFillColor(235, 238, 242);
    doc.rect(margin, y, contentWidth, 5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('DADOS DA ENTREGA & EQUIPAMENTO', margin + 2, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Cliente: ${customer.name} (NIF: ${customer.taxNumber || 'N/A'})`, margin + 2, y + 9);
    doc.text(`Equipamento: ${equipment.brand} ${equipment.model} (S/N: ${equipment.serialNumber})`, margin + 2, y + 13.5);
    doc.text(`Data de Entrega: ${new Date().toLocaleString('pt-PT')} | Recebido por: ${order.deliveredToName || customer.name}`, margin + 2, y + 18);

    y += 26;

    // Work Done & Parts Table
    doc.rect(margin, y, contentWidth, 68);
    doc.setFillColor(235, 238, 242);
    doc.rect(margin, y, contentWidth, 5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('TRABALHOS EFETUADOS & PEÇAS APLICADAS', margin + 2, y + 3.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('Trabalho realizado:', margin + 2, y + 9);
    doc.setFont('helvetica', 'normal');
    const workLines = doc.splitTextToSize(order.completedWork || 'Limpeza interna, diagnóstico e substituição de componentes danificados.', contentWidth - 4);
    doc.text(workLines.slice(0, 3), margin + 2, y + 13);

    let partsY = y + 26;
    doc.setFont('helvetica', 'bold');
    doc.text('Discriminação de Peças e Mão de Obra:', margin + 2, partsY);

    // Table header
    partsY += 4;
    doc.setFillColor(245, 247, 250);
    doc.rect(margin + 2, partsY, contentWidth - 4, 4.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('Ref / Descrição', margin + 4, partsY + 3);
    doc.text('Qtd', margin + 78, partsY + 3);
    doc.text('Preço Unit.', margin + 92, partsY + 3);
    doc.text('Total', margin + contentWidth - 6, partsY + 3, { align: 'right' });

    partsY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    let totalAmt = 0;
    parts.forEach(p => {
      const lineTot = p.quantity * p.unitPrice * (1 + p.taxRate / 100);
      totalAmt += lineTot;
      doc.text(truncateText(p.description, 40), margin + 4, partsY + 3);
      doc.text(p.quantity.toString(), margin + 79, partsY + 3);
      doc.text(`${p.unitPrice.toFixed(2)}€`, margin + 93, partsY + 3);
      doc.text(`${lineTot.toFixed(2)}€`, margin + contentWidth - 6, partsY + 3, { align: 'right' });
      partsY += 4.5;
    });

    // Total box
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL C/ IVA: ${totalAmt.toFixed(2)} €`, margin + contentWidth - 6, y + 64, { align: 'right' });

    y += 72;

    // Warranty & Acceptance
    doc.rect(margin, y, contentWidth, 32);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`GARANTIA DE REPARAÇÃO: ${settings.defaultWarrantyDays} DIAS`, margin + 2, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('O equipamento foi testado na presença do cliente e entregue em perfeitas condições de funcionamento.', margin + 2, y + 9);

    doc.line(margin + 10, y + 25, margin + 60, y + 25);
    doc.text('Assinatura do Técnico SAT', margin + 18, y + 29);

    doc.line(margin + contentWidth - 60, y + 25, margin + contentWidth - 10, y + 25);
    doc.text('Assinatura do Cliente / Recetor', margin + contentWidth - 56, y + 29);

    return doc;
  }

  /**
   * Generates a thermal/sticker label for tagging physical equipment (e.g., 60x40mm ratio)
   */
  static generateEquipmentTag({
    order,
    customer,
    equipment,
  }: {
    order: ServiceOrder;
    customer: Customer;
    equipment: Equipment;
  }): jsPDF {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [60, 40],
    });

    doc.rect(2, 2, 56, 36);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(order.visibleNumber, 30, 7, { align: 'center' });

    drawSimulatedQRCode(doc, 5, 10, 16, order.visibleNumber);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(`Cliente: ${truncateText(customer.name, 20)}`, 24, 13);
    doc.text(`Tel: ${customer.phone}`, 24, 17);
    doc.text(`Equip: ${equipment.brand} ${equipment.model}`, 24, 21);
    doc.text(`S/N: ${equipment.serialNumber || 'N/A'}`, 24, 25);
    doc.text(`Entrada: ${new Date(order.createdAt).toLocaleDateString('pt-PT')}`, 24, 29);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(`TAG: ${equipment.internalTag} | ${order.priority.toUpperCase()}`, 30, 35, { align: 'center' });

    return doc;
  }
}

// Utility: Draw simulated high-contrast 2D matrix (QR Code representation)
function drawSimulatedQRCode(doc: jsPDF, x: number, y: number, size: number, text: string): void {
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, size, size, 'F');
  doc.setFillColor(0, 0, 0);

  // Position detection patterns (corners)
  const pSize = size * 0.28;
  // Top-left
  doc.rect(x, y, pSize, pSize, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(x + pSize * 0.2, y + pSize * 0.2, pSize * 0.6, pSize * 0.6, 'F');
  doc.setFillColor(0, 0, 0);
  doc.rect(x + pSize * 0.35, y + pSize * 0.35, pSize * 0.3, pSize * 0.3, 'F');

  // Top-right
  doc.rect(x + size - pSize, y, pSize, pSize, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(x + size - pSize + pSize * 0.2, y + pSize * 0.2, pSize * 0.6, pSize * 0.6, 'F');
  doc.setFillColor(0, 0, 0);
  doc.rect(x + size - pSize + pSize * 0.35, y + pSize * 0.35, pSize * 0.3, pSize * 0.3, 'F');

  // Bottom-left
  doc.rect(x, y + size - pSize, pSize, pSize, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(x + pSize * 0.2, y + size - pSize + pSize * 0.2, pSize * 0.6, pSize * 0.6, 'F');
  doc.setFillColor(0, 0, 0);
  doc.rect(x + pSize * 0.35, y + size - pSize + pSize * 0.35, pSize * 0.3, pSize * 0.3, 'F');

  // Matrix pattern dots derived deterministically from text
  const step = size / 10;
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if ((i < 3 && j < 3) || (i > 6 && j < 3) || (i < 3 && j > 6)) continue;
      const charCode = text.charCodeAt((i * 10 + j) % text.length);
      if ((charCode + i * 3 + j * 7) % 2 === 0) {
        doc.rect(x + i * step, y + j * step, step * 0.85, step * 0.85, 'F');
      }
    }
  }
}

function truncateText(str: string, maxLength: number): string {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength - 1) + '…' : str;
}

function formatOrderStatus(status: string): string {
  const map: Record<string, string> = {
    recebido: 'Recebido',
    em_diagnostico: 'Em Diagnóstico',
    aguarda_aprovacao: 'Aguarda Aprovação',
    aprovado_em_reparacao: 'Aprovado / Em Reparação',
    aguarda_pecas: 'Aguarda Peças',
    aguarda_cliente: 'Aguarda Cliente',
    em_testes: 'Em Testes Finais',
    pronto_levantamento: 'Pronto para Levantamento',
    entregue_fechado: 'Entregue / Fechado',
    sem_reparacao: 'Sem Reparação',
    devolvido_sem_reparar: 'Devolvido sem Reparar',
    em_garantia: 'Em Garantia',
  };
  return map[status] || status;
}

/**
 * Draws the official Foz Sistemas vector brand emblem directly onto the PDF
 */
function drawFozLogo(doc: jsPDF, x: number, y: number, size: number): void {
  // Base emblem box in royal blue
  doc.setFillColor(3, 105, 161); // #0369a1
  doc.setDrawColor(2, 132, 199); // #0284c7
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, size, size, 2, 2, 'FD');

  // Top white horizontal bar (F upper stroke)
  doc.setFillColor(255, 255, 255);
  doc.rect(x + size * 0.22, y + size * 0.22, size * 0.58, size * 0.12, 'F');

  // Middle dynamic accent cyan bar (F/S curve)
  doc.setFillColor(56, 189, 248); // #38bdf8 Cyan
  doc.rect(x + size * 0.22, y + size * 0.44, size * 0.45, size * 0.12, 'F');

  // Vertical spine of F
  doc.setFillColor(255, 255, 255);
  doc.rect(x + size * 0.22, y + size * 0.22, size * 0.12, size * 0.55, 'F');

  // Digital node / circle accent at bottom right
  doc.circle(x + size * 0.72, y + size * 0.72, size * 0.08, 'F');
}
