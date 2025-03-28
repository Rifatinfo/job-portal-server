const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');

const app = express()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors({
  origin : ["http://localhost:5175/"],
  credentials : true
}));
app.use(cookieParser())
app.use(express.json())
require('dotenv').config()

const verifyToken = (req, res, next) =>{
  const token = req.cookie?.token;
  if(!token){ 
     return res.status(401).send({message : "UnAuthories Access"})
  }
  jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , (err, decoded) =>{
    if(err){
      return res.status(401).send({message : "UnAuthories Access"})
    }
    req.user = decoded
    next();
  })
}

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
        const email = req.query.email;
        let query = {};
        if(email){
          query = {hr_email : email}
        }
        const cursor = jobsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await jobsCollection.findOne(query);
      res.send(result);
    })
    
    app.post('/jobs', async (req, res) =>{
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    })

    app.get('/job-applications', verifyToken , async (req, res) => {
      const email = req.query.email;
      const query = {email : email}
      const result = await jobsApplicationCollection.find(query).toArray();
      if(req.user.email !== req.query.email){
        return res.status(403).send({message : 'forbidden access'})
      }
      for(const application of result){
        console.log(application.job_id); 
        const query1 = {_id : new ObjectId(application.job_id)}
        const job = await jobsCollection.findOne(query1)
        if(job){
          application.title = job.title;
          application.company = job.company;
          application.company_logo = job.company_logo;
        }       
      }
      res.send(result);
    })

    app.get('/job-application-all', async(req, res) => {
      const cursor =  await jobsApplicationCollection.find().toArray();
      res.send(cursor)
    })

    app.get('/job-applications/jobs/:_id', async (req, res) => {
      const id = req.params._id;
      const query = {_id : id}
      const result = await jobsApplicationCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn : '5h'
      });
      res.cookie('token', token , {
        httpOnly : true,
        secure : false
      })
      .send({success : true})
    })

    app.post('/logout', (req, res) => {
      res.clearCookie('token', {
        httpOnly : true,
        secure : false
      })
      .send({success : true})
    })
    
    app.post('/job-applications', async (req, res) => {
      const application = req.body;
      const result = await jobsApplicationCollection.insertOne(application);

     
      const id = application.job_id;
      const query = {_id : new ObjectId(id)}
      const job = await jobsCollection.findOne(query)
      let newCount = 0;
      if(job.applicationCount){
        newCount = job.applicationCount + 1;
      }
      else {
        newCount = 1;
      }
      
      // now update the job info 
      const filter = {_id : new ObjectId(id)}
      const updatedDoc = {
        $set : {
          applicationCount : newCount
        }
      }

      const updateResult = await jobsCollection.updateOne(filter,updatedDoc);
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