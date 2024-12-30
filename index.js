require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const port = 4000;

//Middleware
app.use(cors());
app.use(express.json());

// mongoDB Connection

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y1njy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const carCollection = client.db('Car_Collection_DB').collection('Car_Collection')
        // Connect the client to the server	(optional starting in v4.7)


        //Post Car data to server
        app.post('/addCar', async (req, res) => {
            const addCar = req.body;
            const result = await carCollection.insertOne(addCar);
            res.send(result)
        })


        // Get Car Data from server
        app.get('/addCar', async (req, res) => {
            const cursor = carCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        //delete car data based on id
        app.delete('/cars/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await carCollection.deleteOne(query);
            res.send(result)
        })

        // get car data for updating car info
        app.get('/updateCarInfo/:id',async(req,res)=>{
            const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await carCollection.findOne(query);
                res.send(result);
        })

        //update car info
        app.put('/updateCarInfo/:id',async(req,res)=>{
            const id = req.params.id;
            const query ={_id:new ObjectId(id)};
            const options = {upsert:true};
            const updatedCarInfo= req.body;
            const info= {
               
                $set:{
                    model:updatedCarInfo.model,
                    price:updatedCarInfo.price,
                    availability:updatedCarInfo.availability,
                    registrationNumber:updatedCarInfo.registrationNumber,
                    features:updatedCarInfo.features,
                    description:updatedCarInfo.description,
                    bookingCount:updatedCarInfo.bookingCount,
                    imageUrl: updatedCarInfo.imageUrl,
                    location:updatedCarInfo.location
                   
                }       
            }

            const result = await carCollection.updateOne(query, info, options);
            res.send(result)
        })

            // Get car data based on id for showing details
            app.get('/viewDetails/:id', async (req, res) => {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await carCollection.findOne(query);
                res.send(result);
            })

        //get car data based on userEmail 
        app.get('/myCars', async (req, res) => {
            const userEmail = req.query.userEmail;
            const query = { userEmail: userEmail };
            const result = await carCollection.find(query).toArray();
            res.send(result)
        })

        // basic setup
        app.get('/', (req, res) => {
            res.send('Car Rental Server is running')
        })



        await client.connect();
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
    console.log(`Car server is running on port ${port}`)
})