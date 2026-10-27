import { AppSettings, Customer, Equipment, Quote, ServiceOrder } from '../types';

export class EmailService {
  /**
   * Generates formatted subject line for quote notification
   */
  static buildQuoteEmailSubject(
    order: ServiceOrder,
    quote: Quote,
    settings: AppSettings
  ): string {
    const commercial = settings.commercialName || 'FSYS360 Service';
    return `[${commercial}] Proposta de Orçamento ${quote.visibleNumber} - Assistência ${order.visibleNumber}`;
  }

  /**
   * Generates formatted plain-text body with complete breakdown
   */
  static buildQuoteEmailBody(
    order: ServiceOrder,
    quote: Quote,
    customer: Customer,
    equipment?: Equipment,
    settings?: AppSettings
  ): string {
    const brandName = settings?.commercialName || 'FSYS360 Service';
    const company = settings?.companyName || 'FozSistemas';
    const phone = settings?.phone || '233 400 000';
    const email = settings?.email || 'geral@fozsistemas.com';

    const equipDesc = equipment
      ? `${(equipment.category || 'equipamento').toUpperCase()}: ${equipment.brand} ${equipment.model}${
          equipment.serialNumber ? ` (Nº Série: ${equipment.serialNumber})` : ''
        }`
      : 'Equipamento em oficina';

    const linesFormatted = quote.lines
      .map(
        (l, i) =>
          `  ${i + 1}. ${l.description}\n     Qtd: ${l.quantity} | Preço Unit: ${l.unitPrice.toFixed(
            2
          )} € | IVA: ${l.taxRate}% | Subtotal: ${(l.quantity * l.unitPrice).toFixed(2)} €`
      )
      .join('\n\n');

    const formattedValidDate = quote.validUntil
      ? new Date(quote.validUntil).toLocaleDateString('pt-PT')
      : '15 dias após emissão';

    return `Exmo(a). Sr(a). ${customer.name},

Apresentamos a proposta de orçamento referente à reparação do seu equipamento, ao abrigo do processo de assistência técnica ${order.visibleNumber}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DETALHES DA ASSISTÊNCIA TÉCNICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Orçamento Nº: ${quote.visibleNumber} (Versão ${quote.version})
• Assistência Nº: ${order.visibleNumber}
• Equipamento: ${equipDesc}
• Avaria / Sintoma Reportado: ${order.reportedFault || 'Conforme receção'}
• Proposta Válida até: ${formattedValidDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISCRIMINAÇÃO DOS SERVIÇOS E PEÇAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${linesFormatted}

───────────────────────────────────────────────────
• Subtotal Ilíquido: ${quote.subtotal.toFixed(2)} €
• Total de IVA (${settings?.defaultVatRate || 23}%): ${quote.taxTotal.toFixed(2)} €
• VALOR TOTAL DA PROPOSTA: ${quote.total.toFixed(2)} € (IVA incluído)
───────────────────────────────────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMO CONFIRMAR / APROVAR ESTE ORÇAMENTO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Para dar início imediato à reparação com as peças e intervenção descritas, pode responder diretamente a este email com a indicação de "Aprovado", ou contactar o nosso suporte:

• Telefone / Linha de Apoio: ${phone}
• Email de Resposta: ${email}
• Presencialmente nas nossas instalações: ${settings?.address || 'Rua Manuel Fernandes Tomaz 32, Figueira da Foz'}

Ficamos a aguardar as suas instruções.

Com os melhores cumprimentos,
Departamento Técnico
${brandName} • ${company}
Web: ${settings?.website || 'www.fozsistemas.com'}
`;
  }

  /**
   * Generates a mailto: URI pre-populated with customer email, subject and body
   */
  static createQuoteMailtoUrl(
    order: ServiceOrder,
    quote: Quote,
    customer: Customer,
    equipment?: Equipment,
    settings?: AppSettings
  ): string {
    const to = customer.email ? customer.email.trim() : '';
    const subject = encodeURIComponent(
      this.buildQuoteEmailSubject(order, quote, settings || ({} as any))
    );
    const body = encodeURIComponent(
      this.buildQuoteEmailBody(order, quote, customer, equipment, settings)
    );
    return `mailto:${to}?subject=${subject}&body=${body}`;
  }

  /**
   * Opens the default email client (Outlook, Gmail, Apple Mail, etc.)
   */
  static openQuoteEmailClient(
    order: ServiceOrder,
    quote: Quote,
    customer: Customer,
    equipment?: Equipment,
    settings?: AppSettings
  ): boolean {
    if (!customer.email || !customer.email.trim()) {
      return false;
    }
    const mailto = this.createQuoteMailtoUrl(order, quote, customer, equipment, settings);
    window.location.href = mailto;
    return true;
  }
}
