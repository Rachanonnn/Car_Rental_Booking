const express = require('express')
const {getCars, getCar, createCar, updateCar, deleteCar} = require('../controllers/cars')

const bookingRouter = require('./bookings')

const router = express.Router()

const {protect, authorize} = require('../middleware/auth')

router.use('/:carId/bookings/', bookingRouter)

router.route('/').get(getCars).post(protect, authorize('provider', 'admin'), createCar)
router.route('/:id').get(getCar).put(protect, authorize('provider', 'admin'), updateCar).delete(protect, authorize('provider', 'admin'), deleteCar)

module.exports = router;