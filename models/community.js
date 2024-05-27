const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    design: {
      type: Schema.Types.ObjectId,
      ref: 'Design'
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: () => new Date()
    }
  },
  { timestamps: true }

);

module.exports = mongoose.model('Community', bookingSchema);