
try { require('dotenv').config(); } catch (err) { /* noop when dotenv is missing */ }
const express = require('express');
const cors = require('cors');
const path = require('path');
// const cookieParser = require('cookie-parser');

const adminAuthRoutes = require('./routes/authAdmin');
const customersRouter = require('./routes/customers');
const productsRouter = require('./routes/products');
const contactRouter = require('./routes/contact');
const adminRouter = require('./routes/admin'); 
const categoryRouter = require('./routes/categories'); 
const ordersRouter = require('./routes/orders'); 
const interactionRoutes = require('./routes/interactions'); 
const statsRoutes = require('./routes/stats');
const paymentRoutes = require('./routes/payment');
const paymentsRoutes = require('./routes/payments');
const chatRoutes = require('./routes/chat');
const inboxRoutes = require('./routes/inbox');
const customOrderRoutes = require('./routes/customOrders');
const notificationRouter = require('./routes/notification');
const reportsRoutes = require('./routes/reports');




const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // เพิ่ม origin ถ้าจำเป็น
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// Serve static files (ภาพ) จาก public/uploads
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.get('/', (req, res) => {
  res.send('API is running...');
});
// app.get('/favicon.ico', (req, res) => res.status(204).end());

// Routes
const colorsRouter = require('./routes/colors');
const popularProductsRouter = require('./routes/popularProducts');
app.use('/api', adminAuthRoutes);
app.use('/api/customers', customersRouter);
// Mount more specific route before the generic '/api/products'
app.use('/api/products/popular', popularProductsRouter);
app.use('/api/products', productsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/categories', categoryRouter); 
app.use('/api/orders', ordersRouter);  
app.use('/api/interactions', interactionRoutes); 
app.use('/api/stats', statsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/messages', chatRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/custom', customOrderRoutes);
app.use('/api/colors', colorsRouter);
app.use('/api/reports', reportsRoutes);

// Serve static files (ภาพ) จาก public/uploads
// (duplicate uploads static removed)
// --- Socket.io ---
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('chat message', (msg) => {
    // broadcast ข้อมูลจริงที่ user ส่งมา (msg)
    socket.broadcast.emit('chat message', msg);
  });
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
