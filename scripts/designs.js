const readline = require('readline');
const axios = require('axios');

const query = `
query des {
  designs {
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

async function sendQueryRequest() {
  const headers = {
    'Authorization': token,
    'Content-Type': 'application/json'
  };

  const payload = {
    query: query
  };

  const response = await axios.post(serverUrl, payload, {
    headers: headers
  });

  return response.data;
}

async function main() {
  try {
    const response = await sendQueryRequest();
    console.log(response.data.designs);
  } catch (error) {
    console.error(error);
  }
}

main();