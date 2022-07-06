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
        first: {type: String, required: true},
        last: {type: String, required: true}
    },
    encryption: {type: String, required: true},
    email: {type: String, required: true},
    blogs: {
        type: [{
            id: {type: String, required: true},
            name: {type: String, required: true},
            description: {type: String, required: true}
        }], 
        required: false, 
        default: []
    }
})

const BlogSchema = new Schema({
    _id: String,
    name: {type: String, required: true},
    description: {type: String, required: false},
    content: {type: String, required: true}
})

const NGOSchema = new Schema({
    _id: String,
    name: {type: String, required: true},
    timings: {
        start: {type: String, required: true},
        close: {type: String, required: true}
    },
    location: {
        lat: {type: Number, required: true},
        long: {type: Number, required: true}
    },
    phone: String,
    address: {
        line_1: {type: String, required: true},
        line_2: {type: String, required: true},
        city_village: {type: String, required: true},
        state: {type: String, required: true},
        pin_code: {type: Number, required: true}
    }
})

const user = model("user", UserSchema)
const blog = model("blog", BlogSchema)
const ngo = model("NGO", NGOSchema)

export {
    user, blog, ngo, UserBlogSchema
}