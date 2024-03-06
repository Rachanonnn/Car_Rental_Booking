const Car = require('../models/Car');
const User = require('../models/User');

//@desc   Get all cars
//@route  GET /api/v1/cars
//@access Public
exports.getCars = async (req, res, next) => {
  let query;

  const reqQuery = {...req.query};

  const removeField = ['select', 'sort', 'page', 'limit'];

  removeField.forEach(param => delete reqQuery[param]);
  // console.log(reqQuery);

  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  query = Car.find(JSON.parse(queryStr)).populate('bookings');
  
  if(req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  if(req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  }
  else {
    query = query.sort('-createAt');
  }

  try {
    const page = parseInt(req.query.page,10) || 1;
    const limit = parseInt(req.query.limit,10) || 25;
    const startIndex = (page-1)*limit;
    const endIndex = page*limit;
    const total = await Car.countDocuments();

    query = query.skip(startIndex).limit(limit);

    const cars = await query;

    const pagination = {};

    if(endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      }
    }
    if(startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      }
    }

    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars
    });
  } catch(err) {
    res.status(400).json({
      success: false
    });
  }
}

//@desc   Get single car
//@route  GET /api/v1/cars/:id
//@access Private
exports.getCar = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    res.status(200).json({
      success: true,
      data: car
    });
  } catch(err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


//@desc   Create new car
//@route  POST /api/v1/cars/
//@access Private
exports.createCar = async (req, res, next) => {
  const car = await Car.create({...req.body,provider: req.user.id});
  
  res.status(201).json({
    success: true,
    data: car
  })
}

//@desc   Update car
//@route  PUT /api/v1/cars/:id
//@access Private
exports.updateCar = async (req, res, next) => {
  try {
    let car = await Car.findById(req.params.id);

    if(!car)
      return res.status(404).json({
        success: false
      })

    if(req.user.role === 'user' || (car.provider.toString() !== req.user.id && req.user.role === 'provider')) {
      return res.status(401).json({
        success:false,
        message:`User ${req.user.id} is not authorized to update this car`
      })
    }
    
    car = await Car.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })

    res.status(200).json({
      success: true,
      data: car
    })
  } catch(err) {
    res.status(400).json({
      success: false
    })
  }
}

//@desc   Delete car
//@route  DELETE /api/v1/cars/:id
//@access Private
exports.deleteCar = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);

    if(!car)
      return res.status(400).json({
        success: false,
      })

    if(req.user.role === 'user' || (car.provider.toString() !== req.user.id && req.user.role === 'provider')) {
      return res.status(401).json({
        success:false,
        message:`User ${req.user.id} is not authorized to delete this car`
      });
    }
    
    await car.deleteOne();
    res.status(200).json({
      success: true,
      data: {}
    })
  } catch(err) {
    res.status(400).json({
      success: false
    })
  }
}
