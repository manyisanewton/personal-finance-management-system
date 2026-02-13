import calendar
import datetime
from datetime import timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from flask import current_app
from models import db, User, RecurringTransaction, Transaction, RecurringPostEvent
from routes.email_reminders import send_email, generate_weekly_report


def fetch_exchange_rates_job():
    with current_app.app_context():
        from routes.currency_converter import get_exchange_rate
        rate = get_exchange_rate("USD", "EUR")
        current_app.logger.info(f"Fetched exchange rates: USD to EUR rate is {rate}")


def _add_months(date_obj, months):
    month_index = date_obj.month - 1 + months
    year = date_obj.year + month_index // 12
    month = month_index % 12 + 1
    day = min(date_obj.day, calendar.monthrange(year, month)[1])
    return date_obj.replace(year=year, month=month, day=day)


def _next_occurrence_date(current_date, frequency):
    if frequency == "daily":
        return current_date + timedelta(days=1)
    if frequency == "weekly":
        return current_date + timedelta(days=7)
    if frequency == "biweekly":
        return current_date + timedelta(days=14)
    if frequency == "monthly":
        return _add_months(current_date, 1)
    if frequency == "quarterly":
        return _add_months(current_date, 3)
    if frequency == "annually":
        return _add_months(current_date, 12)
    return current_date


def process_recurring_transactions_job():
    with current_app.app_context():
        today = datetime.datetime.utcnow().date()
        recurrences = (
            RecurringTransaction.query
            .filter(RecurringTransaction.active.is_(True))
            .filter(RecurringTransaction.next_date <= today)
            .all()
        )

        for recurrence in recurrences:
            while recurrence.active and recurrence.next_date <= today:
                if recurrence.end_date and recurrence.next_date > recurrence.end_date:
                    recurrence.active = False
                    break
                if recurrence.remaining_occurrences is not None and recurrence.remaining_occurrences <= 0:
                    recurrence.active = False
                    break

                txn = Transaction(
                    title=recurrence.title,
                    amount=recurrence.amount,
                    type=recurrence.type,
                    date=recurrence.next_date,
                    category_id=recurrence.category_id,
                    account_id=recurrence.account_id,
                    is_recurring=True,
                    recurring_id=recurrence.id,
                )
                db.session.add(txn)
                db.session.flush()
                db.session.add(RecurringPostEvent(
                    recurring_id=recurrence.id,
                    transaction_id=txn.id,
                ))

                if recurrence.remaining_occurrences is not None:
                    recurrence.remaining_occurrences -= 1
                    if recurrence.remaining_occurrences <= 0:
                        recurrence.active = False

                recurrence.next_date = _next_occurrence_date(recurrence.next_date, recurrence.frequency)
                if recurrence.end_date and recurrence.next_date > recurrence.end_date:
                    recurrence.active = False

        db.session.commit()


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
    scheduler.add_job(process_recurring_transactions_job, trigger="interval", hours=1)
    scheduler.start()
    app.logger.info("Scheduler started")
    return scheduler
