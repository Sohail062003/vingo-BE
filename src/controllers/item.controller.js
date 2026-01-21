import Item from "../models/item.model.js";
import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";


class ItemController {
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

            return res.status(201).json({
                    status: 'success',
                    message: 'Item created successfully',
                    data: {item}
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

            if (!Item) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'item not found'
                });
            }

            return res.status(200).json({
                    status: 'success',
                    message: 'item edited successfully',
                    data: {item}
                });


        } catch (error) {
            console.error('Edit Item error', error);
            return res.status(500).json({
                status: 'error',
                message: 'Edit item | Internal Server Error'
            })
        }
    }
}


export default ItemController;