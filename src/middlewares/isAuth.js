import jwt from 'jsonwebtoken'

const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(400).json({
                status: 'fail',
                message: 'Token not found',
                data: {}
            });
        }

        const decodeToken = jwt.verify(token, process.env.JWT_SECRET);
        if (!decodeToken) {
            return res.status(400).json({
                status: 'fail',
                message: 'Token not verify',
                data: {}
            });
        }
        req.userId = decodeToken.userId
        next();
    } catch (error) {
        console.error("isAuth error", error)
        return res.status(500).json({
                status: 'fail',
                message: 'isAuth Internal Server error',
                data: {}
            });
    }
}

export default isAuth;