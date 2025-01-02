require('dotenv').config();
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const port = 4000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const EventEmitter = require('events'); const emitter = new EventEmitter();
emitter.setMaxListeners(20);
// Middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;
    console.log('token inside the verify token', token);
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

    // Create JWT token post 
    app.post('/jwt', (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' });

        res
        .cookie('token', token, {
            httpOnly: true,
            secure: false
        })
        .send({
            success: true
        });
    });

    // Clear cookie JWT token on logout
    app.post('/logoutToken', (req, res) => {
        res.clearCookie('token', {
            httpOnly: true,
            secure: false
        })
        .send({ success: true });
    });

    // Connect the client to the server (optional starting in v4.7)
    await client.connect();

    // Add a new car
    app.post('/addCar', async (req, res) => {
        const addCar = req.body;
        const result = await carCollection.insertOne(addCar);
        res.send(result);
    });

    // Get all cars
    app.get('/addCar', async (req, res) => {
        const cursor = carCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    });

    // Delete a car by id
    app.delete('/cars/:id',  async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        // if (req.user.email !== req.query.email) {
        //     return res.status(403).send({ message: 'Forbidden access' });
        // }

        const result = await carCollection.deleteOne(query);
        if (result.deletedCount === 0) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        res.send(result);
    });

    // Get car data for updating
    app.get('/updateCarInfo/:id',  async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id)};

        // if (req.user.email !== req.query.email) {
        //     return res.status(403).send({ message: 'Forbidden access' });
        // }

        const result = await carCollection.findOne(query);
        if (!result) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        res.send(result);
    });

    // Update car info
    // app.put('/updateCarInfo/:id', verifyToken, async (req, res) => {
    //     const id = req.params.id;
    //     const updatedCarInfo = req.body;
    //     const query = { _id: (id), userEmail: req.user.email };

    //     // if (req.user.email !== req.query.email) {
    //     //     return res.status(403).send({ message: 'Forbidden access' });
    //     // }

    //     const options = { upsert: true };
    //     const update = {
    //         $set: {
    //             model: updatedCarInfo.model,
    //             price: updatedCarInfo.price,
    //             availability: updatedCarInfo.availability,
    //             registrationNumber: updatedCarInfo.registrationNumber,
    //             features: updatedCarInfo.features,
    //             description: updatedCarInfo.description,
    //             bookingCount: updatedCarInfo.bookingCount,
    //             imageUrl: updatedCarInfo.imageUrl,
    //             location: updatedCarInfo.location
    //         }
    //     };
    //     const result = await carCollection.updateOne(query, update, options);
    //     if (result.matchedCount === 0) {
    //         return res.status(403).send({ message: 'Forbidden access' });
    //     }
    //     res.send(result);
    // });
  //   app.put('/updateCarInfo/:id',  async (req, res) => {
  //     const id = req.params.id;
  //     const updatedCarInfo = req.body;
  //     const query = { _id:new ObjectId (id) }; // Ensure car belongs to logged-in user
  
  //     const update = {
  //         $set: {
  //             model: updatedCarInfo.model,
  //             price: updatedCarInfo.price,
  //             availability: updatedCarInfo.availability,
  //             registrationNumber: updatedCarInfo.registrationNumber,
  //             features: updatedCarInfo.features,
  //             description: updatedCarInfo.description,
  //             bookingCount: updatedCarInfo.bookingCount,
  //             imageUrl: updatedCarInfo.imageUrl,
  //             location: updatedCarInfo.location
  //         }
  //     };
  
  //     try {
  //         const result = await carCollection.updateOne(query, update);
          
  //         if (result.matchedCount === 0) {
  //             return res.status(403).send({ message: 'Forbidden access' });
  //         }
  
  //         res.send(result);
  //     } catch (error) {
  //         res.status(500).send({ message: 'Internal server error', error });
  //     }
  // });
  app.put('/updateCarInfo/:id',  async (req, res) => {
    const id = req.params.id;
    const updatedCarInfo = req.body;
    const query = { _id: new ObjectId (id) }; // Ensure car belongs to logged-in user
    const options = { upsert: true };
    const update = {
        $set: {
            model: updatedCarInfo.model,
            price: updatedCarInfo.price,
            availability: updatedCarInfo.availability,
            registrationNumber: updatedCarInfo.registrationNumber,
            features: updatedCarInfo.features,
            description: updatedCarInfo.description,
            bookingCount: updatedCarInfo.bookingCount,
            imageUrl: updatedCarInfo.imageUrl,
            location: updatedCarInfo.location
        }
    };

    try {
        const result = await carCollection.updateOne(query, update, options);
        
        if (result.matchedCount === 0) {
            return res.status(403).send({ message: 'Forbidden access' });
        }

        res.send(result);
    } catch (error) {
        res.status(500).send({ message: 'Internal server error', error });
    }
});


    // Get car details by id
    app.get('/viewDetails/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id), userEmail: req.query.userEmail };
  
      const result = await carCollection.findOne(query);
      if (!result) {
          return res.status(403).send({ message: 'Forbidden access' });
      }
      res.send(result);
  });
  

    // Get cars by userEmail
    app.get('/myCars', verifyToken, async (req, res) => {
        const userEmail = req.user.userEmail;
        console.log('email' , req.user.email , req.query.userEmail)
        if (req.user.email !== req.query.userEmail) {
            return res.status(403).send({ message: 'Forbidden access' });
        }

        const query = { userEmail: userEmail };
        const result = await carCollection.find(query).toArray();
        res.send(result);
    });

    // Book a car
    app.post('/myBookings', async (req, res) => {
        const bookCar = req.body;

        const result = await bookingCollection.insertOne(bookCar);
        res.send(result);
    });

    // Update booking
    app.put('/updateBooking/:id',  async (req, res) => {
      const id = req.params.id;  // id from URL
      const updatedBooking = req.body;  // Data to update
      const options = { upsert: true };
      const updateDoc= {
        $set: { updatedBooking }
      }
      try {
          // Convert the string id to ObjectId
          const query = { _id: new ObjectId(id) };
  
          // // Ensure the user is authorized to update this booking
          // if (req.user.email !== updatedBooking.userEmail) {
          //     return res.status(403).send({ message: 'Forbidden access' });
          // }
  
          // Update booking
          const result = await bookingCollection.updateOne(query,updateDoc, options );
  
          if (result.matchedCount === 0) {
              return res.status(404).send({ message: 'Booking not found or forbidden access' });
          }
  
          res.send({ message: 'Booking updated successfully', result });
      } catch (error) {
          console.error('Error updating booking:', error);
          res.status(500).send({ message: 'Internal server error' });
      }
  });
  
  

    // Get bookings by userEmail
    // app.get('/myBookings', verifyToken, async (req, res) => {
    //     const userEmail = req.user.userEmail;
    //     if (req.user.email !== req.query.userEmail) {
    //         return res.status(403).send({ message: 'Forbidden access' });
    //     }

    //     const query = { userEmail: userEmail };
    //     const result = await bookingCollection.find(query).toArray();
    //     res.send(result);
    // });

    app.get('/myBookings', verifyToken, async (req, res) => {
      const userEmail = req.user.email; // JWT-verified email
      const query = { userEmail };
  
      try {
          const result = await bookingCollection.find(query).toArray();
          res.send(result);
      } catch (error) {
          console.error('Error fetching bookings:', error);
          res.status(500).send({ message: 'Internal server error' });
      }
  });
  

    // app.get('/myBookings/:id', verifyToken, async (req, res) => {
    //     const id = req.params.id;
    //     const query = { _id: new ObjectId(id), userEmail: req.user.email };

    //     if (req.user.email !== req.query.userEmail) {
    //         return res.status(403).send({ message: 'Forbidden access' });
    //     }

    //     const result = await bookingCollection.findOne(query);
    //     if (!result) {
    //         return res.status(403).send({ message: 'Forbidden access' });
    //     }
    //     res.send(result);
    // });

    app.get('/myBookings/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id), userEmail: req.user.email };
  
      try {
          const result = await bookingCollection.findOne(query);
          if (!result) {
              return res.status(404).send({ message: 'Booking not found' });
          }
          res.send(result);
      } catch (error) {
          console.error('Error fetching booking:', error);
          res.status(500).send({ message: 'Internal server error' });
      }
  });
  
    // Delete booking
    // app.delete('/myBookings/:id', verifyToken, async (req, res) => {
    //     const id = req.params.id;
    //     const query = { _id: new ObjectId(id), userEmail: req.user.email };

    //     if (req.user.email !== req.query.userEmail) {
    //         return res.status(403).send({ message: 'Forbidden access' });
    //     }

    //     const result = await bookingCollection.deleteOne(query);
    //     if (result.deletedCount === 0) {
    //         return res.status(403).send({ message: 'Forbidden access' });
    //     }
    //     res.send(result);
    // });
    app.delete('/myBookings/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
  
      try {
          const query = { _id: (id), userEmail: req.user.email };
  
          const result = await bookingCollection.deleteOne(query);
  
          if (result.deletedCount === 0) {
              return res.status(404).send({ message: 'Booking not found or forbidden access' });
          }
  
          res.send({ message: 'Booking deleted successfully', result });
      } catch (error) {
          console.error('Error deleting booking:', error);
          res.status(500).send({ message: 'Internal server error' });
      }
  });
  

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Car server is running on port ${port}`);
});
