import User from "../models/user.model.js";


class AuthService {

    static async signUp(userData) {
        try {
            const user = User.create(userData);
            return user;
        } catch (error) {
            throw error;
        }
    }

}

export default AuthService;