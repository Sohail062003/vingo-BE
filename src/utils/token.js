import jwt from 'jsonwebtoken';


const genToken = async (userId) => {
    try {
        const token = await jwt.sign({userId}, process.env.JWT_SECRET, 
            {expiresIn: "1d"});
        return token;
    } catch (error) {
        console.error("Error generating token:", error);
        throw error;
    }
}


export default genToken;