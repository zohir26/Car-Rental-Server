
require('dotenv').config();
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const EventEmitter = require('events');

// Configure EventEmitter
const emitter = new EventEmitter();
emitter.setMaxListeners(20);

// Middleware
app.use(cors({
  origin: [
      'http://localhost:5176',
      'https://car-rental-f7654.web.app',
      'https://car-rental-f7654.firebaseapp.com',
      'https://car-rental-server-lyart.vercel.app',
  ],
  credentials: true, // Allow cookies to be sent and received
}));

app.use(express.json());
app.use(cookieParser());

// JWT Verification Middleware
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

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y1njy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const carCollection = client.db('Car_Collection_DB').collection('Car_Collection');
        const bookingCollection = client.db('Car_Collection_DB').collection('My_Bookings');

        // JWT Token Creation
        app.post('/jwt', (req, res) => {
          const user = req.body;
          const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' });
          res.cookie('token', token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production', // True for production
              sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // None for cross-site, Lax for same-site
          }).send({ success: true });
      });

        // Logout and Clear Token
        app.post('/logoutToken', (req, res) => {
          res.clearCookie('token', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
          }).send({ success: true });
      });

        // Add a New Car
        app.post('/addCar', async (req, res) => {
            const addCar = req.body;
            const result = await carCollection.insertOne(addCar);
            res.send(result);
        });

        // Get All Cars with Pagination
        app.get('/addCar', async (req, res) => {
            const page = parseInt(req.query.page) || 0;
            const size = parseInt(req.query.size) || 10;

            const cursor = carCollection.find();
            const result = await cursor.skip(page * size).limit(size).toArray();
            res.send(result);
        });

        // Delete a Car by ID
        app.delete('/cars/:id', async (req, res) => {
            const id = req.params.id;
            try {
                const query = { _id: new ObjectId(id) };
                const result = await carCollection.deleteOne(query);
                if (result.deletedCount === 0) {
                    return res.status(404).send({ message: 'Car not found' });
                }
                res.send(result);
            } catch (error) {
                res.status(400).send({ message: 'Invalid Car ID' });
            }
        });

        // Get Car Data for Updating
        app.get('/updateCarInfo/:id', async (req, res) => {
            const id = req.params.id;
            try {
                const query = { _id: new ObjectId(id) };
                const result = await carCollection.findOne(query);
                if (!result) {
                    return res.status(404).send({ message: 'Car not found' });
                }
                res.send(result);
            } catch (error) {
                res.status(400).send({ message: 'Invalid Car ID' });
            }
        });

        // Update Car Info
        app.put('/updateCarInfo/:id', async (req, res) => {
          const id = req.params.id;
      
          // Validate the id
          if (!ObjectId.isValid(id)) {
              return res.status(400).send({ message: 'Invalid Car ID' });
          }
      
          const updatedCarInfo = req.body;
      
          try {
              const query = { _id: new ObjectId(id) }; // Convert id to ObjectId
              const update = { $set: updatedCarInfo };
      
              const result = await carCollection.updateOne(query, update);
      
              if (result.matchedCount === 0) {
                  return res.status(404).send({ message: 'Car not found' });
              }
      
              res.send({ success: true, result });
          } catch (error) {
              console.error('Error updating car:', error); // Log error details
              res.status(500).send({ message: 'Failed to update car', error: error.message });
          }
      });

        // Get Car Details by ID
        app.get('/viewDetails/:id', async (req, res) => {
            const id = req.params.id;
            try {
                const query = { _id: new ObjectId(id) };
                const result = await carCollection.findOne(query);
                if (!result) {
                    return res.status(404).send({ message: 'Car not found' });
                }
                res.send(result);
            } catch (error) {
                res.status(400).send({ message: 'Invalid Car ID' });
            }
        });

        // Get Cars by User Email
        app.get('/myCars', verifyToken, async (req, res) => {
            const userEmail = req.user.email;
            const query = { userEmail };
            const result = await carCollection.find(query).toArray();
            res.send(result);
        });

        // Book a Car
        app.post('/myBookings', async (req, res) => {
            const bookCar = req.body;
            const result = await bookingCollection.insertOne(bookCar);
            await carCollection.updateOne(
                { _id: new ObjectId(bookCar.carId) },
                { $inc: { bookingCount: 1 } }
            );
            res.send({ message: 'Booking Successful', bookingId: result.insertedId });
        });

        // Get Bookings by User Email
        app.get('/myBookings', verifyToken, async (req, res) => {
            const userEmail = req.user.email;
            const query = { userEmail };
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        });

        // Get Booking by ID
        app.get('/myBookings/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            try {
                const query = { _id: new ObjectId(id), userEmail: req.user.email };
                const result = await bookingCollection.findOne(query);
                if (!result) {
                    return res.status(404).send({ message: 'Booking not found' });
                }
                res.send(result);
            } catch (error) {
                res.status(400).send({ message: 'Invalid Booking ID' });
            }
        });

        //update bookings
        app.put('/updateBooking/:id', async (req, res) => {
          const id = req.params.id;
          const updatedData = req.body;
          try {
              const result = await bookingCollection.updateOne(
                  { _id: (id) },
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
      

        // Delete Booking
        app.delete('/myBookings/:id', async (req, res) => {
            const id = req.params.id;
            try {
                const query = { _id:  (id)};
                const result = await bookingCollection.deleteOne(query);
                if (result.deletedCount === 0) {
                    return res.status(404).send({ message: 'Booking not found' });
                }
                res.send({ message: 'Booking deleted successfully' });
            } catch (error) {
                res.status(400).send({ message: 'Invalid Booking ID' });
            }
        });

        // await client.db("admin").command({ ping: 1 });
        console.log("Connected to MongoDB!");
    } finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.listen(4000, () => {
    console.log('Server running on port 4000');
});
