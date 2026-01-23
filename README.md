# CityTech Store
## Electronics E-Commerce Platform - MERN Stack Project

A modern e-commerce platform for electronics products with order management system.

## 🚀 Project Overview

CityTech Store enables:
- **Vendors** to list and manage their electronics products online
- **Customers** to browse, add to cart, and place order requests
- **Admins** to manage all products and orders on the platform

## 📁 Project Structure

```
CityTech_Store/
├── backend/              # Node.js + Express + MongoDB
│   ├── config/          # Database configuration
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication middleware
│   ├── controllers/     # Business logic (optional)
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point
│
├── frontend/            # React.js application
│   ├── public/          # Static files
│   └── src/
│       ├── components/  # Reusable components
│       ├── pages/       # Page components
│       ├── context/     # React Context
│       ├── utils/       # Helper functions
│       └── App.js       # Main app component
│
└── README.md
```

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs

### Frontend
- **Framework:** React.js
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **State Management:** React Context API

## 📋 Features

### Must Have Features
- ✅ User Authentication (Register, Login, Logout)
- ✅ Electronics Product Management (CRUD operations)
- ✅ Shopping Cart
- ✅ Order Management
- ✅ Order Status Tracking
- ✅ Vendor Dashboard
- ✅ Admin Dashboard
- ✅ Responsive Design

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/manpreet-2001/E_Commerce_Platform_using_MERN.git
cd E_Commerce_Platform_using_MERN
```

2. **Backend Setup**
```bash
cd backend
npm install
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install
```

4. **Environment Variables**

Create `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/citytechstore
JWT_SECRET=your_secret_key_here
```

5. **Run Backend**
```bash
cd backend
npm start
```

6. **Run Frontend**
```bash
cd frontend
npm start
```

## 📝 Development Timeline

- **Week 1-2:** Setup & Authentication
- **Week 3-4:** Products Feature
- **Week 5-6:** Cart & Orders
- **Week 7-8:** Dashboards & Polish
- **Week 9-10:** Testing & Deployment

## 👥 User Roles

1. **Customer** - Browse electronics products, add to cart, place orders
2. **Vendor** - Add/edit electronics products, manage orders
3. **Admin** - Manage all products and orders on the platform

## 📄 License

This project is for educational purposes (College Capstone Project).

## 👤 Author

Manpreet Singh

---

**Repository:** [https://github.com/manpreet-2001/E_Commerce_Platform_using_MERN.git](https://github.com/manpreet-2001/E_Commerce_Platform_using_MERN.git)

**Website Name:** CityTech Store  
**Focus:** Electronics E-Commerce Platform
