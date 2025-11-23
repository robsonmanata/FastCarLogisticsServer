import mongoose from 'mongoose';

const warehouseSchema = mongoose.Schema({
    WarehouseName: String,
    WarehouseLocation: String,
    WarehouseEmployeeQuantity: Number,
    WarehouseImage: String,
});

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

export default Warehouse;
