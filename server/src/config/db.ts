import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let mongoMemoryServer: any = null;

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/invoiceflow';

  try {
    // Attempt standard connection with 3-second timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ Connected to MongoDB at: ${uri}`);
  } catch (error) {
    console.warn(`⚠️ Could not connect to MongoDB at ${uri}. Launching local embedded MongoDB Memory Server...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`✅ Connected to embedded MongoDB Memory Server at: ${memoryUri}`);
    } catch (memErr) {
      console.error('❌ Failed to connect to MongoDB and failed to start in-memory fallback:', memErr);
      process.exit(1);
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log('MongoDB disconnected successfully');
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err);
  }
};
