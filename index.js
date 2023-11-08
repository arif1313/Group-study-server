const express =require('express');
const cors = require('cors');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('mongodb');
require('dotenv').config()
const app =express();
const port = process.env.PORT || 5000;


console.log(process.env.DATA_USER)
console.log(process.env.DATA_PASS)

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DATA_USER}:${process.env.DATA_PASS}@cluster0.pcuge1b.mongodb.net/?retryWrites=true&w=majority`;

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
    // const serviceCollection = client.db('carDoctor').collection('services');
    const AssignmentCollection = client.db('GroupStudy').collection('createdAssignment');

    app.get('/assignments', async (req, res) => {
      
       try{
        const Assignments = await AssignmentCollection.find().toArray();
        res.send(Assignments);
       }
       catch(err){
        console.log(err)
       }
    })
    app.get('/assignments/:id',async(req,res)=>{

      try{
        const id = req.params.id;
      const query ={_id: new ObjectId(id)} 
      const result =await AssignmentCollection.findOne(query);
      res.send(result)
      }catch(err){
        console.log(err);
      }
      
    })

    app.post('/assignments', async (req, res) => {
        const assignment = req.body;
        console.log(assignment);
        const result = await AssignmentCollection.insertOne(assignment);
        res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('server is running')
})

app.listen(port, () => {
    console.log(` Server is running on port ${port}`)
})
