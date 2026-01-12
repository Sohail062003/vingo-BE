import express from 'express';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import morgan from 'morgan';
import cors from 'cors';
import routes from './src/routes/index.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();

app.use(morgan('dev'));
app.use(cors({
    origin: true, // add the forntend origin here
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static("public"));


app.use('/api', routes);

const port = process.env.PORT || 5000;


app.listen(port, () => {
    // Connect to MongoDB
    connectDB();
    console.log(`Server is running on port ${port} ...!`);
});




