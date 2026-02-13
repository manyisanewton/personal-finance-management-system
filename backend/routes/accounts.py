from datetime import datetime
from io import StringIO, BytesIO
import csv
from uuid import uuid4

from flask import Blueprint, request, jsonify, send_file
from flask_login import login_required, current_user
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas

from models import db, Account, Transaction, Category, AccountStatement

accounts_bp = Blueprint('accounts', __name__)


def _require_account(account_id):
    return Account.query.filter_by(id=account_id, user_id=current_user.id).first_or_404()


def _parse_date(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date()
    for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%Y/%m/%d'):
        try:
            return datetime.strptime(str(value), fmt).date()
        except (TypeError, ValueError):
            continue
    return None


def _calculate_cleared_balance(account_id, statement_date):
    income = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.account_id == account_id,
        Transaction.type == 'Income',
        Transaction.is_cleared.is_(True),
        Transaction.date <= statement_date
    ).scalar() or 0
    expense = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.account_id == account_id,
        Transaction.type == 'Expense',
        Transaction.is_cleared.is_(True),
        Transaction.date <= statement_date
    ).scalar() or 0
    account = Account.query.get(account_id)
    starting_balance = account.starting_balance if account else 0
    return starting_balance + income - expense

def _generate_statement_pdf(account, transactions, start_date, end_date, opening_balance, period_income, period_expense, closing_balance):
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    pdf.setTitle(f"Statement_{account.id}_{start_date}_{end_date}")

    margin_x = 50
    top_y = height - 60

    pdf.setFont("Helvetica-Bold", 22)
    pdf.drawString(margin_x, top_y, "ACCOUNT STATEMENT")
    pdf.setFont("Helvetica", 10)
    pdf.drawString(margin_x, top_y - 18, f"{account.name} • {account.currency}")
    pdf.drawString(margin_x, top_y - 32, f"Period: {start_date} to {end_date}")

    icon_center_x = width - 90
    icon_center_y = height - 80
    pdf.setFillColorRGB(0.1, 0.65, 0.2)
    pdf.circle(icon_center_x, icon_center_y, 34, stroke=0, fill=1)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawCentredString(icon_center_x, icon_center_y - 6, "$")
    pdf.setFillColor(colors.black)

    summary_top = top_y - 70
    pdf.setStrokeColor(colors.lightgrey)
    pdf.line(margin_x, summary_top, width - margin_x, summary_top)

    box_y = summary_top - 50
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(margin_x, box_y + 22, "Opening Balance")
    pdf.drawString(margin_x + 170, box_y + 22, "Total Income")
    pdf.drawString(margin_x + 320, box_y + 22, "Total Expense")
    pdf.drawString(margin_x + 470, box_y + 22, "Closing Balance")

    pdf.setFont("Helvetica", 10)
    pdf.drawString(margin_x, box_y + 6, f"{opening_balance:.2f}")
    pdf.drawString(margin_x + 170, box_y + 6, f"{period_income:.2f}")
    pdf.drawString(margin_x + 320, box_y + 6, f"{period_expense:.2f}")
    pdf.drawString(margin_x + 470, box_y + 6, f"{closing_balance:.2f}")

    y = box_y - 20
    pdf.setStrokeColor(colors.grey)
    pdf.line(margin_x, y, width - margin_x, y)
    y -= 18

    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(margin_x, y, "Date")
    pdf.drawString(margin_x + 80, y, "Description")
    pdf.drawString(width - 170, y, "Type")
    pdf.drawString(width - 90, y, "Amount")
    y -= 12
    pdf.line(margin_x, y, width - margin_x, y)
    y -= 16

    pdf.setFont("Helvetica", 9)
    for txn in transactions:
        if y < 70:
            pdf.showPage()
            y = height - 70
            pdf.setFont("Helvetica-Bold", 10)
            pdf.drawString(margin_x, y, "Date")
            pdf.drawString(margin_x + 80, y, "Description")
            pdf.drawString(width - 170, y, "Type")
            pdf.drawString(width - 90, y, "Amount")
            y -= 12
            pdf.line(margin_x, y, width - margin_x, y)
            y -= 16
            pdf.setFont("Helvetica", 9)

        date_str = txn.date.strftime('%Y-%m-%d') if txn.date else ''
        amount_value = txn.amount if txn.type == 'Income' else -txn.amount

        pdf.drawString(margin_x, y, date_str)
        pdf.drawString(margin_x + 80, y, (txn.title or '')[:40])
        pdf.drawString(width - 170, y, txn.type)
        pdf.drawRightString(width - 50, y, f"{amount_value:.2f}")
        y -= 14

    y -= 10
    pdf.setStrokeColor(colors.lightgrey)
    pdf.line(margin_x, y, width - margin_x, y)
    y -= 18
    pdf.setFont("Helvetica", 8)
    pdf.setFillColor(colors.grey)
    pdf.drawString(margin_x, y, "Finance Manager • Statement generated automatically")
    pdf.setFillColor(colors.black)

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return buffer



