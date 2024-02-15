import AppError from "../Utilities/error.util.js";
import jwt from 'jsonwebtoken'


const isLoggedIn = async (req, res, next) => {

    const { token } = req.body;
    console.log("req. body :: ", req.body);
    console.log(`token:${token}`)



    if (!token) {
        return next(new AppError('Unauthenticated, please login again', 400))
    }

    const userDetails = await jwt.verify(token, process.env.JWT_SECRET);

    req.user = userDetails;
    next();
}

const authorizeRoles = () => async (req, res, next) => {
    // console.log('roles: ',roles)
    // console.log('req.user.role: ',req.user.role)

    // console.log('req.user.role[1]: ',temp)
    // console.log('isAdmin: ',roles.includes(temp))

    const temp = req.user.isAdmin

    if (temp) {
        return next(
            new AppError("You do not have permission to view this route", 403)
        );
    }

    next();
};

const authorizedSubscriber = async (req, res, next) => {
    const subscription = req.user.subscription;
    const currentRole = req.user.isAdmin;

    if (currentRole && subscription.status !== 'active') {

        return (next(new AppError('please subscribe to access the lectures.', 403)))
    }


}

export {
    isLoggedIn, authorizeRoles, authorizedSubscriber
}
