import path from "path";
import multer from "multer";

const upload = multer({
    dest: "uploads/",
    limits: { filesize: 50 * 1024 * 1024 }, // * 50 mb

    storage: multer.diskStorage({
        destination: "uploads/",
        filename: (_req, file, callback) => {
            callback(null, file.originalname);
        }
    }),
    fileFilter: (_req, file, callback) => {
        let ext = path.extname(file.originalname);
        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.webp' && ext !== '.png' && ext !== '.mp4'
        ) {
            callback(new Error(`Unsupported file type! ${ext}`), false);
            return;
        }
        callback(null, true);
    },
});

export default upload;