@accounts_bp.route('/api/accounts', methods=['GET'])
@login_required
def get_accounts():
    accounts = Account.query.filter_by(user_id=current_user.id).order_by(Account.created_at.asc()).all()
    results = []
    for account in accounts:
        income = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.account_id == account.id,
            Transaction.type == 'Income'
        ).scalar() or 0
        expense = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.account_id == account.id,
            Transaction.type == 'Expense'
        ).scalar() or 0
        current_balance = account.starting_balance + income - expense
        results.append({
            'id': account.id,
            'name': account.name,
            'type': account.type,
            'currency': account.currency,
            'starting_balance': account.starting_balance,
            'current_balance': current_balance,
            'created_at': account.created_at.isoformat() if account.created_at else None,
        })
    return jsonify(results), 200


@accounts_bp.route('/api/accounts', methods=['POST'])
@login_required
def create_account():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    account_type = (data.get('type') or '').strip()
    currency = (data.get('currency') or 'USD').strip() or 'USD'
    starting_balance = data.get('starting_balance', 0)

    if not name:
        return jsonify({'message': 'Account name is required'}), 400
    if not account_type:
        return jsonify({'message': 'Account type is required'}), 400

    try:
        starting_balance = float(starting_balance)
    except (TypeError, ValueError):
        return jsonify({'message': 'Starting balance must be a number'}), 400

    account = Account(
        name=name,
        type=account_type,
        currency=currency,
        starting_balance=starting_balance,
        created_at=datetime.utcnow(),
        user_id=current_user.id,
    )
    db.session.add(account)
    db.session.commit()

    return jsonify({
        'id': account.id,
        'name': account.name,
        'type': account.type,
        'currency': account.currency,
        'starting_balance': account.starting_balance,
        'current_balance': account.starting_balance,
    }), 201


@accounts_bp.route('/api/accounts/<int:account_id>', methods=['PUT'])
@login_required
def update_account(account_id):
    account = _require_account(account_id)
    data = request.get_json() or {}

    if 'name' in data and str(data['name']).strip():
        account.name = str(data['name']).strip()
    if 'type' in data and str(data['type']).strip():
        account.type = str(data['type']).strip()
    if 'currency' in data and str(data['currency']).strip():
        account.currency = str(data['currency']).strip()
    if 'starting_balance' in data:
        try:
            account.starting_balance = float(data['starting_balance'])
        except (TypeError, ValueError):
            return jsonify({'message': 'Starting balance must be a number'}), 400

    db.session.commit()

    return jsonify({
        'id': account.id,
        'name': account.name,
        'type': account.type,
        'currency': account.currency,
        'starting_balance': account.starting_balance,
    }), 200


@accounts_bp.route('/api/accounts/<int:account_id>', methods=['DELETE'])
@login_required
def delete_account(account_id):
    account = _require_account(account_id)
    existing_txn = Transaction.query.filter_by(account_id=account.id).first()
    if existing_txn:
        return jsonify({'message': 'Cannot delete account with transactions'}), 400

    db.session.delete(account)
    db.session.commit()
    return jsonify({'message': 'Account deleted successfully'}), 200


