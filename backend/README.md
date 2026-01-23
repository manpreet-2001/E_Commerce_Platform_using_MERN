# Backend - CityTech Store

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/citytechstore
JWT_SECRET=your_secret_key_here
```

3. Start the server:
```bash
npm start
# or for development with auto-restart:
npm run dev
```

## Folder Structure

- `config/` - Database configuration
- `models/` - MongoDB models (User, Product, Order)
- `routes/` - API routes (auth, products, cart, orders)
- `middleware/` - Authentication middleware
- `controllers/` - Business logic (optional)
- `utils/` - Helper functions
- `uploads/` - Product image uploads storage

## API Endpoints

- `/api/auth` - Authentication routes
- `/api/products` - Product routes
- `/api/cart` - Cart routes
- `/api/orders` - Order routes
