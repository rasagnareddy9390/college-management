import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './backend/routes/authRoutes.js';
import { connectDB } from './backend/config/db.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

await connectDB();
const server = app.listen(0, async () => {
    const port = server.address().port;
    const email = `newuser${Date.now()}@example.com`;

    try {
        const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email,
                password: 'Password123',
                role: 'student',
                phone: '+91 9000000000',
            }),
        });

        const text = await response.text();
        console.log('REGISTER_STATUS=' + response.status);
        console.log(text);
    } catch (err) {
        console.error('REGISTER_TEST_ERROR=' + err.message);
        process.exitCode = 1;
    } finally {
        server.close();
        await mongoose.disconnect();
    }
});
