const { buildSchema } = require('graphql');

module.exports = buildSchema(`
type Community {
    designs: [Design!]!
}

type Design {
  _id: ID!
  title: String!
  description: String!
  outputUrl2D: String
  outputUrl3D: String
  model_type: String
  creator: User
  comments: [Comment]!
  likes: [Like]!
  createdAt: String
}


type Comment{
  _id: ID!
  comment: String!
  username: String
  createdAt: String
}

type Like {
  id: ID!
  createdAt: String!
  username: String!
}

type User {
  _id: ID!
  email: String!
  password: String
  username: String!
  createdDesigns: [Design]
  image: String
  followings: [User]
  followers :[User]
}

type AuthData {
  username: String
  userId: ID!
  token: String!
  tokenExpiration: Int!
}

input DesignInput {
  model_type: String
  title: String!
  description: String!
}

input UserInput {
  username: String!
  email: String!
  password: String!
}

type Image {
  id: ID!
  text: String!
  imageUrl: String!
}

type RootQuery {
    designs: [Design!]!  
    searchDesignTitle(title:String!): [Design!]!
    searchDesignId(designId:ID!): Design!
    createdDesigns(userId:ID!): [Design!]!
    users: [User!]!
    searchUser(userName: String!): User!
    login(email: String!, password: String!): AuthData!
    followers(userID: ID!):[User!]
    followings(userID: ID!):[User!]
}

type RootMutation {
    createDesign(designInput: DesignInput): Design!
    deletDesign(designId: String!): Design!
    editDesign(designID:ID, description: String!): Design!
    likeDesign(designId: ID!): Design!
    unLikeDesign(designId:ID!): Design!
    addComment(designId: ID!, comment: String!): Design!
    deleteComment(designId: ID!, commentId: ID!): Design!
    followUser(userId: ID!): User!
    unFollowUser(userId: ID!) : User!
    createUser(userInput: UserInput): User!
    uploadProfilePhoto(userId:ID , photo: String!): User
}

schema {
    query: RootQuery
    mutation: RootMutation
}
`);