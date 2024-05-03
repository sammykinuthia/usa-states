const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors')


// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Routes

// Import routes
const statesRoutes = require('./routes/states.js');

// Initialize the app
const app = express();
app.use(cors())

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.use('/states', statesRoutes);

// Catch all route for 404 errors
app.use((req, res, next) => {
    if (req.accepts('html')) {
      res.status(404).sendFile(path.join(__dirname, '404.html'));
    } else {
      res.status(404).json({ error: '404 Not Found' });
    }
  });

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));