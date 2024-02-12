import AppError from "../Utilities/error.util.js";
import Course from "../models/course.model.js";
import cloudinary from 'cloudinary';
import fs from 'fs/promises';

const getAllCourses = async (req,res, next) => {

    try {
        const courses = await Course.find().select('-lectures');
        console.log("courses: ",courses)

        res.status(201).json({
            success: true,
            message: 'All Courses',
            courses
        });

    } catch (error) {
        console.log("reached.....")
        return next(new AppError(error.message, 500));
    }
}
const getLecturedByCourseId = async (res, req, next) => {

    try {
        const { id } = req.params;

        const course = await Course.findById(id);

        if (!course) {
            return next(new AppError('Invalid Course Id', 400));
        }

        res.status.json({
            success: true,
            message: 'Course lectures fetched successfully',
            lectures: course.lectures
        });

    } catch (error) {
        return next(new AppError(error.message, 500));
    }
}

const createCourse = async (req, res, next) => {
    const { title, description, category, createdBy } = req.body;

    if (!title || !description || !category || !createdBy) {
        return next(new AppError('All fields are required', 400));
    }

    const course = await Course.create({
        title,
        description,
        category,
        createdBy,
        thumbnail: {
            public_id: 'Dummy',
            secure_url: 'Dummy'
        }
    })

    if (!course) {
        return next(new AppError('Course couldnot be created', 500));
    }

    if (req.file) {
        // console.log('reached!!!!!!!!!!!!!!!!!!!')
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms'
            });

            if (result) {
                course.thumbnail.public_id = result.public_id;
                course.thumbnail.secure_url = result.secure_url;

                fs.rm(`uploads/${req.file.filename}`);
            }
        } catch (error) {
            return next(new AppError(error.message, 500));
        }
    }


    await course.save();

    res.status(200).json({
        success: true,
        message: 'Course Created successfully',
        course
    });
}
const updateCourse = async (req, res, next) => {
    try {

        const { id } = req.params;

        const course = await Course.findByIdAndUpdate(
            id,
            {
                $set: req.body
            },
            {
                runValidators: true, //? new data is correct or not according defined schema
                new: true, //? to get updated value in response JSON 
            }
        )

        if (!course) {
            return next(new AppError('Course with given id doesnot exist', 500))
        }

        res.status(200).json({
            success: true,
            message: 'Course Updated successfully!!',
            course
        })

    } catch (error) {
        return next(new AppError(error.message, 500));

    }
}
const removeCourse = async (req, res, next) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);

        if (!course) {
            return next(new AppError('Course with given id doesnot exist', 500))
        }

        await course.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Course Deleted Successfully'
        })
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
}

const addLectureToCourseById = async (req, res, next) => {
    const { title, description } = req.body;

    const { id } = req.params;

    if (!title || !description) {
        return next(new AppError('All fields are required', 400))
    }
    const course = await Course.findById(id);

    if (!course) {
        return next(new AppError('Course with given id doesnot exist', 500))
    }

    const lectureData = {
        title,
        description,
        lecture:{}
    };
    if (req.file) {
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms'
            });

            if (result) {
                lectureData.lecture.public_id = result.public_id;
                lectureData.lecture.secure_url = result.secure_url;

                fs.rm(`uploads/${req.file.filename}`);
            }
        } catch (error) {
            return next(new AppError(error.message, 500));
        }

    }

    course.lectures.push(lectureData);

    course.numberOfLectures = course.lectures.length;

    await course.save();

    res.status(200).json({
        success:true,
        message:"Lecture successfully added to the course",
        course
    })
}

export {
    getAllCourses, getLecturedByCourseId, createCourse, updateCourse, removeCourse, addLectureToCourseById
}


