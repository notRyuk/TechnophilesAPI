import mongoose from "mongoose";
import axios from "axios";

import { user, blog, ngo, UserBlogSchema, emergency } from "./mongoose.js";
import { DB_URL } from "./config.js";
import { searchBlog, stateList } from "./helpers.js";


Object.prototype.keys = () => Object.keys(this)
Object.prototype.values = () => Object.values(this)

try {
    mongoose.connect(`${DB_URL}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
}
catch {
    console.log("Not able to connect to the database")
}



class CollectionObject {

    /**
     * The parent class of all the classes in mentioned in the documentation
     * @param {String} id The ID of document in the collection that is specified
     * @param {mongoose.Model} col The mongoose model of the Collection that is to be specified
     */
    constructor(id, col) {
        this.id = id
        this.col = col
    }

    /**
     * Verifies if the user exists in the database
     * @returns Boolean
     */
    async verify() {
        return (await this.col.findById(this.id))
    }

    __removeVersionInfo(obj) {
        delete obj.__v
    }

    /**
     * 
     * @returns Array<User|Blog|NGO> Objects
     */
    async findAll() { 
        return await this.col.find()
    }

    /**
     * 
     * @param {String} id ID of the User | Blog | NGO in the database
     * @returns User|Blog|NGO Object from the database
     */
    async findById(id) {
        var obj = this.col.findById(id)
        if(!obj) {
            return
        }
        this.__removeVersionInfo(obj)
        return obj
    }

    async extractids() {
        return (await this.col.find()).map(__doc => __doc._id)
    }

    /**
     * Checks if mentioned email is valid according to the international email format.
     * @param {String} email The email ID to check the validation 
     * @returns Boolean
     */
    isEmailValid(email) {
        return /^[a-z0-9_\.-]+\@[a-z0-9\-]+\.[a-z]+/.test(email)
    }

    /**
     * Checks if a username is already present in a given collection or not and returns a boolean.
     * @param {String} username The username to check with the database collection
     * @returns Boolean
     */
    async usernameAlreadyExists(username) {
        return Boolean((await this.findAll()).filter(__obj => __obj._id === username).length)
    }

    /**
     * Checks if a phone number is valid or not.
     * @param {String} phone The phone number that is to be validated
     * @returns Boolean
     */
    isPhoneValid(phone) {
        return /^\+91([0-9]){10}$/.test(phone)
    }

    /**
     * Takes the phone with the database and checks if it is already used or not
     * @param {String} phone The phone number that is to be checked with the database
     * @returns Boolean
     */
    async phoneAlreadyExists(phone) {
        return Boolean((await this.findAll()).filter(__obj => __obj.phone === phone).length)
    }

    /**
     * Takes an email input of an email address and checks if it already used or not
     * @param {String} email The email that is to be checked checked with the database
     * @returns Boolean
     */
    async emailAlreadyExists(email) {
        return Boolean((await this.findAll()).filter(__obj => __obj.email === email).length)
    }
}

/**
 * The definition of the miniature of Blog object that is stored in the user collection.
 * @typedef {Object} UserBlogSchema The miniature version of the blog stored in the user collection for faster access
 * @property {String} _id The id of the blog that is to be stored.
 * @property {String} name The name of the blog that is to be stored.
 * @property {String=} description The description of the blog that is to be stored.
 */
/**
 * The default error object that is used over all the code.
 * @typedef {Object} Error The default error object
 * @property {Number} status The HTTP status code of the error
 * @property {String!} error The error that is generated
 * @property {String!} comment A possible fix that can be done for the error occurred
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
class UserObject extends CollectionObject {
    /**
     * The main class for all the user collection operations that can be done with the users or volunteers.
     * @param {String} id ID of the user to be saved in the database
     * @param {String=} firstName First Name of the user to be saved in the database
     * @param {String=} lastName Last Name of the user to be saved in the database
     * @param {String=} encryption Password of the user to be saved in the database
     * @param {String=} email Email of the user to be saved in the database
     * @param {Array<UserBlogSchema>=} blogs List of Simplified blogs to be saved in the database
     * @param {Array<EmergencyContact>=} emergencyContacts The list of emergency contact of the user. (Max length of the list should not exceed 3) 
     */
    constructor(id, firstName, lastName, encryption, email, blogs, emergencyContacts) {
        super(id, user)

        this.col = user
        this.id = id
        this.firstName = firstName
        this.lastName = lastName
        this.encryption = encryption
        this.email = email
        this.blogs = blogs
        this.emergencyContacts = emergencyContacts

        this.doc = {
            _id: this.id,
            name: {
                first: this.firstName,
                last: this.lastName,
            },
            email: this.email,
            encryption: this.encryption,
            blogs: this.blogs,
            emergencyContacts: emergencyContacts
        }
    }

    async create() {
        var __user = await this.verify()
        if(__user) {
            return new UserObject(
                __user._id,
                __user.first.name,
                __user.last.name,
                __user.encryption,
                __user.email,
                __user.blogs
            )
        }
        if(await this.usernameAlreadyExists(this.id)) {
            return {
                status: 404,
                error: "BadRequest! The provided username already exists.",
                comment: "Use a different username"
            }
        }
        if(await this.emailAlreadyExists(this.email)) {
            return {
                status: 404,
                error: "BadRequest! The provided email already exists.",
                comment: "Try with a different email"
            }
        }
        if(!this.isEmailValid(this.email)) {
            return {
                status: 404,
                error: "BadRequest! The given email is not valid!",
                comment: "Use static method to change the email or dynamically change the email if not valid!"
            }
        }
        __user = await (new user({
            _id: this.id,
            name: {
                first: this.firstName,
                last: this.lastName
            },
            encryption: this.encryption,
            email: this.email,
            emergencyContacts: this.emergencyContacts
        })).save()
        __user = __user._doc
        this.__removeVersionInfo(__user)
        return new UserObject(
            __user._id,
            __user.name.first,
            __user.name.last,
            __user.encryption,
            __user.email,
            __user.blogs,
            __user.emergencyContacts
        )
    }
    
    /**
     * 
     * @param {String} newEmail New email of the user to update in the database
     * @returns UserObject
     */
    async updateEmail(newEmail) {
        var __user = await this.verify()
        if(!__user) {
            return {
                status: 400,
                comment: "The requested id is not in the database"
            }
        }
        if(!this.isEmailValid(newEmail)) {
            return {
                status: 400,
                comment: "The mentioned email is not valid"
            }
        }
        __user = (await __user.set("email", newEmail).save())._doc
        this.__removeVersionInfo(__user)
        return new UserObject(
            __user._id,
            __user.name.first,
            __user.name.last,
            __user.encryption,
            __user.email,
            __user.blogs,
            __user.emergencyContacts
        )
    }

    /**
     * 
     * @param {String} newEncryption New password of the user to be updated in the database
     * @returns UserObject
     */
    async updateEncryption(newEncryption) {
        var __user = await this.verify()
        if(!__user) {
            return {
                status: 400,
                comment: "The requested id is not in the database"
            }
        }
        __user = (await __user.set("encryption", newEncryption).save())._doc
        this.__removeVersionInfo(__user)
        return new UserObject(
            __user._id,
            __user.name.first,
            __user.name.last,
            __user.encryption,
            __user.email,
            __user.blogs,
            __user.emergencyContacts
        )
    }

    /**
     * 
     * @param {String} newFirstName New first name of the user to be saved in the database
     * @param {String} newLastName New last name of the user to be saved in the database
     * @returns UserObject
     */
    async updateName(newFirstName, newLastName) {
        var __user = await this.verify()
        if(!__user) {
            return {
                status: 400,
                comment: "The requested id is not in the database"
            }
        }
        var newName = {
            first: this.firstName,
            last: this.lastName
        }
        if(newFirstName && newFirstName.length > 0) {
            newName.first = newFirstName
        }
        if(newLastName && newLastName.length > 0) {
            newName.last = newLastName
        }
        __user = (await __user.set("name", newName).save())._doc
        this.__removeVersionInfo(__user)
        return new UserObject(
            __user._id,
            __user.name.first,
            __user.name.last,
            __user.encryption,
            __user.email,
            __user.blogs,
            __user.emergencyContacts
        )
    }
    

    async updateUserName(newUserName) {
        var __user = await this.verify()
        if(!__user) {
            return {
                status: 400,
                comment: "The requested id is not in the database"
            }
        }
        if(this.id === newUserName) {
            return this
        }
        if(await this.usernameAlreadyExists(newUserName)) {
            return {
                status: 404,
                comment: "Bad Request! The provided new username already exists in the database."
            }
        }
        await this.delete()
        __user = await new UserObject(
            newUserName,
            __user.name.first,
            __user.name.last,
            __user.encryption,
            __user.email,
            __user.blogs,
            __user.emergencyContacts
        ).create()
        return __user
    }

    async delete() {
        var __user = await this.verify()
        if(!__user) {
            return {
                status: 400,
                comment: "The requested id is not in the database"
            }
        }
        var data = await this.col.findByIdAndDelete(this.id)
        return data
    }

    extractBlogIds(user) {
        return user.blogs.map(__blog => __blog._id)
    }

    async updateBlog(id, newName, newDescription) {
        var __user = await this.verify()
        if(!__user) {
            return {
                status: 400,
                comment: "The requested id is not in the database"
            }
        }
        var __blog_ids = this.extractBlogIds(__user)
        if(!__blog_ids.includes(id)) {
            return {
                status: 404,
                comment: "BadRequest! There no such blog written by this user."
            }
        }
        var __blog = __user.blogs[__blog_ids.indexOf(id)]
        if(!(!newName || newName.length === 0)) {
            __blog.name = newName
        }
        if(!(!newDescription || newDescription.length === 0)) {
            __blog.description = newDescription
        }
        __user = (await __user.set("blogs", __user.blogs).save())._doc
        return new UserObject(
            __user._id,
            __user.name.first,
            __user.name.last,
            __user.encryption,
            __user.email,
            __user.blogs,
            __user.emergencyContacts
        )
    }

    async newBlog(name, description) {
        var __user = await this.verify()
        if(!__user) {
            return {
                status: 400,
                comment: "The requested id is not in the database"
            }
        }
        var __doc = {
            _id: this.id+"__blog__"+(__user.blogs.length+1),
            name: name
        }
        if(description) {
            __doc.description = description
        }
        __user.blogs.push(__doc)
        __user = (await __user.set("blogs", __user.blogs).save())._doc
        return new UserObject(
            __user._id,
            __user.name.first,
            __user.name.last,
            __user.encryption,
            __user.email,
            __user.blogs,
            __user.emergencyContacts
        )
    }

    async deleteBlog(id) {
        var __user = await this.verify()
        if(!__user) {
            return {
                status: 400,
                comment: "The requested id is not in the database"
            }
        }
        var __blog_ids = this.extractBlogIds(__user)
        if(!__blog_ids.includes(id)) {
            return {
                status: 404,
                comment: "BadRequest! There no such blog written by this user."
            }
        }
        __user.blogs.splice(__blog_ids.indexOf(id), 1)
        __user = (await __user.set("blogs", __user.blogs).save())._doc
        return new UserObject(
            __user._id,
            __user.name.first,
            __user.name.last,
            __user.encryption,
            __user.email,
            __user.blogs,
            __user.emergencyContacts
        )
    }

    /**
     * The method to find the user by first name
     * @param {String} firstName The first name of the user
     * @returns User Object in collection
     */
    async findByFirstName(firstName) {
        return (await this.col.find({})).filter(e => e.name.first.toLowerCase().trim() === firstName.toLowerCase().trim())
    }

    /**
     * The method to find by last name of the user
     * @param {String} lastName The last name of the user
     * @returns User Object in collection
     */
    async findByLastName(lastName) {
        return (await this.col.find({})).filter(e => e.name.last.toLowerCase().trim() === lastName.toLowerCase().trim())
    }

    /**
     * The method to find the user by full name (first name + last name)
     * @param {String} name The full name of the user
     * @returns User Object in the collection
     */
    async findByFullName(name) {
        return (await this.col.find({})).filter(e => (e.name.first.trim() + " " + e.name.last.trim()).toLowerCase() === name.toLowerCase().trim())
    }

    /**
     * The method to find the user by their email
     * @param {String} email The email of the user
     * @returns User Object in the Collection
     */
    async findByEmail(email) {
        return (await this.col.find({email: email}))
    }

    /**
     * The method to extract the emergency contacts of a user
     * @param {String} id The id of the user
     * @returns List of Emergency Contacts
     */
    async extractEmergencyContacts(id) {
        return (await this.col.findById(id)).emergencyContacts
    }

    /**
     * 
     * @param {Number} newPriority The new priority of the contact
     * @param {String=} newName The new name of the contact
     * @param {String=} newRelation The new relation of the contact
     * @param {String=} newPhone The new phone of the relation
     * @param {String=} newEmail 
     */
    async updateEmergencyContact(newPriority, newName, newRelation, newPhone, newEmail) {
        var __user = await this.verify()
        if(!__user) {
            return {
                status: 404,
                comment: "Requested id is not in the database."
            }
        }
        var emergencyContacts = __user.emergencyContacts
        if(emergencyContacts.length === 0) {
            emergencyContacts = [{
                _id: newPriority,
                name: newName,
                relation: newRelation,
                phone: newPhone,
                email: newEmail
            }]
        }
        else {
            var index = emergencyContacts.map(e => e._id).indexOf(newPriority)
            emergencyContacts[index] = {
                _id: newPriority,
                name: newName?newName:emergencyContacts[index].name,
                relation: newRelation?newRelation:emergencyContacts[index].relation,
                phone: newPhone?newPhone:emergencyContacts[index].phone,
                email: newEmail?newEmail:emergencyContacts[index].email
            }
        }
        var __user = (await __user.set("emergencyContacts", emergencyContacts).save())._doc
        return new UserObject(
            __user._id,
            __user.name.first,
            __user.name.last,
            __user.encryption,
            __user.email,
            __user.blogs,
            __user.emergencyContacts
        )
    }
    
    /**
     * The method to delete an emergency contact
     * @param {Number} id The priority of the emergency contact to delete
     * @returns UserObject
     */
    async deleteEmergencyContact(id) {
        var __user = this.verify()
        if(!__user) {
            return {
                status: 404,
                comment: "The requested id is not in the database."
            }
        }
        var emergencyContacts = __user.emergencyContacts
        if(emergencyContacts.length === 0) {
            return new UserObject(
                __user._id,
                __user.name.first,
                __user.name.last,
                __user.encryption,
                __user.email,
                __user.blogs,
                __user.emergencyContacts
            )
        }
        var index = emergencyContacts.map(e => e._id).indexOf(newPriority)
        emergencyContacts.splice(index, 1)
        var __user = (await __user.set("emergencyContacts", emergencyContacts).save())._doc
        return new UserObject(
            __user._id,
            __user.name.first,
            __user.name.last,
            __user.encryption,
            __user.email,
            __user.blogs,
            __user.emergencyContacts
        )
    }
}

class BlogObject extends CollectionObject {
    /**
     * 
     * @param {String} id The ID of the blog post
     * @param {String} name The name or title of the blog post
     * @param {String} description A short description of the blog post saying about the content
     * @param {String} content The main content of the blog post
     */
    constructor(id, name, description, content) {
        super(id, blog)

        this.id = id
        this.name = name
        this.description = description
        this.content = content

        this.doc = {
            _id: id,
            name: name,
            description: description,
            content: content
        }
    }

    async __verifyUser() {
        var __user = this.id.split("__")
        if(
            (__user.length !== 3) ||
            !(__user.length === 3 && __user[1] === "blog" && /[0-9]+/.test(__user[2]))
        ) {
            return {
                status: 404,
                comment: "The ID of the blog is not recognized."
            }
        }
        return (await new UserObject(__user[0], "", "", "", "", []).verify())
    }

    /**
     * Takes the input from the constructor and
     * @returns BlogObject
     */
    async create() {
        var __blog = await this.verify()
        if(__blog) {
            return new BlogObject(__blog._id, __blog.name, __blog.description, __blog.content)
        }
        var __user = await this.__verifyUser()
        if(!__user || __user.status === 404) {
            return {
                status: 404,
                comment: "The ID of the blog does not have the corresponding user."
            }
        }
        __user = new UserObject(
            __user._id, 
            __user.name.first,  
            __user.name.last, 
            __user.encryption,
            __user.email, 
            __user.blogs
        )
        if(!this.name || this.name.length === 0) {
            return {
                status: 404,
                comment: "Cannot create a blog without its name!"
            }
        }
        if(!this.content || this.content.length === 0) {
            return {
                status: 404,
                comment: "Cannot create a blog without its content!"
            }
        }
        __blog = (await new blog({
            _id: this.id,
            name: this.name,
            description: this.description,
            content: this.content
        }).save())
        if(!__blog) {
            return {
                status: 404,
                comment: "An error occurred during the creation of the blog!"
            }
        } 
        __blog = __blog._doc
        var __blogs = __user.blogs.length
        __user = await __user.newBlog(this.name, this.description || "")
        if(__user.blogs.length-__blogs === 1) {
            return new BlogObject(__blog._id, __blog.name, __blog.description, __blog.content)
        }
        return {
            status: 404,
            comment: "The blog did not get created due to internal server issue! Try again after sometime!"
        }
    }

    /**
     * This function if used for updating the blog
     * @param {String} newName The new name or title of the blog post if not changed then pass empty string
     * @param {String} newDescription The new description of the blog post if not changed then just pass the old description
     * @param {String} newContent The updated content of the blog post if not changed then pass empty string
     * @returns BlogObject
     */
    async update(newName, newDescription, newContent) {
        var __blog = await this.verify()
        if(!__blog) {
            return {
                status: 404,
                comment: "No such blog found in the database!"
            }
        }
        var __user = await this.__verifyUser()
        if(!__user || __user.status === 404) {
            return {
                status: 404,
                comment: "The ID of the blog does not have the corresponding user."
            }
        }
        __user = new UserObject(
            __user._id, 
            __user.name.first,  
            __user.name.last, 
            __user.encryption,
            __user.email, 
            __user.blogs
        )
        var __new_blog = {
            name: __blog.name,
            description: __blog.description || "",
            content: __blog.content
        }
        if(newName && newName.length > 0) {
            __new_blog.name = newName
        }
        if(newContent && newContent.length > 0) {
            __new_blog.content = newContent
        }
        if(newDescription.length === 0 || !newDescription) {
            delete __new_blog.description
        }
        else if(newDescription.length > 0) {
            __new_blog.description = newDescription
        }
        __blog = (await __blog.set(__new_blog).save())._doc
        if(!__blog) {
            return {
                status: 404,
                comment: "The database responded with an error try fixing your method!"
            }
        }
        __user = await __user.updateBlog(__blog._id, __blog.name, __blog.description || "")
        return new BlogObject(__blog._id, __blog.name, __blog.description || "", __blog.content)
    }

    /**
     * The inputs for this function are taken from the constructor and 
     * @returns blog schema
     */
    async delete() {
        var __blog = await this.verify()
        if(!__blog) {
            return {
                status: 404,
                comment: "No such blog found in the database!"
            }
        }
        var __user = await this.__verifyUser()
        if(!__user || __user.status === 404) {
            return {
                status: 404,
                comment: "The ID of the blog does not have the corresponding user."
            }
        }
        __user = new UserObject(
            __user._id, 
            __user.name.first,  
            __user.name.last, 
            __user.encryption,
            __user.email, 
            __user.blogs
        )
        __blog = await this.col.findByIdAndDelete(__blog._id)
        if(!__blog) {
            return {
                status: 404,
                comment: "It seems that there is an error contacting the database! Try again after sometime."
            }
        }
        var __blogs = __user.blogs.length
        __user = await __user.deleteBlog(__blog._id)
        if(!__user || __blogs-__user.blogs.length !== 1) {
            __blog = await new BlogObject(__blog._id, __blog.name, __blog.description, __blog.content).create()
            return {
                status: 404,
                comment: "It seems that there is an error contacting the database! Try again after sometime."
            }
        }
        return __blog
    }

    /**
     * A search function for finding the blogs
     * The search returns based on names, descriptions and content matching
     * @param {String} key The key to search in the names
     * @returns BlogObject[]
     */
    async findBySimilarity(key) {
        var __blogs = await this.findAll()
        if(!__blogs || __blogs.length === 0) {
            return {
                status: 404,
                comment: "The database refused to connect or there are no blogs on the database."
            }
        }
        var res = []
        for(var __blog of __blogs) {
            if(await searchBlog(
                __blog.name.toLowerCase(), 
                key.toLowerCase().split("").filter(__ch => /^[a-z0-9]/i.test(__ch)).join("")
            )) {
                res.push(__blog)
            }
        }
        return res
    }
}

class NGOObject extends CollectionObject {
    /**
     * The main class for all the NGO routes
     * @param {String} id The ID of the NGO in the database or that is to be created
     * @param {String} name The name of the NGO in the database or that is to be created
     * @param {String} startTime The daily start timings of the NGO in the format of HH:mm
     * @param {String} closeTime The daily close timings of the NGO in the format of HH:mm
     * @param {String} days The days of the week in which the NGO operates in the format of Mon-Sat (case sensitive)
     * @param {Number} latitude The latitude of the NGO's location which can be accurate upto 50m
     * @param {Number} longitude The longitude of the NGO's location which be accurate upto 50m
     * @param {String} phone The mobile or telephone number of the NGO which is used to be contacted with (Default Format: +919999999999)
     * @param {String} email The email ID of the NGO in the database or that is to be added in the database
     * @param {String} line1Address The line 1 address of the NGO required
     * @param {String} line2Address The line 2 address of the NGO (This param is optional [For optional leave an empty string])
     * @param {String} cityOrVillage The nearest city or village that the NGO is located in
     * @param {String} state The state in which the NGO is located in
     * @param {Number} pinCode The pin code of the location in which the NGO is located 
     */
    constructor(
        id,
        name,
        startTime,
        closeTime,
        days,
        latitude,
        longitude,
        phone,
        email,
        line1Address,
        line2Address,
        cityOrVillage,
        state,
        pinCode
    ) {
        super(id, ngo)

        this.id = id
        this.name = name
        this.startTime = startTime
        this.closeTime = closeTime
        this.days = days
        this.latitude = latitude
        this.longitude = longitude
        this.phone = phone
        this.email = email
        this.line1Address = line1Address
        this.line2Address = line2Address
        this.cityOrVillage = cityOrVillage
        this.state = state
        this.pinCode = pinCode

        this.doc = {
            _id: this.id,
            name: this.name,
            timings: {
                start: this.startTime,
                close: this.closeTime,
                days: this.days
            },
            location: {
                lat: this.latitude,
                long: this.longitude
            },
            phone: this.phone,
            email: this.email,
            address: {
                line_1: this.line1Address,
                line_2: this.line2Address,
                city_village: this.cityOrVillage,
                state: this.state,
                pin_code: this.pinCode
            }
        }
    }

    __verifyTime(time) {
        var regex = /^[0-9]{2}\:[0-9]{2}$/
        if(!regex.test(time)) {
            return false
        }
        var __time = time.split(":").map(e => Number(e))
        if(!__time) {
            return false
        }
        if((__time[0] >= 0 && __time[0] <= 23)) {
            return true
        } 
        return false
    } 

    __verifyDay(day) {
        var __days = day.split("-")
        if(__days.length !== 2) {
            return false
        }
        var __verifier = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        if(__verifier.includes(__days[0]) && __verifier.includes(__days[1])) {
            return true
        }
        return false
    }

    __verifyLatitude(latitude) {
        return latitude >= -90 && latitude <= 90
    }

    __verifyLongitude(longitude) {
        return longitude >= -180 && longitude <= 180
    }

    __verifyPinCode(pinCode) {
        return Number.isInteger(pinCode) && (pinCode >= 110000 && pinCode <= 990000)
    }

    __verifyState(state) {
        return stateList.map(e => e.toLowerCase()).includes(state.toLowerCase())
    }

    /**
     * Returns the pin code in formation from the given data in the class
     * @returns PinCodeType
     */
    async getPinCodeInfo(pinCode) {
        var __data = await axios.get(`https://api.postalpincode.in/pincode/${pinCode}`).then(res => res.data)
        if(__data[0].Status !== "Success") {
            return false
        }
        __data = __data[0].PostOffice[0]
        return {
            city_village: __data.Block,
            state: __data.State,
            pin_code: pinCode
        }
    }

    async __verifyAddress(address) {
        var __address = await this.getPinCodeInfo(address.pin_code)
        return __address && this.__verifyState() && __address.state.toLowerCase() === address.state.toLowerCase()
    }

    __return(__ngo) {
        return new NGOObject(
            __ngo._id,
            __ngo.name,
            __ngo.timings.start,
            __ngo.timings.close,
            __ngo.timings.days,
            __ngo.location.lat,
            __ngo.location.long,
            __ngo.phone,
            __ngo.email,
            __ngo.address.line_1,
            __ngo.address.line_2,
            __ngo.address.city_village,
            __ngo.address.state,
            __ngo.address.pin_code
        )
    }

    /**
     * Returns if the class params are valid or not and checks if there is an object in the collection before hand.
     * @returns Object
     */
    async verifyNGO() {
        var __ngo = await this.verify()
        if(__ngo) {
            return __ngo
        }
        if(!this.isEmailValid(this.email)) {
            return {
                status: 404,
                error: "BadRequest! The given email is not valid!",
                comment: "Use static method to change the email or dynamically change the email if not valid!"
            }
        }
        if(await this.emailAlreadyExists(this.email)) {
            return {
                status: 404,
                error: "BadRequest! The provided email already exists.",
                comment: "Try with a different email"
            }
        }
        if(await this.usernameAlreadyExists(this.id)) {
            return {
                status: 404,
                error: "BadRequest! The provided username already exists.",
                comment: "Use a different username"
            }
        }
        if(!this.isPhoneValid(this.phone)) {
            return {
                status: 404,
                error: "The phone number provided is not in the required format."
            }
        }
        if(await this.phoneAlreadyExists(this.phone)) {
            return {
                status: 404,
                comment: "The phone number is already used please provide another one!"
            }
        }
        if(!this.__verifyTime(this.startTime)) {
            return {
                status: 404,
                error: "The format of the start time is not correct.",
                comment: "The correct format is HH:mm"
            }
        }
        if(!this.__verifyTime(this.closeTime)) {
            return {
                status: 404,
                error: "The format of the close time is not correct.",
                comment: "The correct format is HH:mm"
            }
        }
        if(!this.__verifyDay(this.days)) {
            return {
                status: 404,
                error: "The format of the days is not correct.",
                comment: "The correct format is Mon-Sat"
            }
        }
        if(!this.__verifyLatitude(this.latitude)) {
            return {
                status: 404,
                error: "The latitude provided is out of range.",
                comment: "The latitude has be in the range of [-90, 90]."
            }
        }
        if(!this.__verifyLongitude(this.longitude)) {
            return {
                status: 404,
                error: "The longitude provided is out of range.",
                comment: "The latitude has be in the range of [-180, 180]."
            }
        }
        if(!this.__verifyState(this.state)) {
            return {
                status: 404,
                error: "The state has to be one of the recognized indian states.",
                comment: "Search up the possible state name and enter."
            }
        }
        if(!this.__verifyAddress(this.doc.address)) {
            return {
                status: 404,
                error: "The Address mention does not a state corresponding to its pin code",
                comment: "Use the correct location corresponding pin code or state."
            }
        }
        return __ngo
    }

    /**
     * Creates a collection object in the database with the given details
     * @returns NGOObject
     */
    async create() {
        var __ngo = await this.verifyNGO()
        if(__ngo && (__ngo.status === 404)) {
            return __ngo
        }
        if(__ngo && __ngo._id) {
            return this.__return(__ngo)
        }
        __ngo = this.doc
        __ngo = (await new ngo(__ngo).save())._doc
        if(!__ngo) {
            return {
                status: 404,
                comment: "The was an error occurred with operation with the database."
            }
        }
        return this.__return(__ngo)
    }

    /**
     * Updates the name of the NGO with the given name and returns the class object for further use.
     * @param {String} newName The new name of the NGO object which is to be updated
     * @returns NGOObject
     */
    async updateName(newName) {
        var __ngo = await this.verifyNGO()
        if(!__ngo) {
            return {
                status: 404,
                comment: "No document found in the database"
            }
        }
        if(__ngo.status === 404) {
            return __ngo
        }
        if(__ngo.name === newName) {
            return this.__return(__ngo)
        }
        __ngo = (await __ngo.set("name", newName).save())._doc
        return this.__return(__ngo)
    }

    /**
     * Updates the NGO object with the given new start time
     * @param {String} newTime The new start time of the NGO that is to be updated
     * @returns NGOObject
     */
    async updateStartTime(newTime) {
        if(!this.__verifyTime(newTime)) {
            return {
                status: 404,
                comment: "The time mentioned is not in correct format."
            }
        }
        var __ngo = await this.verifyNGO()
        if(!__ngo) {
            return {
                status: 404,
                comment: "No document found in the database"
            }
        }
        if(__ngo.status === 404) {
            return __ngo
        }
        if(__ngo.timings.start === newTime) {
            return this.__return(__ngo)
        }
        __ngo = (await __ngo.set("timings", {...__ngo.timings, start: newTime}).save())._doc
        return this.__return(__ngo)
    }

    /**
     * Updates the NGO object with the given new close time
     * @param {String} newTime The new close time of the NGO that is to be updated
     * @returns NGOObject
     */
    async updateCloseTime(newTime) {
        if(!this.__verifyTime(newTime)) {
            return {
                status: 404,
                comment: "The time mentioned is not in correct format."
            }
        }
        var __ngo = await this.verifyNGO()
        if(!__ngo) {
            return {
                status: 404,
                comment: "No document found in the database"
            }
        }
        if(__ngo.status === 404) {
            return __ngo
        }
        if(__ngo.timings.close === newTime) {
            return this.__return(__ngo)
        }
        __ngo = (await __ngo.set("timings", {...__ngo.timings, close: newTime}).save())._doc
        return this.__return(__ngo)
    }

    /**
     * Updates the working days of the NGO and return the object for further use
     * @param {String} newDays The new working days of the NGO that is to be added in the database
     * @returns NGOObject
     */
    async updateDays(newDays) {
        if(!this.__verifyDay(newDays)) {
            return {
                status: 404,
                comment: "The days mentioned is not in correct format."
            }
        }
        var __ngo = await this.verifyNGO()
        if(!__ngo) {
            return {
                status: 404,
                comment: "No document found in the database"
            }
        }
        if(__ngo.status === 404) {
            return __ngo
        }
        if(__ngo.timings.days === newDays) {
            return this.__return(__ngo)
        }
        __ngo = (await __ngo.set("timings", {...__ngo.timings, days: newDays}).save())._doc
        return this.__return(__ngo)
    }

    /**
     * Updated the timings of the NGO and returns the NGO object
     * @param {String} newStartTime The new start time of the NGO
     * @param {String} newCloseTime The new close time of the NGO
     * @param {String} newDays The new working days of the NGO
     * @returns NGOObject
     */
    async updateTimings(newStartTime, newCloseTime, newDays) {
        if(!this.__verifyTime(newStartTime)) {
            return {
                status: 404,
                comment: "The start time mentioned is not in correct format."
            }
        }
        if(!this.__verifyTime(newCloseTime)) {
            return {
                status: 404,
                comment: "The close time mentioned is not in correct format."
            }
        }
        if(!this.__verifyDay(newDays)) {
            return {
                status: 404,
                comment: "The days mentioned is not in correct format."
            }
        }
        var __ngo = await this.verifyNGO()
        if(!__ngo) {
            return {
                status: 404,
                comment: "No document found in the database"
            }
        }
        if(__ngo.status === 404) {
            return __ngo
        }
        var newTimings = {
            start: newStartTime,
            close: newCloseTime,
            days: newDays
        }
        if(__ngo.timings === newTimings) {
            return this.__return(__ngo)
        }
        __ngo = (await __ngo.set("timings", newTimings).save())._doc
        return this.__return(__ngo)
    }

    /**
     * Updates the latitude of NGO and returns the collection object for further use
     * @param {Number} newLat The new latitude of the NGO that is to be updated
     * @returns NGOObject
     */
    async updateLatitude(newLat) {
        if(!this.__verifyLatitude(newLat)) {
            return {
                status: 404,
                comment: "The nwe latitude format mentioned is incorrect. Use a number in the range [-90, 90]."
            }
        }
        var __ngo = await this.verifyNGO()
        if(!__ngo) {
            return {
                status: 404,
                comment: "No document found in the database"
            }
        }
        if(__ngo.status === 404) {
            return __ngo
        }
        if(__ngo.location.lat === newLat) {
            return this.__return(__ngo)
        }
        __ngo = (await __ngo.set("location", {...__ngo.location, lat: newLat}).save())._doc
        return this.__return(__ngo)
    }

    /**
     * Updates the longitude of NGO and returns the collection object for further use
     * @param {Number} newLong The new longitude of the NGO that is to be updated
     * @returns NGOObject
     */
    async updateLongitude(newLong) {
        if(!this.__verifyLongitude(newLong)) {
            return {
                status: 404,
                comment: "The nwe latitude format mentioned is incorrect. Use a number in the range [-180, 180]."
            }
        }
        var __ngo = await this.verifyNGO()
        if(!__ngo) {
            return {
                status: 404,
                comment: "No document found in the database"
            }
        }
        if(__ngo.status === 404) {
            return __ngo
        }
        if(__ngo.location.long === newLong) {
            return this.__return(__ngo)
        }
        __ngo = (await __ngo.set("location", {...__ngo.location, long: newLong}).save())._doc
        return this.__return(__ngo)
    }

    /**
     * Updated the location and returns the NGO Object.
     * @param {Number} newLat The new latitude to update that has be in the range of [-90, 90]
     * @param {Number} newLong The new longitude that has to be in the range of [-180, 180]
     * @returns NGOobject
     */
    async updateLocation(newLat, newLong) {
        if(!this.__verifyLatitude(newLat)) {
            return {
                status: 404,
                comment: "The nwe latitude format mentioned is incorrect. Use a number in the range [-90, 90]."
            }
        }
        if(!this.__verifyLongitude(newLong)) {
            return {
                status: 404,
                comment: "The nwe latitude format mentioned is incorrect. Use a number in the range [-180, 180]."
            }
        }
        var __ngo = await this.verifyNGO()
        if(!__ngo) {
            return {
                status: 404,
                comment: "No document found in the database"
            }
        }
        if(__ngo.status === 404) {
            return __ngo
        }
        var newLocation = {
            lat: newLat,
            long: newLong
        }
        if(__ngo.location === newLocation) {
            return this.__return(__ngo)
        }
        __ngo = (await __ngo.set("location", newLocation).save())._doc
        return this.__return(__ngo)
    }

    /**
     * Updates the phone number of the NGO and returns the collection object for further use
     * @param {String} newPhone The new phone number that is to be updated
     * @returns NGOObject
     */
    async updatePhone(newPhone) {
        if(!this.isPhoneValid(newPhone)) {
            return {
                status: 404,
                comment: "Please mention a valid phone number."
            }
        }
        if(await this.phoneAlreadyExists(newPhone)) {
            return {
                status: 404,
                comment: "The new phone number mentioned is already in the database."
            }
        } 
        var __ngo = await this.verifyNGO()
        if(!__ngo) {
            return {
                status: 404,
                comment: "No document found in the database"
            }
        }
        if(__ngo.status === 404) {
            return __ngo
        }
        if(__ngo.phone === newPhone) {
            return this.__return(__ngo)
        }
        __ngo = (await __ngo.set("phone", newPhone).save())._doc
        return this.__return(__ngo)
    }

    /**
     * Updates the email of the NGO and returns the collection object for further use
     * @param {String} newEmail The new email of the NGO that is to be updated
     * @returns NGOObject
     */
    async updateEmail(newEmail) {
        if(!this.isEmailValid(newEmail)) {
            return {
                status: 404,
                comment: "Please mention a valid email address."
            }
        }
        if(await this.emailAlreadyExists(newEmail)) {
            return {
                status: 404,
                comment: "The new email address mentioned is already in the database."
            }
        } 
        var __ngo = await this.verifyNGO()
        if(!__ngo) {
            return {
                status: 404,
                comment: "No document found in the database"
            }
        }
        if(__ngo.status === 404) {
            return __ngo
        }
        if(__ngo.email === newEmail) {
            return this.__return(__ngo)
        }
        __ngo = (await __ngo.set("email", newEmail).save())._doc
        return this.__return(__ngo)
    }

    /**
     * Updates the address of the NGO and returns the collection object for further use
     * @param {String} newLine1 The new line 1 address of the NGO if not changed then pass empty string
     * @param {String} newLine2 The new line 2 address of the NGO if not changed then pass empty string
     * @param {String} newCityOrVillage The new nearest city or village of the NGO that has to be updated if not changes pass an empty string
     * @param {String} newState The new state of the NGO if changed changed the pin code according the new state if not changed then pass empty string
     * @param {Number} newPinCode The new pin code of the NGO if changed change the state with respect to that if not changed pass 0
     * @returns NGOObject
     */
    async updateAddress(newLine1, newLine2, newCityOrVillage, newState, newPinCode) {
        if(!this.__verifyPinCode(newPinCode)) {
            return {
                status: 404,
                comment: "The pin code mentioned is not in the postal code range."
            }
        }
        var newAddress = {
            line_1: newLine1,
            line_2: newLine2,
            city_village: newCityOrVillage,
            state: newState,
            pin_code: newPinCode
        }
        var __pin_code = await this.getPinCodeInfo(newPinCode)
        if(!__pin_code) {
            return {
                status: 404,
                comment: "The pin code mentioned is not valid"
            }
        }
        if(newAddress.state !== __pin_code.state) {
            return {
                status: 404,
                comment: "The mentioned pin code does not correspond to the mentioned state. Please change one of then with respect to the other."
            }
        }
        var __ngo = await this.verifyNGO()
        if(!__ngo) {
            return {
                status: 404,
                comment: "No document found in the database"
            }
        }
        if(__ngo.status === 404) {
            return __ngo
        }
        if(
            this.line1Address === newAddress.line_1 && 
            this.line2Address === newAddress.line_2 &&
            this.cityOrVillage === newAddress.city_village &&
            this.state === newAddress.state &&
            this.pinCode === newAddress.pin_code
        ) {
            return this.__return(__ngo)
        }
        __ngo = (await __ngo.set("address", newAddress).save())._doc
        return this.__return(__ngo)
    }
}

