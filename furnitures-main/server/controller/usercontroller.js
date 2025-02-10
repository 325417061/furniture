const User = require("../models/User")
const Product = require("../models/Product")
const jwt = require('jsonwebtoken')
const Enum = ['custumer', 'admin']
const mongoose = require('mongoose')
const { use } = require("../routes/userRouts")

const getAllUsers = async (req, res) => {
    if (req.user.role === 'admin') {
        const users = await User.find({}, { password: 0 }).lean()
        if (!users?.length)
            return res.status(400).json("not found user")
        res.json(users)
    }
    else
        return res.status(401).json({ message: 'not athourized to craete product' })
}

const createNewUser = async (req, res) => {


    const { userName, password, name, email, phone } = req.body

    if (!userName || !password || !email) {
        return res.status(400).json(" username and password and name and email is required")
    }
    const userarr = await User.find({}, { password: 0 }).lean()
    let arr = userarr.map(u => u.userName === userName)
    if ((arr).find(a => a === true)) {
        return res.status(400).json("you already have such username")
    }
    const user = await User.create({ userName, password, name, email, phone })
    res.json(user)
}

const getUserById = async (req, res) => {
    const { _id } = req.params
    const user = await User.findById({ _id }, { password: 0 }).lean()
    if (!user) {
        return res.status(400).json(" not found user")
    }
    res.json(user)
}

const updateUser = async (req, res) => {
    const { _id, userName, password, name, email, phone, role, cart } = req.body

    if (req.user.role === 'admin') {

        if (!_id || !userName || !email)
            return res.status(400).json(" name and id is required")
    }
    else {
        if (!_id || !userName || !email || !password)
            return res.status(400).json(" name and id is required")
    }
    const user = await User.findById(_id, { password: 0 }).exec()
    if (!user)
        return res.status(400).json(" user not found")
    user.userName = userName ? userName : user.userName
    user.name = name ? name : user.name
    user.email = email ? email : user.email
    user.phone = phone ? phone : user.phone
    user.role = role ? role : user.role
    user.cart = cart ? cart : user.cart
    const myUpdateuser = await user.save()
    const userInfo = {
        _id: user._id, name: user.name,
        role: user.role, userName: user.userName, phone: user.phone,
        email: user.email
    }
    const accesToken = await jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET)
    res.json({ accesToken })
}


const addToCart = async (req, res) => {
    const { prod, qty } = req.body;

    if (!prod) {
        return res.status(400).json("Fields are required");
    }

    try {
        const user = await User.findById(req.user._id, { password: 0 });

        if (!user) {
            return res.status(400).json("User not found");
        }

        const validProd = new mongoose.Types.ObjectId(prod);
        let updatedCart = user.cart;

        const productIndex = user.cart.findIndex(item => item.prod.equals(validProd));

        if (productIndex != -1) {
            if (Number(qty) > 0) {
                updatedCart[productIndex].qty = Number(qty);
            } else {
                updatedCart = [
                    ...updatedCart.slice(0, productIndex),
                    ...updatedCart.slice(productIndex + 1)
                ];
            }
        } else {
            updatedCart.push({ prod: validProd, qty: 1 });
        }

        user.cart = updatedCart;
        const myUpdateUser = await user.save();

        const updatedUser = await User.findById(req.user._id, { password: 0 }).populate('cart.prod').lean();
        
        if (!updatedUser?.cart?.length) {
            return res.status(400).json("No products in cart");
        }

        res.json({
            message: "Cart updated successfully",
            cart: updatedUser.cart
        });
    } catch (error) {
        console.error(error);
        res.status(500).json("Internal Server Error");
    }
};








const getCart = async (req, res) => {
    const user = await User.findById(req.user._id, { password: 0 }).populate('cart.prod').lean()
    if (!user?.cart?.length)
        return res.status(400).json("no cart");
    console.log("cart*********************************", user.cart);
    res.json(user.cart)

}

const deleteUser = async (req, res) => {
    const { _id } = req.params
    const user = await User.findById(_id).exec()
    if (!user)
        return res.status(400).json(" not found user")
    const result = await user.deleteOne()
    res.json(result)

}



module.exports = {
    getAllUsers,
    createNewUser,
    getUserById,
    updateUser,
    deleteUser,
    addToCart,
    getCart
}