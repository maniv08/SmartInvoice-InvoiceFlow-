import dotenv from 'dotenv';
import app from './app';
import { connectDB } from './config/db';
import { initPostgres } from './config/postgres';
import { initRedis } from './config/redis';
import { startReminderCron } from './services/reminderScheduler';
import { initEmailTransporter } from './services/emailService';
import { seedDatabase } from './scripts/seed';
import { User } from './models';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Primary & Document DB Connection
    await connectDB();

    // 2. Relational PostgreSQL Engine Connection & Migration
    await initPostgres();

    // 3. High-Speed Redis Caching Engine
    initRedis();

    // 4. Email notification transporter
    await initEmailTransporter();

    // Check if database is empty, auto-seed with rich demo dataset
    const userCount = await User.countDocuments({});
    if (userCount === 0) {
      console.log('📦 Database appears empty. Running automatic seed...');
      await seedDatabase();
    }

    // Start automated scheduler
    startReminderCron();

    app.listen(PORT, () => {
      console.log(`🚀 InvoiceFlow Server is actively running on port: ${PORT}`);
      console.log(`📚 Swagger OpenAPI Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🩺 Health check endpoint: http://localhost:${PORT}/api/health`);
      console.log(`⚡ Stack: React + TypeScript + Node.js + Express.js + PostgreSQL + Redis + REST API + Docker + Git/GitHub`);
    });
  } catch (error) {
    console.error('Fatal Server Startup Error:', error);
    process.exit(1);
  }
};

startServer();
