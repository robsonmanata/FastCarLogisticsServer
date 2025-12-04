import Warehouse from '../models/warehouses.js';
import mongoose from 'mongoose';
import { createTransaction } from './transactions.js';

export const getWarehouses = async (req, res) => {
    try {
        const warehouses = await Warehouse.find();
        res.status(200).json(warehouses);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const createWarehouse = async (req, res) => {
    const warehouse = req.body;
    const newWarehouse = new Warehouse(warehouse);

    try {
        await newWarehouse.save();

        await createTransaction({
            User: warehouse.User || 'System',
            Type: 'Warehouse Created',
            Items: [{
                ProductName: newWarehouse.WarehouseName,
                Quantity: 0
            }],
            Details: `Created Warehouse: ${newWarehouse.WarehouseName}`
        });

        res.status(201).json(newWarehouse);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

export const updateWarehouse = async (req, res) => {
    const { id: _id } = req.params;
    const warehouse = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send('No warehouse with that id');

    const updatedWarehouse = await Warehouse.findByIdAndUpdate(_id, { ...warehouse, _id }, { new: true });

    res.json(updatedWarehouse);
}

export const deleteWarehouse = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('No warehouse with that id');

    const warehouse = await Warehouse.findById(id);
    await Warehouse.findByIdAndDelete(id);

    if (warehouse) {
        await createTransaction({
            User: 'System',
            Type: 'Warehouse Deleted',
            Items: [{
                ProductName: warehouse.WarehouseName,
                Quantity: 0
            }],
            Details: `Deleted Warehouse: ${warehouse.WarehouseName}`
        });
    }

    res.json({ message: 'Warehouse deleted successfully' });
}

