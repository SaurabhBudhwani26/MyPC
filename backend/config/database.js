const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI;

    // Validate that we have a MongoDB URI
    if (!mongoURI) {
      throw new Error(
        `MongoDB URI is not defined. Please set ${process.env.NODE_ENV === 'test' ? 'MONGODB_TEST_URI' : 'MONGODB_URI'} in your environment variables.`
      );
    }

    console.log(`🔗 Connecting to MongoDB...`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️ Database: ${mongoURI.split('/').pop()?.split('?')[0] || 'unknown'}`);

    const conn = await mongoose.connect(mongoURI, {
      // Remove deprecated options that are now defaults
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('⚠️ Server will continue running without database connection');
    console.error('🔄 Attempting to reconnect in 10 seconds...');
    
    // Retry connection after 10 seconds instead of crashing
    setTimeout(() => {
      console.log('🔄 Retrying database connection...');
      connectDB();
    }, 10000);
  }
};

module.exports = connectDB;