class EmergencyObject extends CollectionObject {

    /**
     * The constructor for the class of the class of Emergency Information
     * @param {String} id The id of the emergency unit
     * @param {String} name The full name of the emergency unit
     * @param {Number} latitude The latitude of the emergency unit
     * @param {Number} longitude The longitude of the emergency unit
     * @param {String} phone The phone number of the emergency unit
     * @param {String} email The email of the emergency unit 
     * @param {String} address The address of the emergency unit 
     */
    constructor(id, name, latitude, longitude, phone, email, address) {
        super(id, emergency)

        this.id = id
        this.name = name
        this.latitude = latitude
        this.longitude = longitude
        this.phone = phone
        this.email = email
        this.address = address

        this.doc = {
            _id: this.id,
            name: this.name,
            location: {
                lat: this.latitude,
                long: this.longitude
            },
            phone: this.phone,
            email: this.email,
            address: this.data
        }
    }

    __verifyLatitude(latitude) {
        return latitude >= -90 && latitude <= 90
    }

    __verifyLongitude(longitude) {
        return longitude >= -180 && longitude <= 180
    }

    __return(__emergency) {
        return new EmergencyObject(
            __emergency._id,
            __emergency.name,
            __emergency.location.lat,
            __emergency.location.long,
            __emergency.phone,
            __emergency.email,
            __emergency.address
        )
    }
    /**
     * The method to create the EmergencyObject
     * @returns EmergencyObject
     */
    async create() {
        var __emergency = await this.verify()
        if(__emergency) {
            return this.__return(__emergency)
        }
        if(await this.usernameAlreadyExists(this.id)) {
            return {
                status: 404,
                error: "BadRequest! The provided id already exists.",
                comment: "Use a different id"
            }
        }
        if(await this.emailAlreadyExists(this.email)) {
            return {
                status: 404,
                error: "BadRequest! The provided email already exists.",
                comment: "Try with a different email"
            }
        }
        if(!this.isEmailValid(this.email)) {
            return {
                status: 404,
                error: "BadRequest! The given email is not valid!",
                comment: "Use static method to change the email or dynamically change the email if not valid!"
            }
        }
        if(!this.__verifyLatitude(this.latitude)) {
            return {
                status: 404,
                comment: "The mentioned latitude is not valid"
            }
        }
        if(!this.__verifyLongitude(this.longitude)) {
            return {
                status: 404,
                comment: "The mentioned longitude is not valid"
            }
        }
        __emergency = await (new emergency({
            _id: this.id,
            name: this.name,
            location: {
                lat: this.latitude,
                long: this.longitude
            },
            phone: this.phone,
            email: this.email,
            address: this.address
        })).save()
        return this.__return(__emergency._doc)
    }

