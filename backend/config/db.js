import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import dns from 'dns';

let mongoMemoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college_super_app';

  // Fix Node.js EBADRESP / DNS SRV query failure on Windows & local ISP resolvers
  if (uri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (dnsErr) {
      console.warn('[DB] Could not set custom DNS resolvers:', dnsErr.message);
    }
  }

  const sanitizedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');

  try {
    // Attempt standard connection to MongoDB with robust timeout for Atlas
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
    });
    const host = mongoose.connection.host;
    const dbName = mongoose.connection.name;
    console.log(`[DB] Successfully connected to MongoDB Atlas!`);
    console.log(`[DB]   Cluster Host: ${host}`);
    console.log(`[DB]   Active Database: ${dbName}`);
    console.log(`[DB]   Connection URI: ${sanitizedUri}`);
  } catch (err) {
    console.warn(`[DB] External MongoDB connection failed (${err.message}). Starting embedded high-performance MongoDB instance...`);

    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[DB] Successfully connected to Embedded MongoDB at ${memoryUri}`);
    } catch (memErr) {
      console.error('[DB] Failed to initialize embedded MongoDB server:', memErr);
      process.exit(1);
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB runtime connection error:', err);
  });
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

