const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json())
require('dotenv').config()

//  job-poral    
//  a8xTSjJwPLpEQ29f
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.ejjfp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// const uri = "mongodb+srv://job-poral:a8xTSjJwPLpEQ29f@cluster0.ejjfp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    
    // jobs related 
    const jobsCollection = client.db('jobPortal').collection('jobs');
    const jobsApplicationCollection = client.db('jobPortal').collection('job-applications');

    app.get('/jobs', async (req, res) => {
        const cursor = jobsCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await jobsCollection.findOne(query);
      res.send(result);
    })
    
    app.get('/job-applications', async (req, res) => {
      const email = req.query.email;
      const query = {email : email}
      const result = await jobsApplicationCollection.find(query).toArray();
      res.send(result);
    })
    
    app.post('/job-applications', async (req, res) => {
      const application = req.body;
      const result = await jobsApplicationCollection.insertOne(application);
      res.send(result);
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Job Portal Live !')
})

app.listen(port, () => {
  console.log(`Job Portal Live on port ${port}`)
})