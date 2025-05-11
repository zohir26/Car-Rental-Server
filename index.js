// Load environment variables from .env file
require('dotenv').config();

// Import dependencies
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const EventEmitter = require('events');

// Increase default listener limit to avoid memory leak warnings
const emitter = new EventEmitter();
emitter.setMaxListeners(20);

// Enable CORS for specific domains with credentials
app.use(cors({
  origin: [
    'http://localhost:5176',
    'https://car-rental-f7654.web.app',
    'https://car-rental-f7654.firebaseapp.com',
    'https://car-rental-server-lyart.vercel.app',
  ],
  credentials: true,
}));

// Middleware for parsing JSON and cookies
app.use(express.json());
app.use(cookieParser());

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized access' });
    }
    req.user = decoded;
    next();
  });
};

// MongoDB connection URI and client setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y1njy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Main async function to define routes
async function run() {
  try {
    const carCollection = client.db('Car_Collection_DB').collection('Car_Collection');
    const bookingCollection = client.db('Car_Collection_DB').collection('My_Bookings');

    // Generate JWT and set cookie
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      }).send({ success: true });
    });

    // Logout user and clear JWT cookie
    app.post('/logoutToken', (req, res) => {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      }).send({ success: true });
    });

    // Add a new car to the database
    app.post('/addCar', async (req, res) => {
      const addCar = req.body;
      const result = await carCollection.insertOne(addCar);
      res.send(result);
    });

    // Get cars with pagination support
    app.get('/addCar', async (req, res) => {
      const page = parseInt(req.query.page) || 0;
      const size = parseInt(req.query.size) || 10;
      const cursor = carCollection.find();
      const result = await cursor.skip(page * size).limit(size).toArray();
      res.send(result);
    });

    // Delete a car by ID
    app.delete('/cars/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await carCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          return res.status(404).send({ message: 'Car not found' });
        }
        res.send(result);
      } catch (error) {
        res.status(400).send({ message: 'Invalid Car ID' });
      }
    });

    // Fetch car info by ID for updating
    app.get('/updateCarInfo/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await carCollection.findOne({ _id: new ObjectId(id) });
        if (!result) {
          return res.status(404).send({ message: 'Car not found' });
        }
        res.send(result);
      } catch (error) {
        res.status(400).send({ message: 'Invalid Car ID' });
      }
    });

    // Update existing car information
    app.put('/updateCarInfo/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: 'Invalid Car ID' });
      }
      const updatedCarInfo = req.body;
      try {
        const result = await carCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedCarInfo }
        );
        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Car not found' });
        }
        res.send({ success: true, result });
      } catch (error) {
        res.status(500).send({ message: 'Failed to update car', error: error.message });
      }
    });

    // Get car details by ID
    app.get('/viewDetails/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await carCollection.findOne({ _id: new ObjectId(id) });
        if (!result) {
          return res.status(404).send({ message: 'Car not found' });
        }
        res.send(result);
      } catch (error) {
        res.status(400).send({ message: 'Invalid Car ID' });
      }
    });

    // Get cars added by the logged-in user
    app.get('/myCars', verifyToken, async (req, res) => {
      const userEmail = req.user.email;
      const result = await carCollection.find({ userEmail }).toArray();
      res.send(result);
    });

    // Book a car and increase its booking count
    app.post('/myBookings', async (req, res) => {
      const bookCar = req.body;
      const result = await bookingCollection.insertOne(bookCar);
      await carCollection.updateOne(
        { _id: new ObjectId(bookCar.carId) },
        { $inc: { bookingCount: 1 } }
      );
      res.send({ message: 'Booking Successful', bookingId: result.insertedId });
    });

    // Get all bookings made by the logged-in user
    app.get('/myBookings', verifyToken, async (req, res) => {
      const result = await bookingCollection.find({ userEmail: req.user.email }).toArray();
      res.send(result);
    });

    // Get a single booking by ID
    app.get('/myBookings/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      try {
        const result = await bookingCollection.findOne({
          _id: new ObjectId(id),
          userEmail: req.user.email,
        });
        if (!result) {
          return res.status(404).send({ message: 'Booking not found' });
        }
        res.send(result);
      } catch (error) {
        res.status(400).send({ message: 'Invalid Booking ID' });
      }
    });

    // Update a booking
    app.put('/updateBooking/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      try {
        const result = await bookingCollection.updateOne(
          { _id: id },
          { $set: updatedData }
        );
        if (result.matchedCount > 0) {
          res.send({ message: 'Booking updated successfully', result });
        } else {
          res.status(404).send({ message: 'Booking not found' });
        }
      } catch (error) {
        res.status(400).send({ message: 'Invalid Booking ID', error });
      }
    });

    // Delete a booking by ID
    app.delete('/myBookings/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await bookingCollection.deleteOne({ _id: id });
        if (result.deletedCount === 0) {
          return res.status(404).send({ message: 'Booking not found' });
        }
        res.send({ message: 'Booking deleted successfully' });
      } catch (error) {
        res.status(400).send({ message: 'Invalid Booking ID' });
      }
    });

    console.log("Connected to MongoDB!");
  } finally {
    // Optionally close the DB connection
    // await client.close();
  }
}

// Run the server
run().catch(console.dir);

// Start the Express server
app.listen(4000, () => {
  console.log('Server running on port 4000');
});
