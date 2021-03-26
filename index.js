const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wp8tr.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const port = 5000;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

var serviceAccount = require("./configs/burj-al-arab-6d876-firebase-adminsdk-d9d3i-2cb72aa708.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.status(200).send('Hello World!');
})

client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  })

  app.get('/bookings', (req, res) => {
    console.log(req.headers.authorization);

    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      console.log({ idToken });
      // idToken comes from the client app
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          // const uid = decodedToken.uid;
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          // console.log(tokenEmail, queryEmail);
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              })
          }
          else{
            res.status(401).send('unauthorized access');
          }
          // ...
        })
        .catch((error) => {
          res.status(401).send('unauthorized access');
        });

    }
    else{
      res.status(401).send('unauthorized access');
    }

  })

});


app.listen(port, () => {
  console.log(`app listening port at http://localhost:${port}`);
})