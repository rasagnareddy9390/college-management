import { connectDB } from '../backend/config/db.js';
import { User } from '../backend/models/index.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function check() {
  await connectDB();
  const users = await User.find({ role: { $in: ['student', 'faculty', 'admin', 'super_admin'] } }).select('name email role isActive');
  console.log('Found users:', users);
  process.exit(0);
}

check();

