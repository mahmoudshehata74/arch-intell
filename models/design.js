const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const DesignSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  
  username: String,
  model_type: String,
  description: {
    type: String,
    required: true
  },
  outputUrl2D: {
    type: String,
    required: false
  },
  outputUrl3D: {
    type: String,
    required: false
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  likes: [
    {
      username: String,
      createdAt: String
    }
  ],
  comments: [
    {
      comment: String,
      username: String,
      createdAt: String
    }
  ]
  ,
  createdAt: {
    type: Date,
    default: () => new Date()
  },
});

module.exports = mongoose.model('Design', DesignSchema);

