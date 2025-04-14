from apscheduler.schedulers.background import BackgroundScheduler
from flask import current_app
import datetime
from models import db, User
from routes.email_reminders import send_email, generate_weekly_report
def fetch_exchange_rates_job():
    with current_app.app_context():
        from routes.currency_converter import get_exchange_rate
        rate = get_exchange_rate("USD", "EUR")
        current_app.logger.info(f"Fetched exchange rates: USD to EUR rate is {rate}")
def send_weekly_reports_job():
    with current_app.app_context():
        now = datetime.datetime.utcnow()
        current_day = now.strftime("%a").lower()
        current_hour = now.hour
        users = User.query.all()
        for user in users:
            if (user.reminder_day and user.reminder_day.lower() == current_day and 
                user.reminder_hour == current_hour):
                subject = "Your Weekly Spending Report"
                html_content, pdf_bytes = generate_weekly_report(user.id)
                if send_email(user.email, subject, html_content, pdf_bytes):
                    current_app.logger.info(f"Weekly report sent to {user.email}")
                else:
                    current_app.logger.error(f"Failed to send weekly report to {user.email}")
def start_scheduler(app):
    scheduler = BackgroundScheduler()
    scheduler.add_job(fetch_exchange_rates_job, trigger="interval", hours=6)
    scheduler.add_job(send_weekly_reports_job, trigger="interval", hours=1)
    scheduler.start()
    app.logger.info("Scheduler started")
    return scheduler