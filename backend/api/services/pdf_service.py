import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

def setup_fonts():
    """Register fonts that support Cyrillic characters"""
    try:
        pdfmetrics.registerFont(TTFont('DejaVuSans', 'DejaVuSans.ttf'))
        pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', 'DejaVuSans-Bold.ttf'))
        return 'DejaVuSans', 'DejaVuSans-Bold'
    except Exception:
        # Fallback to standard fonts if custom ones aren't available
        return 'Helvetica', 'Helvetica-Bold'

def generate_contract_pdf(contract):
    buffer = io.BytesIO()
    font_normal, font_bold = setup_fonts()
    
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    elements = []
    styles = getSampleStyleSheet()
    
    title_style = styles["Heading1"]
    title_style.fontName = font_bold
    title_style.alignment = 1 
    
    subtitle_style = styles["Heading2"]
    subtitle_style.fontName = font_bold
    
    normal_style = styles["Normal"]
    normal_style.fontName = font_normal
    
    elements.append(Paragraph(f"Contract #{contract.id}", title_style))
    elements.append(Spacer(1, 0.25*inch))
    elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y')}", normal_style))
    elements.append(Spacer(1, 0.25*inch))
    
    # Customer Info
    elements.append(Paragraph("Customer Information", subtitle_style))
    customer_data = [
        ["Name:", f"{contract.customer.user.first_name} {contract.customer.user.last_name}"],
        ["Email:", contract.customer.user.email],
        ["Phone:", contract.customer.phone_number],
    ]
    customer_table = Table(customer_data, colWidths=[1.5*inch, 4*inch])
    customer_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
        ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
        ("FONT", (0, 0), (-1, -1), font_normal),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(customer_table)
    elements.append(Spacer(1, 0.25*inch))
    
    # Contract Details
    elements.append(Paragraph("Contract Details", subtitle_style))
    contract_data = [
        ["Service:", contract.service.name],
        ["Tariff:", contract.tariff.name if contract.tariff else "N/A"],
        ["Start Date:", contract.start_date.strftime("%B %d, %Y")],
        ["Status:", "Active" if contract.is_active else "Inactive"],
    ]
    contract_table = Table(contract_data, colWidths=[1.5*inch, 4*inch])
    contract_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
        ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
        ("FONT", (0, 0), (-1, -1), font_normal),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(contract_table)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_invoice_pdf(invoice):
    buffer = io.BytesIO()
    font_normal, font_bold = setup_fonts()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    title_style = styles["Heading1"]
    title_style.fontName = font_bold
    title_style.alignment = 1
    
    elements.append(Paragraph(f"Invoice #{invoice.id}", title_style))
    elements.append(Spacer(1, 0.25*inch))
    
    data = [
        ["Customer:", f"{invoice.contract.customer.user.first_name} {invoice.contract.customer.user.last_name}"],
        ["Amount:", f"${invoice.amount}"],
        ["Due Date:", invoice.due_date.strftime("%B %d, %Y")],
        ["Status:", invoice.status.capitalize()],
    ]
    t = Table(data, colWidths=[1.5*inch, 3*inch])
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONT", (0, 0), (-1, -1), font_normal),
        ("PADDING", (0, 0), (-1, -1), 10),
    ]))
    elements.append(t)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_receipt_pdf(payment):
    buffer = io.BytesIO()
    # ...
    buffer.seek(0)
    return buffer
