const createApp = require('./app');

const PORT = process.env.PORT || 4000;

createApp().listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
