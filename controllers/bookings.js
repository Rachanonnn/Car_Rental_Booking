const Booking = require('../models/Booking');
const Car = require('../models/Car');

//@desc     GET all bookings
//@route    GET /api/v1/bookings
//@access   Public
exports.getBookings = async (req, res, next)=> {
    let query;
    //General users can see only their bookings
    if (req.user.role === 'user') {
        if (req.params.carId) {
            console.log(req.params.carId);
            query = Booking.find({ car: req.params.carId, user: req.user.id }).populate({
                path: 'car',
                select: 'car_brand car_model color license',
            }).populate({
                path: 'provider',
                select: 'name tel email'
            });
        } else {
            query = Booking.find({ user: req.user.id }).populate({
                path: 'car',
                select: 'car_brand car_model color license',
            }).populate({
                path: 'provider',
                select: 'name tel email'
            });
        }    
    } else if (req.user.role === 'provider') { // If you are a provider, you can see only booking that booked your car
        if (req.params.carId) {
            console.log(req.params.carId);
            query = Booking.find({ car: req.params.carId, provider: req.user.id }).populate({
                path: 'car',
                select: 'car_brand car_model color license',
            }).populate({
                path: 'user',
                select: 'name tel email'
            });
        } else {
            query = Booking.find({ provider: req.user.id }).populate({
                path: 'car',
                select: 'car_brand car_model color license',
            }).populate({
                path: 'user',
                select: 'name tel email'
            });
        }    
    } else { // If you are an admin, you can see all
        if (req.params.carId) {
            console.log(req.params.carId);
            query = Booking.find({car:req.params.carId}).populate({
                path: 'user',
                select: 'name tel email'
            }).populate({
                path: 'car',
                select: 'car_brand car_model color license',
            }).populate({
                path: 'provider',
                select: 'name tel email'
            });
        } else {
            query = Booking.find().populate({
                path: 'user',
                select: 'name tel email'
            }).populate({
                path: 'car',
                select: 'car_brand car_model color license',
            }).populate({
                path: 'provider',
                select: 'name tel email'
            });
        }
    }
    try {
        const bookings = await query;

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Cannot find Booking"});
    }
};

//@desc     GET single booking
//@route    GET /api/v1/bookings/:id
//@access   Private
exports.getBooking = async (req, res, next)=> {
    try {
        const booking = await Booking.findById(req.params.id).populate({
            path: 'car',
            select: 'car_brand car_model color license',
        }).populate({
            path: 'provider',
            select: 'name tel email'
        });
        if(!booking) {
            return res.status(404).json({success: false, message: `No booking with the id of ${req.params.id}`});
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error.stack);
        return res.status(500).json({success: false, message: "Cannot find Booking"});
    }
};

// @desc    Add bookings
// @route   POST /api/v1/cars/:carId/booking
// @access  Private
exports.addBooking = async (req,res,next) => {
    try {
        req.body.car = req.params.carId;
        const car = await Car.findById(req.params.carId);
        console.log(req.params.carId);
        if (!car) {
            return res.status(404).json({success:false, message: `No car with the id of ${req.params.carId}`});
        }

        //add userId & providerId from car to req.body
        if (req.user.role !== 'admin') {
            req.body.user = req.user.id;
            req.body.provider = car.provider;
        }

        //check for existed booking
        const existedBookings = await Booking.find({user: req.user.id});

        //if the user is not an admin, they can only create 3 booking
        if (existedBookings.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({success:false, message: `The user with ID  ${req.params.id} has already made 3 bookings`});
        }

        const booking = await Booking.create(req.body);
        res.status(201).json({
            success: true,
            data: booking
        });
    } catch(error) {
        console.log(error);
        return res.status(500).json({success:false,message: 'Cannot create Booking'});
    }
};

//@desc     Update booking
//@route    PUT /api/v1/bookings/:id
//@access   Private
exports.updateBooking = async (req, res, next)=> {
    try {
        let booking = await Booking.findById(req.params.id);

        if(!booking) {
            return res.status(404).json({success: false, message: `No booking with the id of ${req.params.id}`});
        }

        //Make sure user is the booking owner
        if(booking.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({success: false, message: `User ${req.user.id} is not authorized to update this booking`});
        }

        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({success: false, message: "Cannot update Booking"});
    }
};

//@desc     Delete booking
//@route    DELETE /api/v1/bookings/:id
//@access   Private
exports.deleteBooking = async (req, res, next)=> {
    try {
        const booking = await Booking.findById(req.params.id);

        if(!booking) {
            return res.status(404).json({success: false, message: `No booking with id ${req.params.id}`});
        }

        //Make sure user is the booking owner
        if(booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({success: false, message: `User ${req.user.id} is not authorized to delete this booking`});
        }

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.log(err.stack);
        return res.status(500).json({success: false, message: "Cannot delete booking"});
    }
};