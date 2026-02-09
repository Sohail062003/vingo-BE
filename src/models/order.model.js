import mongoose from 'mongoose';

const shopOrderItemSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
    },
    name: {
        type: String,
    },
    price: {
        type: Number,
    },
    quantity: {
        type: Number,
    }

}, {timestamps: true});

const shopOrderSchema = new mongoose.Schema({
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    subTotal: {
        type: Number,
    },
    status: {
        type: String,
        enum:["pending", "preparing", "out of delivery", "delivered"],
        default: "pending"
    },
    shopOrderItems: [shopOrderItemSchema]


},{timestamps: true});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'online'],
        required: true,
    },   
    deliveryAddress: {
        text: String, 
        latitude: Number,
        longitude: Number,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    shopOrders: [shopOrderSchema]

}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;