
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import apiRoutes from './routes/index.js';
import Event from './models/Event.js';
import Interest from './models/Interest.js';
import Reminder from './models/Reminder.js';
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
    await dropLegacyIndexes();
}).catch((err) => {
    console.log(err);
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});

async function dropLegacyIndexes() {
    const legacyIndexName = 'id_1';
    const modelsToClean = [Event, Interest, Reminder, Signup, User];

    for (const Model of modelsToClean) {
        try {
            const indexes = await Model.collection.indexes();
            const hasLegacyIndex = indexes.some((idx) => idx.name === legacyIndexName);
            if (hasLegacyIndex) {
                await Model.collection.dropIndex(legacyIndexName);
                console.log(`Dropped legacy index ${legacyIndexName} on ${Model.collection.collectionName}`);
            }
        } catch (error) {
            if (error.codeName !== 'IndexNotFound') {
                console.warn(`Failed to drop legacy index on ${Model.modelName}:`, error.message);
            }
        }
    }
}


