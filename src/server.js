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
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, Postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Profile pictures are public — they are display images, not sensitive documents
app.use('/uploads/profile_pictures', express.static(path.join(process.cwd(), 'uploads', 'profile_pictures')));

// All other uploads require a valid JWT (SSN cards, receipts, signatures, documents)
app.get('/uploads/:folder/:file', (req, res) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required to access files.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    const folder = req.params.folder;
    const file = req.params.file;

    // Prevent path traversal — only allow access to sensitive upload folders
    const protectedFolders = ['ssn_cards', 'payment_receipts', 'signatures', 'documents'];
    if (!protectedFolders.includes(folder)) {
        return res.status(403).json({ message: 'Access denied.' });
    }

    const filePath = path.resolve('uploads', folder, file);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found.' });
    }

    res.sendFile(filePath);
});

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

// Mount Routes securely through /api namespace
app.use('/api/auth', authRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
    console.error("Global Error Handler Caught:", err.message, "Field:", err.field);
    const status = (err.name === 'MulterError' || err.message.includes('file type') || err.message.includes('limit')) ? 400 : 500;
    res.status(status).json({ message: err.message, error: err.message, field: err.field });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
