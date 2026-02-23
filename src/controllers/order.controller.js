import Order from "../models/order.model.js";
import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import DeliveryAssignment from "../models/deliveryAssignment.model.js"

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

      await newOrder.populate("shopOrders.shopOrderItems.item", "name image price");
      await newOrder.populate("shopOrders.shop","name");

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
          .populate("shopOrders.shopOrderItems.item", "name image price")

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
          const ownerOrders = await Order.find({"shopOrders.owner": req.userId})
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("user") 
        .populate("shopOrders.shopOrderItems.item", "name image price")
        .populate("shopOrders.assignedDeliveryBoy", "fullName mobile");


  //       const orders = await Order.aggregate([
  //   // 1️⃣ Match orders where this owner exists
  //   {
  //     $match: {
  //       "shopOrders.owner": user._id
  //     }
  //   },

  //   // 2️⃣ Populate USER
  //   {
  //     $lookup: {
  //       from: "users",              // collection name
  //       localField: "user",
  //       foreignField: "_id",
  //       as: "user"
  //     }
  //   },
  //   {
  //     $unwind: "$user"
  //   },

   

  //   // 3️⃣ Filter shopOrders ONLY for this owner
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

  //   // 4️⃣ Sort latest first
  //   {
  //     $sort: { createdAt: -1 }
  //   }
  // ]);




      const orders = ownerOrders.map((order=> ({
          _id:order._id,
          paymentMethod:order.paymentMethod,
          user: order.user,
          deliveryAddress: order.deliveryAddress,
          totalAmount: order.totalAmount,
          shopOrders:order.shopOrders.find(o=>o.owner._id == req.userId),
          createdAt:order.createdAt
      })))

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

  static async updateOrderStatus(req, res) {
    try {
      const { orderId, shopId } = req.params;
      const {status} = req.body;

      const order = await Order.findById(orderId);
      
      const shopOrder = order.shopOrders.find(o=>o.shop==shopId);
      if (!shopOrder) {
        return res.status(400).json({
          status: "fail",
          message: "shop order not found"
        })
      }

      shopOrder.status = status;
      let deliveryBoysPlayload=[];
      
      if (status === "out of delivery" && !shopOrder.assignment) {
        const { longitude, latitude } = order.deliveryAddress;
        const nearByDeliveryBoys = await User.find({
          role: "deliveryBoy",
          location: {
            $near: {
              $geometry: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
              $maxDistance: 5000    // 5km
            }
          }
        });

        const nearByIds = nearByDeliveryBoys.map(b => b._id);
        const busyIds = await DeliveryAssignment.find({
          assignedTo: {$in:nearByIds},
          status: {$nin: ["brodcasted","completed"]}
        }).distinct("assignedTo")

        const busyIdSet = new Set(busyIds.map(id=>String(id)));

        const availableBoys = nearByDeliveryBoys.filter(b=>!busyIdSet.has(String(b._id)))

        const candidates = availableBoys.map(b=> b._id);

        if (candidates.length == 0) {
          await order.save();
          return res.json({
            message: "Order status updated but there is  no available delivery boys"
          })

        }

        const deliveryAssignment = await DeliveryAssignment.create({
            order: order._id,
            shop:shopOrder.shop,
            shopOrderId: shopOrder.id,
            brodcastedTo: candidates,
            status: "brodcasted"
        })
        shopOrder.assignedDeliveryBoy=deliveryAssignment.assignedTo
        shopOrder.assignment=deliveryAssignment._id
        deliveryBoysPlayload=availableBoys.map(b=> ({
          id: b._id,
          fullName: b.fullName,
          longitude: b.location.coordinates?.[0],
          latitude: b.location.coordinates?.[1],
          mobile: b.mobile
        }))
      }
      
      await shopOrder.save();
      await order.save();
      const updatedShopOrder = order.shopOrders.find(o=>o.shop==shopId)

      await order.populate("shopOrders.shop", "name")
      await order.populate("shopOrders.assignedDeliveryBoy", "fullName email mobile")


      return res.status(200).json({
        shopOrder:updatedShopOrder,
        assignedDeliveryBoy: updatedShopOrder?.assignedDeliveryBoy,
        availableBoys: deliveryBoysPlayload,
        assignment: updatedShopOrder?.assignment?._id
      });
      
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: `update order status | Internal Server Error${error}`
      });
    }
  }

  static async getDeliveryBoyAssignment(req, res) {
    try {
      const deliveryBoyId = req.userId;
      const assignments = await DeliveryAssignment.find({
        brodcastedTo: deliveryBoyId,
        status: "brodcasted"
      })
      .populate("order")
      .populate("shop")

      const formated = assignments.map(a=> ({
        assignmentId: a._id,
        orderId: a.order._id,
        shopName: a.shop.name,
        deliveryAddress: a.order.deliveryAddress,
        items: a.order.shopOrders.find(so=> so._id.equals(a.shopOrderId))?.shopOrderItems || [],
        subTotal: a.order.shopOrders.find(so=> so._id.equals(a.shopOrderId))?.subTotal
      }))

      return res.status(200).json(formated)
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: `get Delivery Boy Assignment | Internal Server Error ${error}`
      })
    }
  }

  static async acceptOrder(req, res) {
    try {
      const { assignedId } = req.params;
      console.log("assignemt",assignedId);
      const assignment = await DeliveryAssignment.findById(assignedId);
      if (!assignment) {
        return res.status(400).json({
          status: "fail",
          message: "assignment not found"
        });
      }
      
      if (assignment.status !=="brodcasted"){
        return res.status(400).json({
          status: "fail",
          message: "assignment is exprired"
        });
      }

      const alreadyAssigned = await DeliveryAssignment.findOne({
        assignedTo: req.userId,
        status: {$nin:["brodcasted", "completed"]}
      })

      if (alreadyAssigned) {
        return res.status(400).json({
          status: "fail",
          message: "already assigned to another order"
        });
      }

      assignment.assignedTo= req.userId
      assignment.status='assigned'
      assignment.acceptedAt=new Date()
      await assignment.save();

      const order = await Order.findById(assignment.order)
      if (!order) {
        return res.status(400).json({
          status: 'fail',
          message: 'order not found'
        })
      }

      const shopOrder = order.shopOrders.find(so=>so.id == assignment.shopOrderId)
      shopOrder.assignedDeliveryBoy=req.userId;
      await order.save()
      
      await order.populate('shopOrders.assignedDeliveryBoy')

      return res.status(200).json({
        message:'order Accepted'
      })

    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: `accept order | Internal Server Error ${error}`
      })
    }
  }

  static async getCurrentOrder(req, res) {
    try {
      const assignment = await DeliveryAssignment.findOne({
        assignedTo: req.userId,
        status: "assigned"
      })
      .populate("shop", "name")
      .populate("assignedTo", "fullName email mobile location")
      .populate({
        path: "order",
        populate:[{path: "user",select: "fullName email location mobile"}]
      });

      if (!assignment) {
        return res.status(400).json({
          status: 'fail',
          message: "assignment  not  found"
        });
      }
      if (!assignment.order) {
        return res.status(400).json({
          status: 'fail',
          message: "order  not  found"
        });
      }

      const shopOrder = assignment.order.shopOrders.find(so => String(so._id) == String(assignment.shopOrderId))

      if (!shopOrder) {
        return res.status(400).json({
          status: 'fail',
          message: "Shop order  not  found"
        });
      }


      let deliveryBoyLocation= {lat:null, lon:null}
      if (assignment.assignedTo.location.coordinates.length==2) {
        deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates[0];
        deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates[1];
      } 
      
      let customerLocation = {lat:null, lon:null}
      if (assignment.order.deliveryAddress) {
        customerLocation.lat  = assignment.order.deliveryAddress.latitude;
        customerLocation.lon  = assignment.order.deliveryAddress.longitude;
      }


      return res.status(200).json({
        _id:assignment.order._id,
        user: assignment.order.user,
        shopOrder,
        deliveryAddress:assignment.order.deliveryAddress,
        deliveryBoyLocation,
        customerLocation
      })


    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: `get current order | internal server error ${error}`
      });
    }
  }


}

export default OrderController;
