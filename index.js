// require('dotenv').config();
// const express = require('express');
// const app = express();
// const cors = require('cors');
// const port = 4000;

// //Middleware
// app.use(cors());
// app.use(express.json());

// // mongoDB Connection

// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y1njy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//     serverApi: {
//         version: ServerApiVersion.v1,
//         strict: true,
//         deprecationErrors: true,
//     }
// });

// async function run() {
//     try {

//         const carCollection = client.db('Car_Collection_DB').collection('Car_Collection')
//         // Connect the client to the server	(optional starting in v4.7)
//         const bookingCollection = client.db('Car_Collection_DB').collection('My_Bookings')

//         //Post Car data to server
//         app.post('/addCar', async (req, res) => {
//             const addCar = req.body;
//             const result = await carCollection.insertOne(addCar);
//             res.send(result)
//         })


//         // Get Car Data from server
//         app.get('/addCar', async (req, res) => {
//             const cursor = carCollection.find();
//             const result = await cursor.toArray();
//             res.send(result)
//         })

//         //delete car data based on id
//         app.delete('/cars/:id', async (req, res) => {
//             const id = req.params.id;
//             const query = { _id: new ObjectId(id) };
//             const result = await carCollection.deleteOne(query);
//             res.send(result)
//         })

//         // get car data for updating car info
//         app.get('/updateCarInfo/:id', async (req, res) => {
//             const id = req.params.id;
//             const query = { _id: new ObjectId(id) };
//             const result = await carCollection.findOne(query);
//             res.send(result);
//         })

//         //update car info
//         app.put('/updateCarInfo/:id', async (req, res) => {
//             const id = req.params.id;
//             const query = { _id: new ObjectId(id) };
//             const options = { upsert: true };
//             const updatedCarInfo = req.body;
//             const info = {

//                 $set: {
//                     model: updatedCarInfo.model,
//                     price: updatedCarInfo.price,
//                     availability: updatedCarInfo.availability,
//                     registrationNumber: updatedCarInfo.registrationNumber,
//                     features: updatedCarInfo.features,
//                     description: updatedCarInfo.description,
//                     bookingCount: updatedCarInfo.bookingCount,
//                     imageUrl: updatedCarInfo.imageUrl,
//                     location: updatedCarInfo.location

//                 }
//             }

//             const result = await carCollection.updateOne(query, info, options);
//             res.send(result)
//         })

//         // Get car data based on id for showing details
//         app.get('/viewDetails/:id', async (req, res) => {
//             const id = req.params.id;
//             const query = { _id: new ObjectId(id) };
//             const result = await carCollection.findOne(query);
//             res.send(result);
//         })

//         //get car data based on userEmail 
//         app.get('/myCars', async (req, res) => {
//             const userEmail = req.query.userEmail;
//             const query = { userEmail: userEmail };
//             const result = await carCollection.find(query).toArray();
//             res.send(result)
//         })

//         // set up a new collection name myBookings and set a post function

//         app.post('/myBookings', async (req, res) => {
//             const bookCar = req.body;
//             const result = await bookingCollection.insertOne(bookCar);
//             res.send(result)
//         })

//         // Update on Server (index.js)
//         app.put('/updateBooking/:id', async (req, res) => {
//             const id = req.params.id;
//             const updatedBooking = req.body;
//             const query = { _id: new ObjectId(id) };
//             const result = await bookingCollection.updateOne(query, { $set: updatedBooking });
//             res.send(result);
//         });

//         // Get all the booking information with the userEmail
//         app.get('/myBookings', async (req, res) => {
//             const userEmail = req.query.userEmail;
//             const query = { userEmail: userEmail };
//             const result = await bookingCollection.find(query).toArray();
//             res.send(result)
//         })



//         // delete the bookings based on id
//         // app.delete('/myBookings/:id', async (req, res) => {
//         //     const id = req.params.id;
//         //     const query = { _id: new ObjectId(id) };
//         //     const result = await bookingCollection.deleteOne(query);
//         //     res.send(result);
//         // });



