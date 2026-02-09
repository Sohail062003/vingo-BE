import Order from "../models/order.model.js";
import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";

class OrderController {
  static async placeOrder(req, res) {
    try {
      const { cartItems, paymentMethod, deliveryAddress, totalAmount } =
        req.body;

      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({
          status: "fail",
          message: "Cart is empty",
        });
      }

      if (
        !deliveryAddress.text ||
        !deliveryAddress.latitude ||
        !deliveryAddress.longitude
      ) {
        return res.status(400).json({
          status: "fail",
          message: "Send complete delivery address",
        });
      }

      const groupItemByShop = {};

      cartItems.forEach((item) => {
        const shopId = item.shop; // id
        if (!groupItemByShop[shopId]) {
          groupItemByShop[shopId] = [];
        }
        groupItemByShop[shopId].push(item);
      });

      const shopOrders = await Promise.all(
        Object.keys(groupItemByShop).map(async (shopId) => {
          const shop = await Shop.findById(shopId).populate("owner");
          if (!shop) {
            return res.status(400).json({
              status: "fail",
              message: "shop not found",
            });
          }

          const items = groupItemByShop[shopId];
          const subTotal = items.reduce(
            (sum, i) => sum + Number(i.price) * Number(i.quantity),
            0,
          );
          return {
            shop: shop._id,
            owner: shop.owner._id,
            subTotal,
            shopOrderItems: items.map((i) => ({
              item: i.id,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
            })),
          };
        }),
      );

      const newOrder = await Order.create({
        user: req.userId,
        paymentMethod,
        deliveryAddress,
        totalAmount,
        shopOrders: shopOrders,
      });


      if (!newOrder) {
        return res.status(400).json({
          status: "fail",
          message: "Order creation failed",
        });
      }

      return res.status(201).json({
        status: "success",
        message: "Order placed successfully",
        data: { newOrder },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Place Order | Internal Server Error",
      });
    }
  }

  static async getMyOrders(req, res) {
     try {
        const user = await User.findById(req.userId);
        if (!user) {
          return res.status(400).json({
            status: "fail",
            message: "User not found",
          });
        }

        if (user.role == "user") {

          const orders = await Order.find({user: user._id})
          .sort({ createdAt: -1 })
          .populate("shopOrders.shop", "name")
          .populate("shopOrders.owner", "name email mobile") 
          .populate("shopOrders.shopOrderItems.item", "name image price");
  
          if (!orders) {
            return res.status(400).json({
              status: "fail",
              message: "orders not found",
            });
          }
  
          return res.status(200).json({
            status: "success",
            message: "User orders fetched successfully",
            data: { orders },
          });

        } else if (user.role == "owner") {
        //   const orders = await Order.find({"shopOrders.owner": req.userId})
        // .sort({ createdAt: -1 })
        // .populate("shopOrders.shop", "name")
        // .populate("user") 
        // .populate("shopOrders.shopOrderItems.item", "name image price");


        const orders = await Order.aggregate([
    // 1️⃣ Match orders where this owner exists
    {
      $match: {
        "shopOrders.owner": user._id
      }
    },

    // 2️⃣ Populate USER
    {
      $lookup: {
        from: "users",              // collection name
        localField: "user",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    },

   

    // 3️⃣ Filter shopOrders ONLY for this owner
    {
      $addFields: {
        shopOrders: {
          $filter: {
            input: "$shopOrders",
            as: "shopOrder",
            cond: { $eq: ["$$shopOrder.owner", user._id] }
          }
        }
      }
    },

    // 4️⃣ Sort latest first
    {
      $sort: { createdAt: -1 }
    }
  ]);

//   const orders = await Order.aggregate([
//   // 1️⃣ Match orders for this owner
//   {
//     $match: {
//       "shopOrders.owner": user._id
//     }
//   },

//   // 2️⃣ Populate USER
//   {
//     $lookup: {
//       from: "users",
//       localField: "user",
//       foreignField: "_id",
//       as: "user"
//     }
//   },
//   { $unwind: "$user" },

//   // 3️⃣ Keep ONLY this owner's shopOrders
//   {
//     $addFields: {
//       shopOrders: {
//         $filter: {
//           input: "$shopOrders",
//           as: "shopOrder",
//           cond: { $eq: ["$$shopOrder.owner", user._id] }
//         }
//       }
//     }
//   },

//   // 4️⃣ Unwind shopOrders (needed for item lookup)
//   { $unwind: "$shopOrders" },

//   // 5️⃣ Unwind shopOrderItems
//   { $unwind: "$shopOrders.shopOrderItems" },

//   // 6️⃣ Populate ITEMS
//   {
//     $lookup: {
//       from: "items", // ⚠️ collection name
//       localField: "shopOrders.shopOrderItems.item",
//       foreignField: "_id",
//       as: "itemDetails"
//     }
//   },
//   { $unwind: "$itemDetails" },

//   // 7️⃣ Attach item details
//   {
//     $addFields: {
//       "shopOrders.shopOrderItems.item": {
//         _id: "$itemDetails._id",
//         name: "$itemDetails.name",
//         image: "$itemDetails.image",
//         price: "$itemDetails.price"
//       }
//     }
//   },

//   // 8️⃣ Cleanup
//   { $project: { itemDetails: 0 } },

//   // 9️⃣ Group back (VERY IMPORTANT)
//   {
//     $group: {
//       _id: "$_id",
//       paymentMethod: { $first: "$paymentMethod" },
//       totalAmount: { $first: "$totalAmount" },
//       user: { $first: "$user" },
//       createdAt: { $first: "$createdAt" },
//       shopOrders: { $push: "$shopOrders" }
//     }
//   },

//   // 🔟 Sort
//   { $sort: { createdAt: -1 } }
// ]);


      // const filteredOrders = orders.map((order=> ({
      //     _id:order._id,
      //     paymentMethod:order.paymentMethod,
      //     user: order.user,
      //     shopOrders:order.shopOrders.find(o=>o.owner._id == req.userId),
      //     createdAt:order.createdAt
      // })))

        if (!orders) {
          return res.status(400).json({
            status: "fail",
            message: "orders not found",
          });
        }

        return res.status(200).json({
          status: "success",
          message: "Owner orders fetched successfully",
          data: { orders },
        });
      }

     } catch (error) {
       return res.status(500).json({
         status: "error",
         message: "Get User Orders | Internal Server Error",
       });
     }
  }

  


}

export default OrderController;
