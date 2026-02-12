import { stat } from "fs";
import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

class ShopController {
  static async createEditShop(req, res) {
    try {
      const { name, city, state, address } = req.body;

        // Auth check
      if (!req.userId) {
        return res.status(401).json({
          status: "fail",
          message: "Unauthorized",
        });
      }

      let uploadedImage;

      if (req.file) {
        const cloudinaryRes= await uploadOnCloudinary(req.file.path);
         if (!cloudinaryRes) {
          return res.status(400).json({
            status: "fail",
            message: "Image upload failed",
          });
        }

        uploadedImage = cloudinaryRes;
      }

      let shop = await Shop.findOne({ owner: req.userId });

      // create   
      if (!shop) {

        // Validation
        if (!name || !city || !state || !address) {
            return res.status(400).json({
            status: "fail",
            message: "All fields are required",
            });
        }
        shop = await Shop.create({
          name,
          city,
          state,
          address,
          image:uploadedImage,
          owner: req.userId,
        });

        if (!shop) {
          return res.status(400).json({
            status: "fail",
            message: "Shop creation failed",
          });
        }

        await shop.populate("owner items");

        return res.status(200).json({
          status: "success",
          message: "Shop created successfully",
          data: { shop },
        });

      } 

        const updatePayload = {
        name,
        city,
        state,
        address,
      };

      if (uploadedImage) {
        updatePayload.image = uploadedImage;
      }

        shop = await Shop.findByIdAndUpdate(
          shop._id,
          updatePayload,
          { new: true },
        ); 

        if (!shop) {
          return res.status(400).json({
            status: "fail",
            message: "Shop Edit failed",
          });
        }
      
      return res.status(200).json({
        status: "Success",
        message: "Shop updated successfully",
        data: { shop }
      });
    } catch (error) {
      console.error("createEditShop error - ", error);
      return res.status(500).json({
        status: "error",
        message: "createEditShop | Internal Server Error",
      });
    }
  }

  static async getMyShop(req, res) {
    try {
    
      const shop =await Shop.findOne({owner:req.userId}).populate({
        path: "items",
        options: {sort: {updatedAt: -1}}
      })
      
      if (!shop) {
        return res.status(200).json({
          status: 'success',
          message: 'Shop not created yet',
        });
      }

      return res.status(200).json({
          status: 'success',
          message: 'Shop found successfully',
          data: {shop}
        });
    } catch (error) {
      console.error("getMyShop error - ", error);
      return res.status(500).json({
        status: 'error',
        message: 'getMyShop | Internal Server Error'
      })
    }
  }

  static async getShopByCity(req, res) {
    try {
  
     const {city} = req.params; 
     const shops = await Shop.find({
      city: {$regex: new RegExp(`^${city}$`, 'i')}
     }).populate("items");
     if (!shops) {
      return res.status(404).json({
        status: 'fail',
        message: 'No Shops found in this city'
      });
     }

     return res.status(200).json({
      status: 'success',
      message: 'Shop fetched successfully',
      data: {shops}
     });
 
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'getShopByCity | Internal Server Error'
      });
    }
  }


}

export default ShopController;
