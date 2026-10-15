import app from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`Student Accommodation Finder API running`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