@accounts_bp.route('/api/transfers', methods=['POST'])
@login_required
def create_transfer():
    data = request.get_json() or {}
    from_account_id = data.get('from_account_id')
    to_account_id = data.get('to_account_id')
    amount = data.get('amount')
    title = (data.get('title') or 'Transfer').strip()
    date_raw = data.get('date')

    if not from_account_id or not to_account_id:
        return jsonify({'message': 'from_account_id and to_account_id are required'}), 400
    if from_account_id == to_account_id:
        return jsonify({'message': 'from_account_id and to_account_id must differ'}), 400
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({'message': 'Amount must be a number'}), 400
    if amount <= 0:
        return jsonify({'message': 'Amount must be positive'}), 400
    try:
        date_value = datetime.strptime(date_raw, '%Y-%m-%d').date()
    except (TypeError, ValueError):
        return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400

    from_account = _require_account(from_account_id)
    to_account = _require_account(to_account_id)

    transfer_id = str(uuid4())

    outgoing = Transaction(
        title=title,
        amount=amount,
        type='Expense',
        date=date_value,
        account_id=from_account.id,
        is_transfer=True,
        transfer_group_id=transfer_id,
        is_cleared=True,
    )
    incoming = Transaction(
        title=title,
        amount=amount,
        type='Income',
        date=date_value,
        account_id=to_account.id,
        is_transfer=True,
        transfer_group_id=transfer_id,
        is_cleared=True,
    )

    db.session.add_all([outgoing, incoming])
    db.session.commit()

    return jsonify({
        'transfer_group_id': transfer_id,
        'transactions': [
            {
                'id': outgoing.id,
                'account_id': outgoing.account_id,
                'type': outgoing.type,
                'amount': outgoing.amount,
                'date': outgoing.date.strftime('%Y-%m-%d'),
            },
            {
                'id': incoming.id,
                'account_id': incoming.account_id,
                'type': incoming.type,
                'amount': incoming.amount,
                'date': incoming.date.strftime('%Y-%m-%d'),
            }
        ]
    }), 201


@accounts_bp.route('/api/transfers', methods=['GET'])
@login_required
def list_transfers():
    account_id = request.args.get('account_id')
    limit = request.args.get('limit', 20)
    try:
        limit = max(1, min(int(limit), 100))
    except (TypeError, ValueError):
        limit = 20

    query = Transaction.query.options(joinedload(Transaction.account)).filter(
        Transaction.is_transfer.is_(True),
        Transaction.transfer_group_id.isnot(None)
    )

    if account_id:
        account = _require_account(int(account_id))
        query = query.filter(Transaction.account_id == account.id)
    else:
        query = query.join(Account, Transaction.account_id == Account.id).filter(Account.user_id == current_user.id)

    transactions = query.order_by(Transaction.date.desc()).all()

    grouped = {}
    for txn in transactions:
        grouped.setdefault(txn.transfer_group_id, []).append(txn)

    results = []
    for transfer_id, items in grouped.items():
        if len(items) < 2:
            continue
        outgoing = next((t for t in items if t.type == 'Expense'), None)
        incoming = next((t for t in items if t.type == 'Income'), None)
        if not outgoing or not incoming:
            continue
        results.append({
            'transfer_group_id': transfer_id,
            'date': outgoing.date.strftime('%Y-%m-%d') if outgoing.date else None,
            'amount': outgoing.amount,
            'from_account': outgoing.account.name if outgoing.account else None,
            'to_account': incoming.account.name if incoming.account else None,
            'transactions': [
                {
                    'id': outgoing.id,
                    'account_id': outgoing.account_id,
                    'type': outgoing.type,
                    'amount': outgoing.amount,
                },
                {
                    'id': incoming.id,
                    'account_id': incoming.account_id,
                    'type': incoming.type,
                    'amount': incoming.amount,
                }
            ]
        })
        if len(results) >= limit:
            break

    return jsonify(results), 200


@accounts_bp.route('/api/accounts/<int:account_id>/reconciliations', methods=['GET'])
@login_required
def list_reconciliations(account_id):
    account = _require_account(account_id)
    statements = AccountStatement.query.filter_by(account_id=account.id).order_by(
        AccountStatement.statement_date.desc(),
        AccountStatement.id.desc()
    ).all()
    return jsonify([
        {
            'id': statement.id,
            'account_id': statement.account_id,
            'statement_date': statement.statement_date.strftime('%Y-%m-%d'),
            'statement_balance': statement.statement_balance,
            'cleared_balance': statement.cleared_balance,
            'difference': statement.difference,
            'created_at': statement.created_at.isoformat() if statement.created_at else None,
        } for statement in statements
    ]), 200