    /**
     * The method to update the name of the Emergency Unit
     * @param {String} newName The new name of the Emergency Unit
     */
    async updateName(newName) {
        if(newName.length === 0) {
            return {
                status: 404,
                comment: "The method requires a name to update."
            }
        }
        var __emergency = await this.verify()
        if(!__emergency) {
            return {
                status: 404,
                comment: "The requested id is not in the database."
            }
        }
        if(__emergency.name === newName) {
            return this.__return(__emergency)
        }
        __emergency = (await __emergency.set("name", newName).save())._doc
        if(__emergency) {
            return this.__return(__emergency)
        }
        return {
            status: 404,
            comment: "There is an error updating the object."
        }
    }

    /**
     * The method to update the latitude of the Emergency service
     * @param {Number} newLat The new latitude of the Emergency Service Location
     * @returns EmergencyObject
     */
    async updateLatitude(newLat) {
        if(!this.__verifyLatitude(newLat)) {
            return {
                status: 404,
                comment: "The new latitude is invalid."
            }
        }
        var __emergency = await this.verify()
        if(!__emergency) {
            return {
                status: 404,
                comment: "The requested id is not in the database."
            }
        }
        if(__emergency.location.lat === newLat) {
            return this.__return(__emergency)
        }
        __emergency = (await __emergency.set("location", {...__emergency.location, lat: newLat}).save())._doc
        if(__emergency) {
            return this.__return(__emergency)
        }
        return {
            status: 404,
            comment: "There is an error updating the object."
        }
    }

