from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)

# Veritabanı Ayarları
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'nexus.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- VERİTABANI MODELİ: PORTFÖY ---
class Asset(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(20), nullable=False) # Örn: BTCTRY
    amount = db.Column(db.Float, nullable=False)      # Örn: 0.05
    buy_price = db.Column(db.Float, nullable=False)   # Örn: 1500000 (Maliyet)

with app.app_context():
    db.create_all()

# --- ROTALAR ---

@app.route('/')
def index():
    return render_template('index.html')

# API: Portföyü Listele
@app.route('/api/portfolio', methods=['GET'])
def get_portfolio():
    assets = Asset.query.all()
    # Frontend'e JSON olarak yolluyoruz
    data = [{
        'id': a.id,
        'symbol': a.symbol,
        'amount': a.amount,
        'buy_price': a.buy_price
    } for a in assets]
    return jsonify(data)

# API: Yeni Varlık Ekle
@app.route('/api/portfolio/add', methods=['POST'])
def add_asset():
    data = request.json
    try:
        new_asset = Asset(
            symbol=data['symbol'],
            amount=float(data['amount']),
            buy_price=float(data['price'])
        )
        db.session.add(new_asset)
        db.session.commit()
        return jsonify({"status": "success", "message": "Varlık eklendi"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

# API: Varlık Sil
@app.route('/api/portfolio/delete/<int:id>', methods=['DELETE'])
def delete_asset(id):
    asset = Asset.query.get(id)
    if asset:
        db.session.delete(asset)
        db.session.commit()
        return jsonify({"status": "deleted"})
    return jsonify({"status": "error"}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)