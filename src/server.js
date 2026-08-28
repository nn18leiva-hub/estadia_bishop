const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();

// --- Security Headers ---
app.use(helmet());

// --- CORS: Restrict to known origins ---
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''));

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        
        const cleanOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes('*') || allowedOrigins.includes(cleanOrigin)) {
            return callback(null, true);
        }

        // Domain match check ignoring protocol (http vs https) and www subdomains
        const originHost = cleanOrigin.replace(/^https?:\/\/(www\.)?/, '');
        const isDomainMatch = allowedOrigins.some(ao => {
            const aoHost = ao.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
            return aoHost === originHost;
        });

        if (isDomainMatch) {
            return callback(null, true);
        }

        console.warn(`[CORS Blocked] Origin: ${origin} not in ALLOWED_ORIGIN:`, allowedOrigins);
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads directory (ID cards, receipts, signatures, profile pictures, documents) statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


// Serve static HTML site (non-sensitive)
app.use(express.static(path.join(__dirname, '..', 'site')));

// Root redirect to login
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Basic health check routes (for Docker + monitoring)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const parentRoutes = require('./routes/parentRoutes');
const requestRoutes = require('./routes/requestRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const staffRoutes = require('./routes/staffRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');

// Mount Routes securely through /api namespace
app.use('/api/auth', authRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);

app.use((err, req, res, next) => {
    console.error("Global Error Handler Caught:", err.message, "Field:", err.field);
    const status = (err.name === 'MulterError' || err.message.includes('file type') || err.message.includes('limit')) ? 400 : 500;
    res.status(status).json({ message: err.message, error: err.message, field: err.field });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