// app.delete('/myBookings/:id', async (req, res) => {
//   const id = req.params.id;
//   const query = { _id: new ObjectId(id) };
//   try {
//     const result = await bookingCollection.deleteOne(query);
//     res.send(result);
//   } catch (error) {
//     console.error("Error deleting booking:", error);
//     res.status(500).send({ message: "Failed to delete booking", error });
//   }
// });

//         // update booking 

//         // basic setup
//         app.get('/', (req, res) => {
//             res.send('Car Rental Server is running')
//         })



//         await client.connect();
//         // Send a ping to confirm a successful connection
//         await client.db("admin").command({ ping: 1 });
//         console.log("Pinged your deployment. You successfully connected to MongoDB!");
//     } finally {
//         // Ensures that the client will close when you finish/error
//         // await client.close();
//     }
// }
// run().catch(console.dir);





// app.listen(port, () => {
//     console.log(`Car server is running on port ${port}`)
// })


require('dotenv').config();
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const port = 4000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Middleware
app.use(cors({
    origin:['http://localhost:5173'],
    credentials:true
}));
app.use(express.json());
app.use(cookieParser());

//create a function to verify each information coming from client. it also called middlewire
const verifyToken= (req,res, next)=>{
    const token= req.cookies?.token;
    console.log('token inside the verify token', token)
    if(!token){
        return res.status(401).send({message:'unautorized access'})
    }
    //verify the token if token exist
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err, decoded)=>{
        if(err){
            return res.status(401).send({message:'unauthorized access'})
        }
        next()
    })

}
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

    // create jwot token post 
    app.post('/jwt',(req,res) =>{
        const user= req.body;
        const token= jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'5h'} );

        res
        .cookie('token',token, {
            httpOnly:true,
            secure:false
        })
        .send({
            success:true
        })
    })

    //clear cookie jwot token on logout
    app.post('/logoutToken', (req,res)=>{
        res.clearCookie('token', {
            httpOnly:true,
            secure:false
        })
        .send({success:true})
    })

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
    app.delete('/cars/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carCollection.deleteOne(query);
      res.send(result);
    });

    // Get car data for updating
    app.get('/updateCarInfo/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carCollection.findOne(query);
      res.send(result);
    });

    // Update car info
    app.put('/updateCarInfo/:id', async (req, res) => {
      const id = req.params.id;
      const updatedCarInfo = req.body;
      const query = { _id: new ObjectId(id) };
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
      const result = await carCollection.updateOne(query, update, options);
      res.send(result);
    });

    // Get car details by id
    app.get('/viewDetails/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carCollection.findOne(query);
      res.send(result);
    });

    // Get cars by userEmail
    app.get('/myCars', verifyToken , async (req, res) => {
      const userEmail = req.query.userEmail;
      const query = { userEmail: userEmail };

      console.log(req.cookies)

      
      const result = await carCollection.find(query).toArray();
      res.send(result);
    });

    // Book a car
    app.post('/myBookings',verifyToken, async (req, res) => {
      const bookCar = req.body;
      const result = await bookingCollection.insertOne(bookCar);
      res.send(result);
    });

    // Update booking
    app.put('/updateBooking/:id', async (req, res) => {
      const id = req.params.id;
      const updatedBooking = req.body;
      const query = { _id:(id) };
      try {
        const result = await bookingCollection.updateOne(query, { $set: updatedBooking });
        res.send(result);
      } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).send({ message: "Failed to update booking", error });
      }
    });

    // Get bookings by userEmail
    app.get('/myBookings', verifyToken, async (req, res) => {
      const userEmail = req.query.userEmail;
      const query = { userEmail: userEmail };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/myBookings/:id',async(req,res)=>{
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bookingCollection.findOne(query);
        res.send(result);
    })

    // Delete booking
    app.delete('/myBookings/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: (id) };
        try {
          const result = await bookingCollection.deleteOne(query);
          if (result.deletedCount > 0) {
            res.send({ message: "Booking deleted successfully", deletedCount: result.deletedCount });
          } else {
            res.status(404).send({ message: "No booking found with this ID" });
          }
        } catch (error) {
          console.error("Error deleting booking:", error);
          res.status(500).send({ message: "Failed to delete booking", error });
        }
      });
      

    // Basic setup
    app.get('/', (req, res) => {
      res.send('Car Rental Server is running');
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
