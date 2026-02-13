from flask import Blueprint, request, jsonify, send_file
from models import db, Transaction, Category, Budget, Account, TransactionSplit
from datetime import datetime
from io import BytesIO
from sqlalchemy import extract
from sqlalchemy.orm import joinedload
from flask_login import login_required, current_user
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from routes.budget_alerts import create_budget_alerts_for_budget

transactions_bp = Blueprint('transactions', __name__)


@transactions_bp.route('/api/transactions', methods=['GET'])
def get_transactions():
    try:
        month = request.args.get('month')
        year = request.args.get('year')
        category_id = request.args.get('category_id')
        account_id = request.args.get('account_id')
        type = request.args.get('type')
        search = request.args.get('search')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        sort_field = request.args.get('sort_field', 'date')
        sort_order = request.args.get('sort_order', 'desc')

        query = Transaction.query

        if month and year:
            query = query.filter(
                extract('year', Transaction.date) == int(year),
                extract('month', Transaction.date) == int(month)
            )
        elif year:
            query = query.filter(extract('year', Transaction.date) == int(year))

        if category_id:
            query = query.filter_by(category_id=int(category_id))

        if account_id:
            query = query.filter_by(account_id=int(account_id))

        if type:
            query = query.filter_by(type=type)

        if search:
            query = query.filter(Transaction.title.ilike(f"%{search}%"))

        if sort_field == 'date':
            query = query.order_by(Transaction.date.desc() if sort_order == 'desc' else Transaction.date.asc())
        elif sort_field == 'amount':
            query = query.order_by(Transaction.amount.desc() if sort_order == 'desc' else Transaction.amount.asc())

        total_items = query.count()
        total_pages = (total_items + per_page - 1) // per_page
        transactions = query.offset((page - 1) * per_page).limit(per_page).all()

        return jsonify({
            'transactions': [
                {
                    'id': t.id,
                    'title': t.title,
                    'amount': t.amount,
                    'type': t.type,
                    'date': t.date,
                    'category_id': t.category_id,
                    'account_id': t.account_id,
                    'is_transfer': t.is_transfer,
                    'transfer_group_id': t.transfer_group_id,
                    'is_cleared': t.is_cleared,
                    'splits': [
                        {
                            'id': split.id,
                            'category_id': split.category_id,
                            'category_name': split.category.name if split.category else None,
                            'amount': split.amount,
                            'note': split.note,
                        } for split in (t.splits or [])
                    ],
                } for t in transactions
            ],
            'total_pages': total_pages,
            'total_items': total_items
        })
    except Exception as e:
        return jsonify({'message': f'Error fetching transactions: {str(e)}'}), 500


@transactions_bp.route('/api/transactions', methods=['POST'])
def add_transaction():
    try:
        data = request.get_json()
        title = data['title']
        amount = data['amount']
        type = data['type']
        date_str = data['date']
        category_id = data.get('category_id')
        account_id = data.get('account_id')
        is_transfer = bool(data.get('is_transfer', False))
        transfer_group_id = data.get('transfer_group_id')
        is_cleared = bool(data.get('is_cleared', False))
        splits = data.get('splits') or []

        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid date format. PLease use YYYY-MM-DD'}), 400

        new_transaction = Transaction(
            title=title,
            amount=amount,
            type=type,
            date=date_obj,
            category_id=category_id,
            account_id=account_id,
            is_transfer=is_transfer,
            transfer_group_id=transfer_group_id,
            is_cleared=is_cleared,
        )
        db.session.add(new_transaction)
        db.session.commit()

        split_total = 0
        if splits:
            for split in splits:
                try:
                    amount = float(split.get('amount', 0))
                except (TypeError, ValueError):
                    continue
                if amount <= 0:
                    continue
                split_total += amount
                db.session.add(TransactionSplit(
                    transaction_id=new_transaction.id,
                    category_id=split.get('category_id'),
                    amount=amount,
                    note=split.get('note'),
                ))
            if round(split_total, 2) != round(float(new_transaction.amount), 2):
                db.session.rollback()
                return jsonify({'message': 'Split total must equal transaction amount'}), 400
            db.session.commit()

        budget_exceeded = False
        budget_message = None
        if not new_transaction.is_transfer and new_transaction.type == 'Expense' and new_transaction.category_id:
            month_num = new_transaction.date.month
            year_num = new_transaction.date.year
            month = new_transaction.date.strftime('%Y-%m')
            budget = Budget.query.filter_by(category_id=new_transaction.category_id, month=month).first()
            if budget:
                total_expenses = db.session.query(db.func.sum(Transaction.amount)).filter(
                    Transaction.category_id == new_transaction.category_id,
                    Transaction.type == 'Expense',
                    Transaction.is_transfer.is_(False),
                    extract('year', Transaction.date) == year_num,
                    extract('month', Transaction.date) == month_num
                ).scalar() or 0
                if total_expenses > budget.amount:
                    budget_exceeded = True
                    budget_message = (
                        f"Warning: You have exceeded your budget of {budget.amount} for category "
                        f"'{budget.category.name}' this month. Total expenses: {total_expenses}."
                    )
                user_id = current_user.id if current_user.is_authenticated else None
                create_budget_alerts_for_budget(budget, user_id=user_id)

        response = {
            'id': new_transaction.id,
            'title': new_transaction.title,
            'amount': new_transaction.amount,
            'type': new_transaction.type,
            'date': new_transaction.date.strftime('%Y-%m-%d'),
            'category_id': new_transaction.category_id,
            'account_id': new_transaction.account_id,
            'is_transfer': new_transaction.is_transfer,
            'transfer_group_id': new_transaction.transfer_group_id,
            'is_cleared': new_transaction.is_cleared,
            'splits': [
                {
                    'id': split.id,
                    'category_id': split.category_id,
                    'category_name': split.category.name if split.category else None,
                    'amount': split.amount,
                    'note': split.note,
                } for split in (new_transaction.splits or [])
            ],
            'budget_exceeded': budget_exceeded,
            'budget_message': budget_message
        }
        return jsonify(response), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error adding transaction: {str(e)}'}), 500


