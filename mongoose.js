import mongoose from "mongoose";

const Schema = mongoose.Schema
const model = mongoose.model

const UserBlogSchema = {
    id: String,
    name: String,
    description: String
}

const UserSchema = new Schema({
    _id: String,
    name: {
        first: String,
        last: String
    },
    encryption: String,
    email: String,
    blogs: Array(UserBlogSchema)
})

const BlogSchema = new Schema({
    _id: String,
    name: String,
    description: String,
    content: String
})

const NGOSchema = new Schema({
    _id: String,
    name: String,
    timings: {
        start: String,
        close: String
    },
    location: {
        lat: Number,
        long: Number
    },
    phone: String,
    address: {
        line_1: String,
        line_2: String,
        city_village: String,
        state: String,
        pin_code: Number
    }
})

const user = model("user", UserSchema)
const blog = model("blog", BlogSchema)
const ngo = model("NGO", NGOSchema)

export {
    user, blog, ngo, UserBlogSchema
}