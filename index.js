const express =require('express');
const cors = require('cors');
const  jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('mongodb');
require('dotenv').config()
const app =express();
const port = process.env.PORT || 5000;


console.log(process.env.DATA_USER)
console.log(process.env.DATA_PASS)

// middleware
app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DATA_USER}:${process.env.DATA_PASS}@cluster0.pcuge1b.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// create middelwar
const logger = async(req, res, next)=>{
  console.log('called :', req.host, req.originalUrl)
  next();
}

const verifyToken = async(req, res, next)=>{
  const token = req.cookies?.token;
  console.log('value of token in meddele ware',token)
  if(!token){
    return res.status(401).send({message: 'forbidden'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
 // error
    if(err){
      console.log(err)
      return res.status(401).send({message: 'forbidden'})
    }
    console.log('value in the token ', decoded)
    req.user =decoded;


    next();
  })
 
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // const serviceCollection = client.db('carDoctor').collection('services');
    const AssignmentCollection = client.db('GroupStudy').collection('createdAssignment');
    const TakenAssignmentCollection = client.db('GroupStudy').collection('takenAssignment');
    const submitionsCollection = client.db('GroupStudy').collection('submitions');


    app.post('/jwt',logger, async(req, res)=>{
      const user = req.body;
      console.log(user)
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET, {
        expiresIn:'1h'
      })
      res
      .cookie('token', token, {
        httpOnly:true,
        secure:false,
        
      })
      .send({success: true});

    })
// 
    app.get('/assignments',logger, async (req, res) => {
      
       try{
        console.log('token are',req.cookies.token)
        const Assignments = await AssignmentCollection.find().toArray();
        res.send(Assignments);
       }
       catch(err){
        console.log(err)
       }
    })
    app.get('/assignments/:id',logger, verifyToken, async(req,res)=>{

      try{
        const id = req.params.id;
      const query ={_id: new ObjectId(id)} 
      const result =await AssignmentCollection.findOne(query);
      res.send(result)
      }catch(err){
        console.log(err);
      }
      
    })
   
    app.post('/takenAssignment',logger,verifyToken, async (req, res) => {
      const body = req.body;
      console.log(body);
      //   res.send({ res: body });
      const result = await TakenAssignmentCollection.insertOne(body);
      res.send(result);
    });
    app.get('/takenAssignment',logger,verifyToken, async (req, res) => {
      
      try{
       const Assignments = await TakenAssignmentCollection.find().toArray();
       res.send(Assignments);
      }
      catch(err){
       console.log(err)
      }
   })
//    app.get('/submition', async (req, res) => {
      
//     try{
//      const Assignments = await submitionsCollection.find().toArray();
//      res.send(Assignments);
//     }
//     catch(err){
//      console.log(err)
//     }
//  })
   app.get('/takenAssignment/:id',logger, verifyToken ,async(req,res)=>{

    try{
      const id = req.params.id;
    const query ={_id: new ObjectId(id)} 
    const result =await TakenAssignmentCollection.findOne(query);
    res.send(result)
    }catch(err){
      console.log(err);
    }
    
  })
    app.get("/mytakenAssignment",logger,verifyToken, async (req, res) => {
      try {
        const query = { gotUserEmail: req.query?.email };

        if (req.query?.email) {
          const taken = await TakenAssignmentCollection.find(query).toArray();
          res.send(taken);
        } else {
          res.send([]);
        }
      } catch (err) {
        console.log(err);
      }
    });


    app.post('/assignments',logger, async (req, res) => {
        const assignment = req.body;
        console.log(assignment);
        const result = await AssignmentCollection.insertOne(assignment);
        res.send(result);
    });
    app.post('/submition',logger, async (req, res) => {
      const assignment = req.body;
      console.log(assignment);
      const result = await submitionsCollection.insertOne(assignment);
      res.send(result);
  });
  app.get("/submition",logger,verifyToken, async (req, res) => {
    console.log('valid user', req.user.email)
    if(req.query.email !== req.user.email)
    return res.status(403).send({message: 'fobeden89'})
    try {
    
      const query = { ownerEmail: req.query?.email };

      if (req.query?.email) {
        const taken = await submitionsCollection.find(query).toArray();
        res.send(taken);
      } else {
        res.send([]);
      }
    } catch (err) {
      console.log(err);
    }
  });
  app.get('/submition/:id',logger,verifyToken, async(req,res)=>{

    try{
      const id = req.params.id;
    const query ={_id: new ObjectId(id)} 
    const result =await submitionsCollection.findOne(query);
    res.send(result)
    }catch(err){
      console.log(err);
    }
    
  })
  app.put('/submition/:id',logger, async(req,res)=>{
    const id = req.params.id;
    const query ={_id: new ObjectId(id)};
    const updatAssignment = req.body;
    console.log(updatAssignment);
    const updateDoc = {
      $set: {
       ...updatAssignment
      },

    };
    
    const result = await submitionsCollection.updateOne(query,updateDoc);
    res.send(result);

     
  })
    app.get('/assignments',logger, verifyToken, async (req, res) => {
          console.log(req.query.email);
          let query = {};
          if (req.query?.email) {
              query = { email: req.query.email }
          }
          const result = await AssignmentCollection.find(query).toArray();
          res.send(result);
      })

      app.delete('/assignments/:id',logger, async(req,res)=>{
        const id = req.params.id;
        const query ={_id: new ObjectId(id)}
        const result = await AssignmentCollection.deleteOne(query)
        res.send(result)
      })
      app.patch('/mytakenAssignment/:id', logger, async(req,res)=>{
        const id = req.params.id;
        const filter ={_id: new ObjectId(id)};
        const updattakeAssignment = req.body;
        console.log(updattakeAssignment);
        const updateDoc = {
          $set: {
            Status:updattakeAssignment.Status
          },

        };
        
        const result = await TakenAssignmentCollection.updateOne(filter,updateDoc);
        res.send(result);

         
      })


      app.put('/assignments/:id',logger, async(req,res)=>{
        const id = req.params.id;
        const query ={_id: new ObjectId(id)};
        const updatAssignment = req.body;
        console.log(updatAssignment);
        const updateDoc = {
          $set: {
           ...updatAssignment
          },

        };
        
        const result = await AssignmentCollection.updateOne(query,updateDoc);
        res.send(result);

         
      })

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
