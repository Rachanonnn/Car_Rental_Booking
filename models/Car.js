const mongoose = require('mongoose');
const CarSchema = new mongoose.Schema({
  car_brand: {
    type: String,
    required: [true, 'Please add a brand'],
    maxlength: [50, 'Brand can not be more than 50 characters']
  },
  car_model: {
    type: String,
    required: [true, 'Please add a model'],
    maxlength: [50, 'Model can not be more than 50 characters']
  },
  color: {
    type: String,
    required: [true, 'Please add a color'],
  },
  license: {
    type: String,
    required: [true, 'Please add a license'],
    unique: true,
    maxlength: [10, 'License can not be more than 10 characters'],
  },
  provider: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
      type: Date,
      default: Date.now
  }
},
{
  JSON: {virtuals:true},
  toObject: {virtuals:true}
})

CarSchema.pre('deleteOne', {document:true, query:false}, async function(next) {
  console.log(`Bookings being removed from car ${this._id}`);
  await this.model('Booking').deleteMany({car: this._id});
  next();
})

// Reverse populate with virtuals
CarSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'car',
  justOne: false
})

module.exports = mongoose.model('Car', CarSchema);

