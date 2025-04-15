from flask import Blueprint, request, jsonify, current_app
from flask_login import current_user, login_required
from datetime import datetime, timedelta
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import base64
from io import BytesIO
import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from models import db, Transaction, Budget, Category, User
email_reminders_bp = Blueprint('email_reminders', __name__)
def generate_chart(report_data):
    categories = list(report_data.keys())
    totals = [report_data[cat] for cat in categories]
    plt.figure(figsize=(6,4))
    plt.bar(categories, totals, color='skyblue')
    plt.xlabel("Category")
    plt.ylabel("Total Spent")
    plt.title("Weekly Spending by Category")
    plt.tight_layout()
    buffer = BytesIO()
    plt.savefig(buffer, format="png")
    buffer.seek(0)
    image_data = buffer.read()
    buffer.close()
    plt.close()
    encoded = base64.b64encode(image_data).decode("utf-8")
    return f"data:image/png;base64,{encoded}"
def generate_report_pdf(report_data):
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setTitle("Weekly Spending Report")
    
    pdf.drawString(50, 750, "Weekly Spending Report")
    pdf.drawString(50, 730, "-----------------------")
    y = 700
    for category, total in report_data.items():
        line = f"{category}: {total:.2f}"
        pdf.drawString(50, y, line)
        y -= 20
    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return buffer.read()
def get_spending_suggestions(period):
    suggestions = []
    budgets = Budget.query.filter_by(month=period).all()
    for budget in budgets:
        category = budget.category
        total_spent = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.category_id == budget.category_id,
            Transaction.type == "Expense",
            Transaction.date.startswith(period)
        ).scalar() or 0
        percent_used = (total_spent / budget.amount) * 100 if budget.amount > 0 else 0
        if total_spent > budget.amount:
            suggestions.append({
                "category": category.name if category else "Uncategorized",
                "suggestion": f"You exceeded your budget for {category.name if category else 'this category'} by {total_spent - budget.amount:.2f}. Consider reviewing expenses."
            })
        elif percent_used >= 80:
            suggestions.append({
                "category": category.name if category else "Uncategorized",
                "suggestion": f"Your spending on {category.name if category else 'this category'} is at {percent_used:.1f}% of the budget. Keep an eye on it."
            })
        elif total_spent < 0.5 * budget.amount:
            suggestions.append({
                "category": category.name if category else "Uncategorized",
                "suggestion": f"Your spending on {category.name if category else 'this category'} is quite low. Consider allocating more to savings or investments."
            })
    return suggestions
def generate_weekly_report(user_id):
    now = datetime.utcnow()
    period = now.strftime("%Y-%m")
    transactions = Transaction.query.filter(
        Transaction.date >= f"{period}-01",
        Transaction.date < f"{period}-32",
        Transaction.type == "Expense"
    ).all()
    report_data = {}
    for txn in transactions:
        category_name = txn.category.name if txn.category else "Uncategorized"
        report_data[category_name] = (report_data.get(category_name) or 0) + txn.amount
    
    chart_data_uri = generate_chart(report_data)
    pdf_bytes = generate_report_pdf(report_data)
    
    suggestions = get_spending_suggestions(period)
    
    suggestions_html = ""
    if suggestions:
        suggestions_html += "<h3>Spending Suggestions:</h3><ul>"
        for suggestion in suggestions:
            suggestions_html += f"<li><strong>{suggestion['category']}:</strong> {suggestion['suggestion']}</li>"
        suggestions_html += "</ul>"
    else:
        suggestions_html = "<p>No suggestions at this time. Keep up the good work!</p>"
    html_content = f"""
    <html>
      <body>
        <h2>Your Weekly Spending Report</h2>
        <p>Below is a summary of your spending for {period}.</p>
        <table border="1" cellpadding="5" cellspacing="0">
          <thead>
            <tr>
              <th>Category</th>
              <th>Total Spent</th>
            </tr>
          </thead>
          <tbody>
    """
    for category, total in report_data.items():
        html_content += f"<tr><td>{category}</td><td>{total:.2f}</td></tr>"
    html_content += f"""
          </tbody>
        </table>
        <p>Chart view:</p>
        <img src="{chart_data_uri}" alt="Spending Chart" style="max-width:600px;"/>
        {suggestions_html}
        <p>Keep up the good work managing your finances!</p>
        <p>Best regards,<br>Personal Finance Manager Team</p>
      </body>
    </html>
    """
    return html_content, pdf_bytes
def send_email(to_address, subject, html_content, pdf_bytes=None):
    try:
        smtp_server = current_app.config.get('EMAIL_HOST')
        smtp_port = current_app.config.get('EMAIL_PORT')
        smtp_user = current_app.config.get('EMAIL_USER')
        smtp_password = current_app.config.get('EMAIL_PASSWORD')
        from_email = smtp_user
        from_name = "Personal Finance Manager"
        msg = MIMEMultipart()
        msg['Subject'] = subject
        msg['From'] = f"{from_name} <{from_email}>"
        msg['To'] = to_address
        html_part = MIMEText(html_content, "html")
        msg.attach(html_part)
        
        if pdf_bytes:
            pdf_part = MIMEApplication(pdf_bytes, _subtype="pdf")
            pdf_part.add_header('Content-Disposition', 'attachment', filename="Weekly_Report.pdf")
            msg.attach(pdf_part)
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        return True
    except Exception as e:
        current_app.logger.error(f"Error sending email: {e}")
        return False
@email_reminders_bp.route('/api/email_reminders/test', methods=['GET'])
@login_required
def send_weekly_report_test():
    try:
        user_email = current_user.email
        subject = "Your Weekly Spending Report & Suggestions"
        html_content, pdf_bytes = generate_weekly_report(current_user.id)
        if send_email(user_email, subject, html_content, pdf_bytes):
            return jsonify({'message': 'Weekly report email sent successfully'}), 200
        else:
            return jsonify({'message': 'Failed to send weekly report email'}), 500
    except Exception as e:
        return jsonify({'message': f'Error sending weekly report email: {str(e)}'}), 500