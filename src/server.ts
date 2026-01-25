import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Function to run migrations
const runMigrations = () => {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    const command = 'npx sequelize-cli db:migrate';
    
    console.log('Running database migrations...');
    
    // Add --config explicitly if needed, but .sequelizerc should handle it.
    // In production (dist), .sequelizerc.prod is copied to .sequelizerc, so it should work.
    
    exec(command, (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.error(`Migration error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`Migration stderr: ${stderr}`);
      }
      console.log(`Migration stdout: ${stdout}`);
      resolve(true);
    });
  });
};

const startServer = async () => {
  try {
    // Run migrations before starting the server
    await runMigrations();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