    /**
     * The method to update the Longitude of the Emergency Service
     * @param {Number} newLong The new longitude of the Emergency Unit
     * @returns EmergencyObject
     */
    async updateLongitude(newLong) {
        if(!this.__verifyLongitude(newLong)) {
            return {
                status: 404,
                comment: "The new longitude is invalid."
            }
        }
        var __emergency = await this.verify()
        if(!__emergency) {
            return {
                status: 404,
                comment: "The requested id is not in the database."
            }
        }
        if(__emergency.location.long === newLong) {
            return this.__return(__emergency)
        }
        __emergency = (await __emergency.set("location", {...__emergency.location, long: newLong}).save())._doc
        if(__emergency) {
            return this.__return(__emergency)
        }
        return {
            status: 404,
            comment: "There is an error updating the object."
        }
    }

    /**
     * The method to update the location of the Emergency service
     * @param {Number} newLat The new latitude of the Emergency Service Location
     * @param {Number} newLong The new longitude of the Emergency Unit
     * @returns EmergencyObject
     */
    async updateLocation(newLat, newLong) {
        if(!this.__verifyLatitude(newLat)) {
            return {
                status: 404,
                comment: "The new latitude is invalid."
            }
        }
        if(!this.__verifyLongitude(newLong)) {
            return {
                status: 404,
                comment: "The new longitude is invalid."
            }
        }
        var __emergency = await this.verify()
        if(!__emergency) {
            return {
                status: 404,
                comment: "The requested id is not in the database."
            }
        }
        var location = {
            lat: newLat,
            long: newLong
        }
        __emergency = (await __emergency.set("location", location).save())._doc
        if(__emergency) {
            return this.__return(__emergency)
        }
        return {
            status: 404,
            comment: "There is an error updating the object."
        }
    }

