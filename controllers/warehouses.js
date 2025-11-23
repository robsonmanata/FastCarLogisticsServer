import Warehouse from '../models/warehouses.js';

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
        res.status(201).json(newWarehouse);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};