@accounts_bp.route('/api/accounts/<int:account_id>/reconciliations', methods=['POST'])
@login_required
def create_reconciliation(account_id):
    account = _require_account(account_id)
    data = request.get_json() or {}
    statement_date = _parse_date(data.get('statement_date'))
    statement_balance = data.get('statement_balance')

    if not statement_date:
        return jsonify({'message': 'statement_date is required (YYYY-MM-DD)'}), 400
    try:
        statement_balance = float(statement_balance)
    except (TypeError, ValueError):
        return jsonify({'message': 'statement_balance must be a number'}), 400

    cleared_balance = _calculate_cleared_balance(account.id, statement_date)
    difference = statement_balance - cleared_balance

    statement = AccountStatement(
        account_id=account.id,
        statement_date=statement_date,
        statement_balance=statement_balance,
        cleared_balance=cleared_balance,
        difference=difference,
        created_at=datetime.utcnow(),
    )
    db.session.add(statement)
    db.session.commit()

    return jsonify({
        'id': statement.id,
        'account_id': statement.account_id,
        'statement_date': statement.statement_date.strftime('%Y-%m-%d'),
        'statement_balance': statement.statement_balance,
        'cleared_balance': statement.cleared_balance,
        'difference': statement.difference,
        'created_at': statement.created_at.isoformat() if statement.created_at else None,
    }), 201



@accounts_bp.route('/api/accounts/<int:account_id>/statement_pdf', methods=['GET'])
@login_required
def download_statement_pdf(account_id):
    account = _require_account(account_id)
    start_date = _parse_date(request.args.get('start_date'))
    end_date = _parse_date(request.args.get('end_date'))

    if not start_date or not end_date:
        return jsonify({'message': 'start_date and end_date are required'}), 400
    if end_date < start_date:
        return jsonify({'message': 'end_date must be on or after start_date'}), 400

    opening_income = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.account_id == account.id,
        Transaction.type == 'Income',
        Transaction.date < start_date
    ).scalar() or 0
    opening_expense = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.account_id == account.id,
        Transaction.type == 'Expense',
        Transaction.date < start_date
    ).scalar() or 0
    opening_balance = account.starting_balance + opening_income - opening_expense

    transactions = Transaction.query.filter(
        Transaction.account_id == account.id,
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).order_by(Transaction.date.asc()).all()

    period_income = sum(t.amount for t in transactions if t.type == 'Income')
    period_expense = sum(t.amount for t in transactions if t.type == 'Expense')
    closing_balance = opening_balance + period_income - period_expense

    buffer = _generate_statement_pdf(
        account,
        transactions,
        start_date.strftime('%Y-%m-%d'),
        end_date.strftime('%Y-%m-%d'),
        opening_balance,
        period_income,
        period_expense,
        closing_balance,
    )

    filename = f"statement_{account.id}_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}.pdf"
    return send_file(buffer, mimetype='application/pdf', as_attachment=True, download_name=filename)


@accounts_bp.route('/api/accounts/<int:account_id>/statement_import', methods=['POST'])
@login_required
def import_statement(account_id):
    account = _require_account(account_id)
    upload = request.files.get('file') or request.files.get('csv')
    if not upload or not upload.filename:
        return jsonify({'message': 'CSV file is required'}), 400

    try:
        content = upload.read().decode('utf-8', errors='replace')
    except Exception:
        return jsonify({'message': 'Unable to read uploaded file'}), 400

    reader = csv.DictReader(StringIO(content))
    if not reader.fieldnames:
        return jsonify({'message': 'CSV headers are required'}), 400

    field_map = {name.strip().lower(): name for name in reader.fieldnames}
    required_fields = {'date', 'title', 'amount', 'type'}
    if not required_fields.issubset(set(field_map.keys())):
        return jsonify({'message': 'CSV must include date,title,amount,type headers'}), 400

    transactions = []
    skipped = 0
    for row in reader:
        title = (row.get(field_map['title']) or '').strip()
        amount = row.get(field_map['amount'])
        type_value = (row.get(field_map['type']) or '').strip()
        date_value = _parse_date(row.get(field_map['date']))

        if not title or not date_value:
            skipped += 1
            continue

        try:
            amount_value = float(amount)
        except (TypeError, ValueError):
            skipped += 1
            continue

        normalized_type = type_value.capitalize()
        if normalized_type not in {'Income', 'Expense'}:
            skipped += 1
            continue

        category_id = None
        category_field = field_map.get('category')
        if category_field:
            category_name = (row.get(category_field) or '').strip()
            if category_name:
                category = Category.query.filter(func.lower(Category.name) == category_name.lower()).first()
                if category:
                    category_id = category.id

        transactions.append(Transaction(
            title=title,
            amount=amount_value,
            type=normalized_type,
            date=date_value,
            category_id=category_id,
            account_id=account.id,
            is_cleared=True,
        ))

    if not transactions:
        return jsonify({'message': 'No valid rows found in CSV', 'skipped': skipped}), 400

    db.session.add_all(transactions)
    db.session.commit()

    return jsonify({
        'created': len(transactions),
        'skipped': skipped,
    }), 201
