import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import productsRoutes from './Routes/products.js';
import categoriesRoutes from './Routes/categories.js';
import warehousesRoutes from './Routes/warehouses.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '30mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));

// MongoDB Connection
const CONNECTION_URL = process.env.CONNECTION_URL;

mongoose.connect(CONNECTION_URL)
    .then(() => app.listen(port, () => console.log(`Server is running on port ${port}`)))
    .catch((error) => console.error('Error connecting to MongoDB:', error));

// Routes
app.use('/products', productsRoutes);
app.use('/categories', categoriesRoutes);
app.use('/warehouses', warehousesRoutes);


// Start server

