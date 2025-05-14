# Smart Queue Management System with Face Authentication

A modern queue management system with face authentication for secure user verification.

## System Requirements

- Node.js (v16 or higher)
- PostgreSQL (v14 or higher)
- Webcam (for face authentication)
- NPM (v8 or higher) or Yarn
- Windows/Linux/MacOS

## Prerequisites Installation Guide

### 1. Node.js Installation

1. Download Node.js from [official website](https://nodejs.org/)
2. Install Node.js and NPM
3. Verify installation:

```bash
node --version
npm --version
```

### 2. PostgreSQL Installation

1. Download PostgreSQL from [official website](https://www.postgresql.org/download/)
2. During installation:
   - Note down the port number (default: 5432)
   - Set a password for 'postgres' user
   - Keep the port number and password safe
3. Verify installation:
   - Open pgAdmin (installed with PostgreSQL)
   - Connect to server using your password

## Project Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd smarqueue

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 2. Database Setup

1. Create a new PostgreSQL database:
   - Open pgAdmin
   - Right-click on 'Databases'
   - Select 'Create' > 'Database'
   - Name it 'smarqueue'

2. Configure environment variables:

```bash
# In the server directory, create .env file
cd server
cp .env.example .env

# Edit .env file with your database details:
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/smarqueue"
JWT_SECRET="generate_a_random_string_here"
PORT=5000
```

3. Run database migrations:

```bash
# In the server directory
npx prisma migrate dev
npx prisma generate
```

### 3. Face Recognition Setup

1. Create models directory:

```bash
mkdir -p server/public/models
```

2. Download face-api.js models:
   - Visit [face-api.js models](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
   - Download these files:
     - ssd_mobilenetv1_model-weights_manifest.json
     - ssd_mobilenetv1_model-shard1
     - face_landmark_68_model-weights_manifest.json
     - face_landmark_68_model-shard1
     - face_recognition_model-weights_manifest.json
     - face_recognition_model-shard1
   - Place them in `server/public/models`

### 4. Start the Application

1. Start the backend server:

```bash
# In the server directory
npm run dev
```

2. Start the frontend:

```bash
# In another terminal, in the project root
npm run dev
```

The application will run at `http://localhost:5173`

## Transferring Project to Another Machine

### 1. Database Migration

1. Export existing database:

```bash
# On source machine
pg_dump -U postgres -d smarqueue > smarqueue_backup.sql
```

2. Transfer the backup file to new machine

3. Import database on new machine:

```bash
# Create new database first
psql -U postgres -c "CREATE DATABASE smarqueue"

# Import the backup
psql -U postgres -d smarqueue < smarqueue_backup.sql
```

### 2. Project Transfer

1. Copy entire project directory to new machine

2. Install prerequisites (Node.js, PostgreSQL) on new machine

3. Follow these steps on new machine:

```bash
# Install dependencies
npm install
cd server
npm install

# Update .env with new database credentials
# Edit server/.env file

# Generate Prisma client
npx prisma generate

# Start the application
npm run dev
```

## Default Login Credentials

```
Admin:
- Email: admin@example.com
- Password: admin123

Agents:
- Email: john.doe@example.com
- Password: agent123
- Email: jane.smith@example.com
- Password: agent123
```

## Project Structure

```
smarqueue/
├── src/                  # Frontend source code
│   ├── components/      # React components
│   ├── contexts/        # React contexts
│   ├── pages/          # Page components
│   └── utils/          # Utility functions
├── server/              # Backend code
│   ├── prisma/         # Database schema and migrations
│   ├── public/         # Public assets
│   │   └── models/     # Face-api.js models
│   ├── uploads/        # User uploads
│   └── index.ts        # Main server file
└── package.json         # Project dependencies
```

## Common Issues and Solutions

1. **Database Connection Error**
   - Check if PostgreSQL is running
   - Verify database credentials in .env
   - Ensure database exists

   ```bash
   # Create database manually if needed
   psql -U postgres -c "CREATE DATABASE smarqueue"
   ```

2. **Prisma Migration Error**

   ```bash
   # Reset database and migrations
   npx prisma migrate reset
   npx prisma generate
   ```

3. **Face Recognition Models Error**
   - Verify all model files are in server/public/models
   - Check file permissions
   - Ensure filenames match exactly

4. **Port Already in Use**
   - Change port in .env file
   - Kill process using the port:

   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F

   # Linux/Mac
   lsof -i :5000
   kill -9 <PID>
   ```

## Maintenance

1. **Database Backup**

```bash
# Regular backup
pg_dump -U postgres -d smarqueue > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U postgres -d smarqueue < backup_20240101.sql
```

2. **Update Dependencies**

```bash
# Check outdated packages
npm outdated

# Update packages
npm update
```

## Security Notes

- Change default passwords after installation
- Regularly backup the database
- Keep Node.js and PostgreSQL updated
- Monitor server logs for unusual activity
- Use strong JWT_SECRET in production

## Support
for adding or changing any more admin or agent

npx prisma generate
npx prisma db push

For issues and support:

1. Check common issues section
2. Verify all installation steps
3. Check server logs
4. Create an issue in the repository

## License

MIT License - See LICENSE file for details

ou'll need to do the following to make it work:
Create a Gmail account for your application (if you don't have one already)
Enable 2-Step Verification in your Gmail account
Generate an App Password:
Go to your Google Account settings
Navigate to Security
Under "2-Step Verification", click on "App passwords"
Select "Mail" and your device
Click "Generate"

Replace the values with:
<your-email@gmail.com>: The Gmail address you'll use to send emails
your-16-digit-app-password: The App Password generated from your Google Account
<destination-email@gmail.com>: The email address where you want to receive feedback

 // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER || '<your-email@gmail.com>',
            to: process.env.FEEDBACK_EMAIL || '<your-feedback-email@gmail.com>',
            subject: `Feedback from ${name}: ${subject}`,
            text: `
            //in index.ts
