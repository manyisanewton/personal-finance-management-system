from flask import Blueprint, request, jsonify, current_app
import requests
from datetime import datetime, timedelta
from models import db, ExchangeRate
currency_converter_bp = Blueprint('currency_converter', __name__)
API_URL = "https://open.er-api.com/v6/latest/"
def fetch_exchange_rate_from_api(base_currency):
    try:
        response = requests.get(API_URL + base_currency)
        if response.status_code == 200:
            data = response.json()
            return data.get('rates', {})
        else:
            current_app.logger.error(f"API error: {response.status_code}")
            return None
    except Exception as e:
        current_app.logger.error(f"Error fetching exchange rates: {e}")
        return None
def get_exchange_rate(from_currency, to_currency):
    six_hours_ago = datetime.utcnow() - timedelta(hours=6)
    record = (
        ExchangeRate.query
        .filter_by(base_currency=from_currency, target_currency=to_currency)
        .filter(ExchangeRate.updated_at >= six_hours_ago)
        .first()
    )
    if record:
        return record.rate
    else:
        rates = fetch_exchange_rate_from_api(from_currency)
        if rates and to_currency in rates:
            rate = rates[to_currency]
            record = ExchangeRate.query.filter_by(base_currency=from_currency, target_currency=to_currency).first()
            if record:
                record.rate = rate
                record.updated_at = datetime.utcnow()
            else:
                record = ExchangeRate(
                    base_currency=from_currency,
                    target_currency=to_currency,
                    rate=rate,
                    updated_at=datetime.utcnow()
                )
                db.session.add(record)
            db.session.commit()
            return rate
        else:
            return None
@currency_converter_bp.route('/api/convert', methods=['GET'])
def convert_currency():
    try:
        amount = float(request.args.get('amount', 0))
        from_currency = request.args.get('from', 'USD')
        to_currency = request.args.get('to', 'USD')
        rate = get_exchange_rate(from_currency, to_currency)
        if rate is None:
            return jsonify({'message': 'Exchange rate not available'}), 503
        converted_amount = amount * rate
        return jsonify({
            'from_currency': from_currency,
            'to_currency': to_currency,
            'original_amount': amount,
            'converted_amount': converted_amount,
            'rate': rate
        })
    except Exception as e:
        return jsonify({'message': f'Error converting currency: {str(e)}'}), 500