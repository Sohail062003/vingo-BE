import User from "../models/user.model.js";

class UserController {
  static async getCurrentUser(req, res) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(400).json({
          status: "fail",
          message: "userId not found",
          data: {},
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({
          status: "fail",
          message: "user not found",
          data: {},
        });
      }

      return res.status(200).json({
        status: 'Success',
        message: 'User find SuccessFully',
        data: {user}
      });

    } catch (error) {
      console.error("Error in Current User", error.message);
      return res.status(500).json({
        status: "fail",
        message: "getCurrentUser Internal Server Error",
        data: {},
      });
    }
  }
}

export default UserController;
