# 📊 Personal Finance Management System

This is a full-stack web application that helps users effectively manage their personal finances. It provides tools for tracking transactions, setting budgets, managing categories, and viewing insights through a dashboard.

## 🌐 Features

- ✅ User Authentication (Login & Registration)
- 📊 Dashboard overview of financial data
- 💰 Budget creation and tracking
- 📄 Transaction management with filtering
- 🏷️ Category customization
- 🌙 Dark/Light mode toggle using React Context
- 📦 Lazy-loaded components for faster loading
- 🎨 Animated UI with Framer Motion


## 🧩 Technologies Used

### Frontend
- **React** with **React Router**
- **Context API** for theme management
- **Framer Motion** for animations
- **React Icons**
- **CSS/Tailwind** (depending on your project styling)
- **Vite** as the development server and build tool

### Backend
- **Flask** (Python)
- **SQLAlchemy** ORM
- **Flask-Login** for user sessions
- **Flask-Bcrypt** for password hashing
- **SQLite** or other database for storage


## 🏁 Getting Started

### 🐍 Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
export FLASK_APP=app.py
flask run
```

## ⚛️ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
This will start the development server, and you can access the application at `http://localhost:5173` (default Vite port).

## Project Structure
personal-finance-management-system/
├── backend/
│   ├── app.py
│   ├── models/
│   ├── database/
│   ├── routes/
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── App.jsx
│   │   └── index.css
│   └── ...
└── README.md

## 🛠️ Deployment Tips

- Ensure that both the **frontend** and **backend** have their own `requirements.txt` (Python) or `package.json` (Node.js) files.
- Use tools like **Netlify**, **Vercel**, or **Render** for hosting the frontend and backend.
- Make sure your **environment variables** (e.g., DB URL, API keys) are securely managed using `.env` files or deployment dashboards.
- For production, consider setting up proper **CORS** and **CSRF** protection for API security.

## Collaborators
1. Shakira Syevuo - `shakira.syevuo@student.moringaschool.com`
2. Newton Manyisa - `newton.manyisa@student.moringaschool.com`
3. Sandra Misigo - `sandra.misigo@student.moringaschool.com`
4. Joyce Ngari - `joyce.ngari@student.moringaschool.com`
5. Patrick Kawuki - `kawuki.patrick@student.moringaschool.com`

## License
This project is licensed under the MIT License.
