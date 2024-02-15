// import { json } from "express";
import AppError from "../Utilities/error.util.js";
import User from "../models/user.model.js";
import cloudinary from "cloudinary"

import fs from 'fs/promises'

import { sendEmail } from "../Utilities/sendEmail.js";
import crypto from 'crypto';


const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7days'
    httpOnly: true,
    // secure: true
}


const register = async (req, res, next) => {
    try {
        const { fullName, email, password, isAdmin } = req.body;

        if (!fullName || !email || !password) {
            return next(new AppError('All fields are required', 400))
        }

        const userExists = await User.findOne({ email });


        if (userExists) {
            return next(new AppError('Email Already exists', 400));
        }

        const user = await User.create({
            fullName,
            email,
            password,
            avatar: {
                public_id: email,
                secure_url: 'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg'
            },
            isAdmin
        })

        if (!user) {
            return next(new AppError('User Registeration failed, please try again later', 400))
        }

        // TODO: File Upload

        console.log("File Details --> ", JSON.stringify(req.file));

        if (req.file) {
            console.log(req.file)
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms',
                    width: 250,
                    height: 250,
                    gravity: 'faces',
                    crop: 'fill'
                });
                console.log(`result: ${result}`)
                if (result) {
                    user.avatar.public_id = result.public_id
                    user.avatar.secure_url = result.secure_url

                    // remove file from server
                    fs.rm(`uploads/${req.file.filename}`)
                }
            }
            catch (error) {
                return next(new AppError(error || 'File not uploaded, please try again', 500))

            }
        }

        await user.save();

        const token = await user.generateJWTToken()

        user.password = undefined; // dont send back password to user



        res.cookie  ('token', token, cookieOptions);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user,
        })
    } catch (error) {

        return next(new AppError(error || 'User registration failed, please try again', 500))
    }


};
const login = async (req, res, next) => {

    const { email, password } = req.body;

    try {
        if (!password) {
            return next(new AppError('All fields are required', 400))
        }
        // by default we find some record in db if it has password it doesnt return it, but when we use .select('+password'); it also returns password

        const user = await User.findOne({ email }).select('+password'); // if user exists then give me his/her password


        // const user = await User.findOne({ "email":email },{"_id":0,"password":1,"email":1}); // if user exists then give me his/her password
        // console.log("user->",user)

        if (!user) {
            return next(new AppError('Email doesnt exist!', 400))
        }
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return next(new AppError('Incorrect Password!', 400))
        }

        const token = await user.generateJWTToken();

        user.password = undefined


        // res.cookie('token', token, cookieOptions);

        res.status(200).json({
            success: true,
            message: 'User loggedIn successfully',
            user,
            token
        });
    }
    catch (e) {
        return next(new AppError(e.message, 500));
    }
};
const logout = (req, res) => {
    res.cookie('token', null, {
        secure: true,
        httpOnly: true,
        maxAge: 0
    })

    res.status(200).json({
        success: true,
        message: "User Logged out successfully"
    })
};
const getProfile = async (req, res,next) => {
    try {
        const {id} = req.params;
        // console.log(userId)

        const user = await User.findById(id);

        res.status(200).json({
            success: true,
            message: 'User details',
            user
        })
    }
    catch (e) {
        return next(new AppError('Failed to fetch Profile Details', 500))
    }


};

const forgotPassword = async (req, res, next) => {
    let { email } = req.body;
    if (email == " ") {
        return next(new AppError('Email is required', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('Email is not registered', 400));
    }

    const resetToken = await user.generatePasswordResetToken();

    // console.log(`resetToken: ${resetPassword}`);
    await user.save();

    let emailId = email.split(".com")[0];


    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}${emailId}`;


    console.log(resetPasswordURL)


    const subject = 'Forgot Password'
    const message = `you can reset your password by clicking <a href=${resetPasswordURL} target = '_blank'>Reset Your Password</a>\n If the above link doesn't work for some reason then copy paste this link in new tab ${resetPasswordURL}.`


    try {
        await sendEmail(email, subject, message);
        res.status(200).json({
            success: true,
            message: `Reset password token has been sent to ${email} sucessfully`
        })

    } catch (error) {


        //! IMPORTANT
        //? if it fails to send email , then for security purpose we define them as undefined

        //? and also to eliminate the confusion if user tries to forgot password once again, and get the same token again and what if it got expired


        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined;


        await user.save();

        return next(new AppError(error.message, 500));
    }
}
const resetPassword = async (req, res, next) => {

    const { resetToken } = req.params;

    const { password } = req.body;


    if (password == " ") {
        return next(new AppError('Password is required', 400));
    }

    const forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');


    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: { $gt: Date.now() }
    });


    if (!user) {
        return next(new AppError('Token is invalid or expired, please try again', 400));
    }

    user.password = password;


    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save();


    res.status(200).json({
        success: true,
        message: 'Password changed successfully!!'
    })

}

const changePassword = async (req, res, next) => {

    const { oldPassword, newPassword } = req.body;

    if (oldPassword == " " || newPassword == " ") {
        return next(new AppError('All fields are mandatory', 400));
    }


    const { id } = req.user;


    const user = await User.findById(id).select('+password');

    if (!user) {
        return next(new AppError('User Doesnt Exist', 400));
    }

    const isPasswordValid = await user.comparePassword(oldPassword);


    if (!isPasswordValid) {
        return next(new AppError('Invalid old password', 400));

    }

    user.password = newPassword;

    await user.save();

    user.password = undefined;

    res.status(200).json({
        success: true,
        message: 'Password Changed Successfully!'
    })

}

const updateUser = async (req, res, next) => {

    const { fullName } = req.body;
    // const id = req.user.id;
    const { id } = req.params;

    const user = await User.findById(id);

    console.log("user:: ", user)
    if (!user) {
        next(new AppError('User doesnot exist', 400));
    }

    if (fullName) { // If the request consist of fullname then update existing users fullname...

        user.fullName = fullName;
    }

    // console.log("req: ", req)
    // console.log("file: ", req.file)

    if (req.file) {
        console.log(req.file)
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
                width: 250,
                height: 250,
                gravity: 'faces',
                crop: 'fill'
            });
            console.log(`result: ${result}`)
            if (result) {
                user.avatar.public_id = result.public_id
                user.avatar.secure_url = result.secure_url

                // remove file from server
                fs.rm(`uploads/${req.file.filename}`)
            }
        }
        catch (error) {
            return next(new AppError(error || 'File not uploaded, please try again', 500))
        }
    }


    await user.save();

    console.log("user: ", user);

    res.status(201).json({
        success: true,
        message: 'User details updated successfully'
    })
}
export {
    register, login, logout, getProfile, forgotPassword, resetPassword, changePassword, updateUser
}