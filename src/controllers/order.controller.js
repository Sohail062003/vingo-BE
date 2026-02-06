import Order from "../models/order.model.js";
import Shop from "../models/shop.model.js";

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

      console.log("NEW ORDER", newOrder);

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
}

export default OrderController;
