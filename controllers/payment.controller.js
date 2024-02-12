import AppError from "../Utilities/error.util.js";
import User from "../models/user.model.js";
import { razorpay } from "../server.js";
// import razorpay from '../server.js';




const getRazorpayApiKey = async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: 'Razorpay API key',
        key: process.env.RAZORPAY_KEY_ID
    })
}
const buySubscription = async (req, res, next) => {
    const { id } = req.user;

    const user = await User.findById(id);

    if (!user) {
        return next(new AppError('Unauthorised, please login', 400));
    }

    if (user.isAdmin === true) {
        return next(new AppError('Admin cannot purchase a subscription', 400));
    }

    const subscription = await razorpay.subscriptions.create({
        plan_id: process.env.RAZORPAY_PLAN_ID,
        customer_notify: 1
    });

    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Subscribed Successfully!',
        subscription_id: subscription.id
    })
}
const verifySubscription = async (req, res, next) => {
    const { id } = req.user;
    const { razorpay_payment_id, razorpay_signature, razorpay_subscription_id } = req.body;

    const user = await User.findById(id);
    if (!user) {
        return next(new AppError('Unauthorised, please login', 400));
    }
    if (user.isAdmin === true) {
        return next(new AppError('Admin cannot purchase a subscription', 400));
    }

    const subscriptionId = user.subscription.id;

    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_SIGNATURE)
        .update(`${razorpay_payment_id}|${subscriptionId}`)
        .digest('hex');

    if (generatedSignature !== razorpay_signature) {
        return (new AppError('Payment not verified , please try again', 500));
    }

    await Payment.create({
        razorpay_payment_id,
        razorpay_signature,
        razorpay_subscription_id
    });

    user.subscription.status = 'active';
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Payment verified successfully'
    });
}
const cancelSubscription = async (req, res, next) => {
    const { id } = req.user;

    const user = await User.findById(id);
    if (!user) {
        return next(new AppError('Unauthorised, please login', 400));
    }
    if (user.isAdmin === true) {
        return next(new AppError('Admin cannot purchase a subscription', 400));
    }

    const subscription_id = user.subscription.id;

    const subscription = await razorpay.subscriptions.cancel(subscription_id)

    user.subscription.status = subscription.status;

    await user.save();



}
const allPayments = async (req, res, next) => {
    const { count, skip } = req.query;

    const allPayments = await razorpay.subscriptions.all({
        count: count || 10,
        skip: skip ? skip : 0,
    })


    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    const finalMonths = {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
    };

    const monthlyWisePayments = allPayments.items.map((payment) => {
        const monthsInNumbers = new Date(payment.start_at + 1000);

        return monthNames[monthsInNumbers.getMonth()];
    })


    monthlyWisePayments.map((month) => {
        Object.keys(finalMonths).forEach((objMonth) => {
            if (month === objMonth) {
                finalMonths[month] += 1;
            }
        });
    });

    const monthlySalesRecord = [];

    Object.keys(finalMonths).forEach((monthName) => {
        monthlySalesRecord.push(finalMonths[monthName]);
    });

    res.status(200).json({
        success: true,
        message: 'All payments',
        allPayments,
        finalMonths
    });
}


export {
    getRazorpayApiKey, buySubscription, verifySubscription, cancelSubscription, allPayments
}