@transactions_bp.route('/api/transactions/<int:id>', methods=['PUT'])
def update_transaction(id):
    try:
        data = request.get_json()
        transaction = Transaction.query.get_or_404(id)
        transaction.title = data['title']
        transaction.amount = data['amount']
        transaction.type = data['type']
        transaction.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        transaction.category_id = data.get('category_id')
        transaction.account_id = data.get('account_id')
        if 'is_transfer' in data:
            transaction.is_transfer = bool(data.get('is_transfer'))
        if 'transfer_group_id' in data:
            transaction.transfer_group_id = data.get('transfer_group_id')
        if 'is_cleared' in data:
            transaction.is_cleared = bool(data.get('is_cleared'))
        if 'splits' in data:
            TransactionSplit.query.filter_by(transaction_id=transaction.id).delete()
            split_total = 0
            for split in data.get('splits') or []:
                try:
                    amount = float(split.get('amount', 0))
                except (TypeError, ValueError):
                    continue
                if amount <= 0:
                    continue
                split_total += amount
                db.session.add(TransactionSplit(
                    transaction_id=transaction.id,
                    category_id=split.get('category_id'),
                    amount=amount,
                    note=split.get('note'),
                ))
            if split_total and round(split_total, 2) != round(float(transaction.amount), 2):
                db.session.rollback()
                return jsonify({'message': 'Split total must equal transaction amount'}), 400
                try:
                    amount = float(split.get('amount', 0))
                except (TypeError, ValueError):
                    continue
                if amount <= 0:
                    continue
                db.session.add(TransactionSplit(
                    transaction_id=transaction.id,
                    category_id=split.get('category_id'),
                    amount=amount,
                    note=split.get('note'),
                ))
        db.session.commit()
        if transaction.type == 'Expense' and transaction.category_id and transaction.date:
            month = transaction.date.strftime('%Y-%m')
            budget = Budget.query.filter_by(category_id=transaction.category_id, month=month).first()
            if budget:
                user_id = current_user.id if current_user.is_authenticated else None
                create_budget_alerts_for_budget(budget, user_id=user_id)
        return jsonify({
            'id': transaction.id,
            'title': transaction.title,
            'amount': transaction.amount,
            'type': transaction.type,
            'date': transaction.date,
            'category_id': transaction.category_id,
            'account_id': transaction.account_id,
            'is_transfer': transaction.is_transfer,
            'transfer_group_id': transaction.transfer_group_id,
            'is_cleared': transaction.is_cleared,
            'splits': [
                {
                    'id': split.id,
                    'category_id': split.category_id,
                    'category_name': split.category.name if split.category else None,
                    'amount': split.amount,
                    'note': split.note,
                } for split in (transaction.splits or [])
            ],
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating transaction: {str(e)}'}), 500


@transactions_bp.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    try:
        transaction = Transaction.query.get_or_404(id)
        db.session.delete(transaction)
        db.session.commit()
        return jsonify({'message': 'Transaction deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting transaction: {str(e)}'}), 500


@transactions_bp.route('/api/transactions/bulk_delete', methods=['POST'])
def bulk_delete_transactions():
    try:
        data = request.get_json()
        transaction_ids = data.get('ids', [])
        if not transaction_ids:
            return jsonify({'message': 'No transactions selected for deletion'}), 400

        Transaction.query.filter(Transaction.id.in_(transaction_ids)).delete(synchronize_session=False)
        db.session.commit()
        return jsonify({'message': 'Selected transactions deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting transactions: {str(e)}'}), 500


@transactions_bp.route('/api/recent_transactions', methods=['GET'])
def get_recent_transactions():
    try:
        account_id = request.args.get('account_id')
        query = (
            Transaction.query
            .options(joinedload(Transaction.category))
            .filter(Transaction.is_transfer.is_(False))
        )
        if account_id:
            query = query.filter(Transaction.account_id == int(account_id))
        transactions = (
            query
            .order_by(Transaction.date.desc())
            .limit(5)
            .all()
        )

        result = []
        for t in transactions:
            try:
                result.append({
                    'id': t.id,
                    'title': t.title,
                    'amount': t.amount,
                    'type': t.type,
                    'date': t.date.strftime('%Y-%m-%d') if t.date else None,
                    'category': t.category.name if t.category else "Uncategorized"
                })
            except Exception as inner_e:
                print(f"Error formatting transactio ID {t.id}: {inner_e}")
                continue

        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching recent transactions: {str(e)}'}), 500

@transactions_bp.route('/api/transactions/<int:id>/invoice', methods=['GET'])
@login_required
def download_transaction_invoice(id):
    transaction = Transaction.query.get_or_404(id)

    if not transaction.account_id:
        return jsonify({'message': 'Transaction has no account'}), 400

    account = Account.query.get(transaction.account_id)
    if not account or account.user_id != current_user.id:
        return jsonify({'message': 'Transaction not found'}), 404

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    pdf.setTitle(f"Invoice_{transaction.id}")

    margin_x = 50
    top_y = height - 60

    pdf.setFont("Helvetica-Bold", 24)
    pdf.drawString(margin_x, top_y, "INVOICE")

    pdf.setFont("Helvetica", 10)
    pdf.drawString(margin_x, top_y - 20, f"No. {transaction.id} / {transaction.date.strftime('%d %B, %Y')}")

    icon_center_x = width - 90
    icon_center_y = height - 80
    pdf.setFillColorRGB(0.1, 0.65, 0.2)
    pdf.circle(icon_center_x, icon_center_y, 34, stroke=0, fill=1)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawCentredString(icon_center_x, icon_center_y - 6, "$")
    pdf.setFillColor(colors.black)

    y = top_y - 70
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(margin_x, y, "Billing To:")
    pdf.setFont("Helvetica", 10)
    y -= 14
    pdf.drawString(margin_x, y, current_user.username)
    y -= 12
    if current_user.email:
        pdf.drawString(margin_x, y, current_user.email)
        y -= 12
    pdf.drawString(margin_x, y, f"Account: {account.name}")

    y -= 24
    pdf.setStrokeColor(colors.grey)
    pdf.line(margin_x, y, width - margin_x, y)
    y -= 18

    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(margin_x, y, "Qty")
    pdf.drawString(margin_x + 60, y, "Description")
    pdf.drawString(width - 170, y, "Price")
    pdf.drawString(width - 90, y, "Total")
    y -= 12
    pdf.line(margin_x, y, width - margin_x, y)
    y -= 16

    pdf.setFont("Helvetica", 10)
    pdf.drawString(margin_x, y, "1")
    pdf.drawString(margin_x + 60, y, (transaction.title or "")[:40])
    pdf.drawRightString(width - 120, y, f"{transaction.amount:.2f}")
    pdf.drawRightString(width - 50, y, f"{transaction.amount:.2f}")

    y -= 22
    pdf.line(margin_x, y, width - margin_x, y)
    y -= 18

    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawRightString(width - 120, y, "Total")
    pdf.drawRightString(width - 50, y, f"{transaction.amount:.2f}")

    if transaction.category_id:
        category = Category.query.get(transaction.category_id)
        if category:
            y -= 28
            pdf.setFont("Helvetica", 10)
            pdf.drawString(margin_x, y, f"Category: {category.name}")

    y -= 40
    pdf.setFont("Helvetica", 8)
    pdf.setFillColor(colors.grey)
    pdf.drawString(margin_x, y, "Finance Manager • Generated invoice")
    pdf.setFillColor(colors.black)

    pdf.showPage()
    pdf.save()
    buffer.seek(0)

    filename = f"invoice_{transaction.id}.pdf"
    return send_file(buffer, mimetype='application/pdf', as_attachment=True, download_name=filename)
