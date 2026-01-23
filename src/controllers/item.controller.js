import Item from "../models/item.model.js";
import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";


class ItemController {

    static async getItemById(req, res) {
        try {
            const itemId = req.params.itemId
            const item = await Item.findById(itemId);

            if (!item) {
                return res.status(400).json({
                status: 'fail',
                message: 'Item not found'
            });
            }

            return res.status(200).json({
                status: 'success',
                message: 'Item found Sucessfully',
                data: {item}
            })

        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'get item by Id | Internal Server Error'
            })
        }
    }

    static async addItem(req, res) {
        try {
            const {name, category, foodType, price} = req.body;
            let image; 
            if (req.file) {
                image=await uploadOnCloudinary(req.file.path);
            }

            const shop = await Shop.findOne({owner:req.userId});
            if (!shop) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'shop not found'
                });
            }

            const item = await Item.create({
                name,
                category,
                foodType,
                price,
                image,
                shop:shop._id
            });

            shop.items.push(item._id);
            await shop.save();
            // await shop.populate("items owner");
            await shop.populate([
  { path: "owner" },
  { path: "items", options: { sort: { updatedAt: -1 } } }
]);


            return res.status(201).json({
                    status: 'success',
                    message: 'Item created successfully',
                    data: {shop}
                });

        } catch (error) {
            console.error("Add Item error - ", error);
            return res.status(500).json({
                status: 'error',
                message: 'Add item | Internal Server error'
            });
        }
    }

    static async editItem(req, res) {
        try {
            const itemId = req.params.itemId;
            const {name, category, foodType, price} = req.body;

            let image;
            if (req.file) {
                image=await uploadOnCloudinary(req.file.path);
            }

            const item = await Item.findByIdAndUpdate(itemId, {
                name, category, foodType, price, image
            }, {new: true});

            if (!item) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'item not found'
                });
            }
            // const shop = await Shop.findOne({owner: req.userId}).populate("items")
            const shop = await Shop.findOne({owner: req.userId}).populate({
                path: "items",
                options: {sort: {updatedAt: -1}}
            });

            return res.status(200).json({
                    status: 'success',
                    message: 'item edited successfully',
                    data: {shop}
                });


        } catch (error) {
            console.error('Edit Item error', error);
            return res.status(500).json({
                status: 'error',
                message: 'Edit item | Internal Server Error'
            })
        }
    }

    static async deleteItem(req, res) {
        try {
            const itemId = req.params.itemId;

            const item = await Item.findByIdAndDelete(itemId);
            if (!item) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'item not found',
                });
            }

            const shop = await Shop.findOne({owner: req.userId});
            shop.items=shop.items.filter(i => i._id !== item._id );
            await shop.save();
            await shop.populate({
                path: "items",
                options: {sort: {updatedAt: -1}}
            });

            return res.status(200).json({
                    status: 'sucess',
                    message: 'item deleted succuessfully',
                    data: {shop}
            });

        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: "Delete Item | internal Server Error"
            })
        }
    }
}


export default ItemController;