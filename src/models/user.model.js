import mongoose from "mongoose";


const userShema = new mongoose.Schema({
    fullName : {
        type: String,
        required: true
    },
    email : {
        type: String,
        required: true,
        unique: true
    },
    password : {
        type: String,
    },
    mobile : {
        type: String,
        required: true,
    },
    role : {
        type: String,
        enum: ['user', 'owner', 'deliveryBoy', 'admin'],
        required : true,
    }

}, {timestamps: true});

const User = mongoose.model('User', userShema);
export default User;