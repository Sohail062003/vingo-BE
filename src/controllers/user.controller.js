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

  static async updateUserLocation(req, res) {
    try {
      const {lon, lat} = req.body;
      
      const user = await User.findByIdAndUpdate(req.userId, {
        location: {
          type: 'Point',
          coordinates: [lon, lat]
        }
      }, {new: true});

      if (!user) {
        return res.status(400).json({
          status: 'fail',
          message: 'User not found'
        });
      }

      return res.status(200).json({
        status: 'Success',
        message: 'location updated sucessfully'
      })
      
      

    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: `update user location | internal server error - ${error}`
      })
    }
  }

}

export default UserController;
