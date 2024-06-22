const mongoose = require('mongoose');

const Schema = mongoose.Schema;

  const userSchema = new Schema({
    username:{
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    createdDesigns: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Design'
      }
    ],
    image:{
      type: String,
      required: false
    },
    // interacted:{
    //   likes: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'Design'
    //   },
    //   comments: [{
    //     type: Schema.Types.ObjectId,
    //     ref: 'Design'
    //   }]
    // },
    followers:{

      type: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }]
    },
    followings:{
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }]
    }
    

  });

  module.exports = mongoose.model('User', userSchema);