import multer from 'multer';
import path from "path";

const storage = multer.diskStorage({
    destination: (res, file, cb) => {
        // check the path if error occur
        cb(null, path.join(process.cwd()), '/public')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname)
    }
});

export const upload=multer({storage});



