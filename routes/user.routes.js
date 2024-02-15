import { Router } from "express";
import { changePassword, forgotPassword, register, resetPassword, updateUser } from "../controllers/user.controller.js";
import { login } from "../controllers/user.controller.js";
import { logout } from "../controllers/user.controller.js";
import { getProfile } from "../controllers/user.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.post('/register', upload.single("avatar"), register); // * uploading single file
router.post('/login', login);
router.post('/logout', logout);

router.post(
    '/me/:id',
    isLoggedIn,
    getProfile);

router.post("/reset", forgotPassword)
router.post("/reset/:resetToken", resetPassword)


router.post("/change-password",
    isLoggedIn,
    changePassword)
router.put("/update/:id",
    isLoggedIn,
    upload.single("avatar"), updateUser)






export default router;
