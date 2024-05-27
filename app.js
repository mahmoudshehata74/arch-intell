const express = require('express');
const bodyParser = require('body-parser');
const {graphqlHTTP} = require('express-graphql')
const mongoose = require('mongoose');
const multer = require('multer');
const graphQlSchema = require('./graphql/schema/index');
const graphQlResolvers = require('./graphql/resolvers/index');
const isAuth = require('./middleware/is-auth');
const path = require('path');
// const openai = require('openai');
const cors = require('cors');
// const openaiInstance = new openai.OpenAI(apiKey);
const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(isAuth);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());

app.use(
  '/graphql',
  graphqlHTTP({ // Updated function name
    schema: graphQlSchema,
    rootValue: graphQlResolvers,
    graphiql: true
  })
);


// async function generateImage() {
//   const response = await openai.createImage({
//     model: "dall-e-3",
//     prompt: "a white siamese cat",
//     n: 1,
//     size: "512x512",
//   });
  
//   const image_url = response.data.data[0].url;
//   console.log(image_url);
// }

// generateImage();

const PORT = 9595

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${
      process.env.MONGO_PASSWORD
    }@cluster0.uel56eo.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`
  )  .then(() => {
    app.listen(PORT); 
    console.log(`GraphQL API ready at http://localhost:${PORT}/graphql`);
    console.log("connected to database");
  })
  .catch(err => {
    console.log(err);
  });


// const express = require('express');


// const app = express();


// // Expose an additional API endpoint to receive data from Colab
// app.use(express.json());
// app.post('/data', (req, res) => {
//   // Process the data received from Colab, if necessary
//   console.log('Received data from Colab:', req.body);
//   res.send('Data received');
// });

// // Start the server
// app.listen(3000, () => {
//   console.log('Server started on port 3000');
// });