    /**
     * 
     * @param {String} newPhone The new phone to update the 
     * @returns Emergency Object
     */
    async updatePhone(newPhone) {
        if(newPhone.length === 0) {
            return {
                status: 404,
                comment: "A new phone parameter is required to update the phone of the Emergency Service"
            }
        }
        var __emergency = await this.verify()
        if(!__emergency) {
            return {
                status: 404,
                comment: "The requested id is not in the database."
            }
        }
        __emergency = (await __emergency.set("phone", newPhone).save())._doc
        if(__emergency) {
            return this.__return(__emergency)
        }
        return {
            status: 404,
            comment: "There is an error updating the object."
        }
    }

    /**
     * The method to update the address of the Emergency Contact
     * @param {String} newAddress The new address to be updated in the database
     * @returns EmergencyObject
     */
    async updateAddress(newAddress) {
        if(newAddress.length === 0) {
            return {
                status: 404,
                comment: "A new address parameter is required to update the address of the Emergency Service"
            }
        }
        var __emergency = await this.verify()
        if(!__emergency) {
            return {
                status: 404,
                comment: "The requested id is not in the database."
            }
        }
        __emergency = (await __emergency.set("address", newAddress).save())._doc
        if(__emergency) {
            return this.__return(__emergency)
        }
        return {
            status: 404,
            comment: "There is an error updating the object."
        }
    }

    /**
     * The method to update the email of the Emergency Service
     * @param {String} newEmail The new email to be updated to the Emergency Service
     * @returns EmergencyObject
     */
    async updateEmail(newEmail) {
        if(newEmail.length === 0) {
            return {
                status: 404,
                comment: "A new email parameter is required to update the email of the Emergency Service."
            }
        }
        if(!this.isEmailValid(newEmail)) {
            return {
                status: 404,
                comment: "The entered email is not valid."
            }
        }
        var __emergency = await this.verify()
        if(!__emergency) {
            return {
                status: 404,
                comment: "The requested id is not in the database."
            }
        }
        __emergency = (await __emergency.set("email", newAddress).save())._doc
        if(__emergency) {
            return this.__return(__emergency)
        }
        return {
            status: 404,
            comment: "There is an error updating the object."
        }
    }
}

export {
    UserObject, BlogObject, NGOObject, EmergencyObject, CollectionObject
}