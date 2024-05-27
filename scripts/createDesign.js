const readline = require('readline');
const axios = require('axios');

const mutation = `
mutation CreateDesign($designInput: DesignInput!) {
  createDesign(designInput: $designInput) {
    _id
    title
    description
    model_type
    outputUrl2D
    outputUrl3D
    creator {
      _id
      username
      email
      image
    }
    comments {
      _id
      comment
      username
      createdAt
    }
    likes {
      id
      createdAt
      username
    }
    createdAt
  }
}
`;

const serverUrl = 'http://localhost:9595/graphql';
const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imhhd2FyeSIsInVzZXJJZCI6IjY1ZDI0MjE5NmE1MjE1ZDI3M2Q1MDNlOSIsImVtYWlsIjoiaGF3YXJ5QGNzLmNvbSIsImlhdCI6MTcxNDc2NzIwNn0.z66G7FDp1_QK7TBbPUhIWEWWYTcEDMHUUL0M-e2K3_0';

async function sendMutationRequest(designInput) {
  const headers = {
    'Authorization': token,
    'Content-Type': 'application/json'
  };

  const variables = {
    designInput: designInput
  };

  const payload = {
    query: mutation,
    variables: variables
  };

  const response = await axios.post(serverUrl, payload, {
    headers: headers
  });

  return response.data;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter the model type: ', (modelTypeInput) => {
    rl.question('Enter the title: ', (titleInput) => {
      rl.question('Enter the description: ', (descriptionInput) => {
        const designInput = {
          model_type: modelTypeInput,
          title: titleInput,
          description: descriptionInput
        };

        sendMutationRequest(designInput)
          .then((response) => {
            console.log(response);
            rl.close();
          })
          .catch((error) => {
            console.error(error);
            rl.close();
          });
      });
    });
  });
}

main();











// const { ApolloClient, InMemoryCache, gql } = window['@apollo/client'];

// const CREATE_DESIGN_MUTATION = gql`
//   mutation CreateDesign($designInput: DesignInput!) {
//     createDesign(designInput: $designInput) {
//       _id
//       title
//       description
//       model_type
//       outputUrl2D
//       outputUrl3D
//       creator {
//         username
//         _id
//       }
//       comments {
//         _id
//         comment
//         username
//         createdAt
//       }
//       likes {
//         id
//         createdAt
//         username
//       }
//       createdAt
//     }
//   }
// `;

// const client = new ApolloClient({
//   uri: 'http://localhost:9595/graphql',
//   cache: new InMemoryCache()
// });

// const form = document.getElementById('graphql-form');
// const responseDiv = document.getElementById('response');

// form.addEventListener('submit', async (event) => {
//   event.preventDefault();

//   const modelType = document.getElementById('model-type').value;
//   const title = document.getElementById('title').value;
//   const description = document.getElementById('description').value;

//   try {
//     const { data } = await client.mutate({
//       mutation: CREATE_DESIGN_MUTATION,
//       variables: {
//         designInput: {
//           model_type: modelType,
//           title: title,
//           description: description
//         }
//       }
//     });

//     responseDiv.textContent = `Design created with ID: ${data.createDesign._id}`;
//   } catch (error) {
//     responseDiv.textContent = `Error: ${error.message}`;
//   }
// });

