import { Router } from 'express';
import { addLectureToCourseById, createCourse, getAllCourses, getLecturedByCourseId, removeCourse, updateCourse } from '../controllers/course.controller.js';
import { authorizeRoles, authorizedSubscriber, isLoggedIn } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';


const router = Router();


router.route('/')
    .get(getAllCourses)
    .post(
        // isLoggedIn,
        // authorizeRoles,
        upload.single('thumbnail'),
        createCourse
    );



router.route('/:id')
    .get(
        // isLoggedIn,
        // authorizedSubscriber,
        getLecturedByCourseId)
    .put(
        // isLoggedIn,
        // authorizeRoles,
        updateCourse
    )
    .delete(
        // isLoggedIn,
        // authorizeRoles,
        removeCourse
    )
    .post(
        // isLoggedIn,
        // authorizeRoles,
        upload.single('lecture'),
        addLectureToCourseById
    )
    ;
export default router;