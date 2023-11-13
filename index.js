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
  origin:['http://localhost:5174'],
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
const logger = (req, res, next) =>{
  console.log('log: info', req.method, req.url);
  next();
}

const verifyToken = (req, res, next) =>{
  const token = req?.cookies?.token;
  // console.log('token in the middleware', token);
  // no token available 
  if(!token){
      return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
      if(err){
          return res.status(401).send({message: 'unauthorized access'})
      }
      req.user = decoded;
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
    const featureCollection = client.db('GroupStudy').collection('features');
    const TakenAssignmentCollection = client.db('GroupStudy').collection('takenAssignment');
    const submitionsCollection = client.db('GroupStudy').collection('submitions');


    app.post('/jwt', async(req, res)=>{
      const user = req.body;
      console.log(user)
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET, {
        expiresIn:'1h'
      })
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    })
        .send({ success: true });
     
    })
    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logging out', user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
  })

// 
// get all assignment
    app.get('/assignments', async (req, res) => {
      
       try{
        // console.log('token are',req.cookies.token)
        const Assignments = await AssignmentCollection.find().toArray();
        res.send(Assignments);
       }
       catch(err){
        console.log(err)
       }
    })
    app.get('/features', async (req, res) => {
      
      try{
       // console.log('token are',req.cookies.token)
       const Assignments = await featureCollection.find().toArray();
       res.send(Assignments);
      }
      catch(err){
       console.log(err)
      }
   })
    // get assignment by id
    app.get('/assignments/:id',  async(req,res)=>{

      try{
        const id = req.params.id;
      const query ={_id: new ObjectId(id)} 
      const result =await AssignmentCollection.findOne(query);
      res.send(result)
      }catch(err){
        console.log(err);
      }
      
    })
// get assignment by deficulty 
app.get('/findassignments/:defiqulty',  async(req,res)=>{

  try{
    const Defiqulty = req.params.defiqulty;
  const query ={Difficulty: Defiqulty} 
  const result =await AssignmentCollection.find(query);
  res.send(result)
  }catch(err){
    console.log(err);
  }
  
})
  //  post a assignmnet insert Taken a da in  TakenAssignmentCollection
    app.post('/takenAssignment', async (req, res) => {
      const body = req.body;
      console.log(body);
      //   res.send({ res: body });
      const result = await TakenAssignmentCollection.insertOne(body);
      res.send(result);
    });
    // get all taken assignment
    app.get('/takenAssignment', async (req, res) => {
      
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

// get taken assignment by id
   app.get('/takenAssignment/:id', async(req,res)=>{

    try{
      const id = req.params.id;
    const query ={_id: new ObjectId(id)} 
    const result =await TakenAssignmentCollection.findOne(query);
    res.send(result)
    }catch(err){
      console.log(err);
    }
    
  })
  // get taken assignment by query email gotUserEmail
    app.get("/mytakenAssignment",logger,verifyToken, async (req, res) => {
      console.log('token owner info', req.user)
     
      try {
        if(req.user.email !== req.query.email){
          return res.status(403).send({message: 'forbidden access'})
        }
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

// create a assignment  
    app.post('/assignments', async (req, res) => {
        const assignment = req.body;
        console.log(assignment);
        const result = await AssignmentCollection.insertOne(assignment);
        res.send(result);
    });
    // add a submittion in submitionsCollection
    app.post('/submition', async (req, res) => {
      const assignment = req.body;
      console.log(assignment);
      const result = await submitionsCollection.insertOne(assignment);
      res.send(result);
  });
 
      // get  a submittion in submitionsCollection  by email in qury 
  app.get("/submition", async (req, res) => {
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
// get submition by id parama 
  app.get('/submition/:id', async(req,res)=>{

    try{
      const id = req.params.id;
    const query ={_id: new ObjectId(id)} 
    const result =await submitionsCollection.findOne(query);
    res.send(result)
    }catch(err){
      console.log(err);
    }
    
  })
  // get submit assignment by submiedMail
  app.get("/marksubmition", async (req, res) => {
    try {
      const query = { submiedMail: req.query?.email };

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
  // app.get('/marksubmition/:id', async(req,res)=>{

  //   try{
  //     const id = req.params.id;
  //   const query ={submitionAssId: id} 
  //   const result =await submitionsCollection.findOne(query);
  //   res.send(result)
  //   }catch(err){
  //     console.log(err);
  //   }
    
  // })

// update a submition by id 

  app.put('/submition/:id', async(req,res)=>{
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

  
// update a submition by query email
    app.get('/assignments',  async (req, res) => {
          console.log(req.query.email);
          let query = {};
          if (req.query?.email) {
              query = { email: req.query.email }
          }
          const result = await AssignmentCollection.find(query).toArray();
          res.send(result);
      })
// delet assignment 
      app.delete('/assignments/:id', async(req,res)=>{
        const id = req.params.id;
        const query ={_id: new ObjectId(id)}
        const result = await AssignmentCollection.deleteOne(query)
        res.send(result)
      })
      // update taken assignmet statuse

      app.patch('/mytakenAssignment/:id',  async(req,res)=>{
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

      // update a assignmetn 
      app.put('/assignments/:id', async(req,res)=>{
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
