import mongoose from "mongoose";

const Schema = mongoose.Schema
const model = mongoose.model

const UserBlogSchema = {
    _id: String,
    name: String,
    description: String
}

/**
 * The default structure for the name of the user in the collection
 * @typedef {Object} NameOfUser
 * @property {String} first The first name of the user
 * @property {String=} last The last name of the user
 */
/**
 * The default user schema used in overall the API
 * @typedef {Object} User The user object
 * @property {String} _id The id of the user in the collection
 * @property {NameOfUser} name The name of the user that is saved in the collection
 * @property {String} email The email of the user that is in the collection
 * @property {UserBlogSchema[]} blogs The Array of blogs written by the user
*/


/**
 * The default format for Emergency Contacts of the user.
 * @typedef {Object} EmergencyContact The emergency contact of the user
 * @property {Number} _id The priority of user with which the emergency contact is related to.
 * @property {String} name The name of the emergency contact
 * @property {String} relation The relationship of the emergency contact of the user
 * @property {String} phone The phone number of the emergency contact
 * @property {String} email The email of the emergency contact
 */
const EmergencyContactSchema = {
    _id: Number,
    name: String,
    relation: String,
    phone: String,
    email: String
}

const UserSchema = new Schema({
    _id: String,
    name: {
        first: {type: String, required: true},
        last: {type: String, required: true, default: ""}
    },
    encryption: {type: String, required: true},
    email: {type: String, required: true},
    blogs: {
        type: [{
            _id: {type: String, required: true},
            name: {type: String, required: true},
            description: {type: String, required: true}
        }], 
        required: false, 
        default: []
    },
    emergencyContacts: [{
        _id: Number, required: true,
        name: String, required: true,
        relation: String, required: true, default: "family",
        phone: String, required: true,
        email: String, required: true
    }]
})

/**
 * The default blog schema user in overall code
 * @typedef {Object} Blog
 * @property {String} _id The id of the blog which is in the format of "userName__blog__1"
 * @property {String} name The name of the blog written by the user
 * @property {String=} description The description of the blog written by the user
 * @property {String} content The content of the blog written by the user
*/

const BlogSchema = new Schema({
    _id: String,
    name: {type: String, required: true},
    description: {type: String, required: false, default: ""},
    content: {type: String, required: true}
})

/**
 * The timings of the NGO
 * @typedef {Object} TimingsOfNGO
 * @property {String} start The start time of the NGO in the format of "HH:mm"
 * @property {String} close The close time of the NGO in the format of "HH:mm"
 * @property {String} days The working days of the NGO in the format of "Mon-Sat" (Case sensitive)
*/
/**
 * The location of the NGO
 * @typedef {Object} LocationOfNGO
 * @property {Number} lat The latitude of the NGO location (-90<=lat<=90)
 * @property {Number} long The longitude of the NGO location (-180<=long<=180)
*/
/**
 * The address of the NGO
 * @typedef {Object} AddressOfNGO
 * @property {String} line_1 The line 1 address of the NGO
 * @property {String} line_2 The line 2 address of the NGO
 * @property {Object} city_village The city or village in which the NGO is located
 * @property {String} state The state in which the NGO is located
 * @property {Number} pin_code The pin code of the location of the NGO
*/
/**
 * The default NGO schema used in overall code
 * @typedef {Object} NGO 
 * @property {String} _id The id of the NGO 
 * @property {String} name The name of the NGO
 * @property {TimingsOfNGO} timings The timings of the NGO
 * @property {LocationOfNGO} location The location of the NGO
 * @property {String} phone The contact number of the NGO in international format (+911234567890)
 * @property {String} email The email Id of the NGO
 * @property {AddressOfNGO} address The address of the NGO
*/

const NGOSchema = new Schema({
    _id: String,
    name: {type: String, required: true},
    timings: {
        start: {type: String, required: true, default: "09:00"},
        close: {type: String, required: true, default: "18:00"},
        days: {type: String, required: true, default: "Mon-Sat"}
    },
    location: {
        lat: {type: Number, required: true},
        long: {type: Number, required: true}
    },
    phone: String,
    email: {type: String, required: true},
    address: {
        line_1: {type: String, required: true},
        line_2: {type: String, required: true, default: ""},
        city_village: {type: String, required: true},
        state: {type: String, required: true},
        pin_code: {type: Number, required: true}
    }
})

const user = model("user", UserSchema)
const blog = model("blog", BlogSchema)
const ngo = model("NGO", NGOSchema)

export {
    user, blog, ngo, UserBlogSchema, EmergencyContactSchema
}