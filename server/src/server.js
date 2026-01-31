
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import apiRoutes from './routes/router.js';
import Event from './models/Event.js';
import Signup from './models/Signup.js';
import User from './models/User.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api', apiRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI 

mongoose.set('strictQuery', true);
mongoose.connect(MONGO_URI).then(async () => {
    console.log('Connected to MongoDB, ', mongoose.connection.name);
}).catch((err) => {
    console.log(err);
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});




