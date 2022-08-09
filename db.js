import mongoose from "mongoose";
import axios from "axios";

import { user, blog, ngo, UserBlogSchema } from "./mongoose.js";
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

    async extractUserNames() {
        return (await this.col.find()).map(__doc => __doc._id)
    }

    /**
     * 
     * @param {String} email The email ID to check the validation 
     * @returns Boolean
     */
    isEmailValid(email) {
        return /^[a-z][a-z0-9_\.-]+\@[a-z0-9\-]+\.[a-z]+/.test(email)
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


class UserObject extends CollectionObject {
    /**
     * 
     * @param {String} id ID of the user to be saved in the database
     * @param {String} firstName First Name of the user to be saved in the database
     * @param {String} lastName Last Name of the user to be saved in the database
     * @param {String} encryption Password of the user to be saved in the database
     * @param {String} email Email of the user to be saved in the database
     * @param {UserBlogSchema[]} blogs List of Simplified blogs to be saved in the database
     */
    constructor(id, firstName, lastName, encryption, email, blogs) {
        super(id, user)

        this.col = user
        this.id = id
        this.firstName = firstName
        this.lastName = lastName
        this.encryption = encryption
        this.email = email
        this.blogs = blogs

        this.doc = {
            id: this.id,
            name: {
                first: this.firstName,
                last: this.lastName,
            },
            email: this.email,
            encryption: this.encryption,
            blogs: this.blogs
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
        if(!this.isEmailValid(this.email)) {
            return {
                status: 404,
                error: "BadRequest! The given email is not valid!",
                comment: "Use static method to change the email or dynamically change the email if not valid!"
            }
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
        __user = await (new user({
            _id: this.id,
            name: {
                first: this.firstName,
                last: this.lastName
            },
            encryption: this.encryption,
            email: this.email
        })).save()
        __user = __user._doc
        this.__removeVersionInfo(__user)
        return new UserObject(
            __user._id,
            __user.name.first,
            __user.name.last,
            __user.encryption,
            __user.email,
            __user.blogs
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
            __user.blogs
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
            __user.blogs
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
            __user.blogs
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
            __user._id,
            __user.name.first,
            __user.name.last,
            __user.encryption,
            __user.email,
            __user.blogs
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
        return await this.col.findByIdAndDelete(this.id)
        .then(data => {
            if(data) {
                this.__removeVersionInfo(__user)
                return __user
            }
        })
        .catch(_ => {
            return {
                status: 404,
                comment: "It seems that there is a problem with the database! Try again later!"
            }
        })
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
            __user.blogs
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
            __user.blogs
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
            __user.blogs
        )
    }

    async findByFirstName(firstName) {
        return (await this.col.find({})).filter(e => e.name.first === firstName)
    }

    async findByLastName(lastName) {
        return (await this.col.find({})).filter(e => e.name.last === lastName)
    }

    async findByFullName(name) {
        return (await this.col.find({})).filter(e => e.name.first + " " + e.name.last === name)
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
            id: id,
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
        .then(data => {
            if(data) {
                this.__removeVersionInfo(__blog)
                return __blog
            }
        })
        .catch(_ => {
            return {
                status: 404,
                comment: "It seems that there is an error contacting the database! Try again after sometime."
            }
        })
        if(!__blog || __blog.status === 404) {
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
        return this.doc
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
                comment: "No blogs found in the database."
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
     * 
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
            id: this.id,
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

    __verifyTime() {
        var regex = /^[0-9]{2}\:[0-9]{2}$/
        if(!regex.test(this.startTime) || !regex.test(this.closeTime)) {
            return false
        }
        var __start = this.startTime.split(":").map(e => Number(e))
        var __close = this.closeTime.split(":").map(e => Number(e))
        if(!__start.length === 2 || !__close.length === 2) {
            return false
        }
        if(
            (__start[0] >= 0 && __start[0] <= 23) && 
            (__close[0] >= 0 && __close[0] <= 23)
        ) {
            return true
        } 
        return false
    } 

    __verifyDay() {
        var __days = this.days.split("-")
        if(__days.length !== 2) {
            return false
        }
        var __verifier = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        if(__verifier.includes(__days[0]) && __verifier.includes(__days[1])) {
            return true
        }
        return false
    }

    __verifyLatitude() {
        return this.latitude >= -90 && this.latitude <= 90
    }

    __verifyLongitude() {
        return this.longitude >= -180 && this.longitude <= 180
    }

    __verifyPinCode() {
        return Number.isInteger(this.pinCode) && (this.pinCode >= 110000 && this.pinCode <= 990000)
    }

    __verifyState() {
        return stateList.map(e => e.toLowerCase()).includes(this.state.toLowerCase())
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
            pin_code: this.pinCode
        }
    }

    async __verifyAddress() {
        var __address = await this.getPinCodeInfo(this.pinCode)
        return __address && this.__verifyState() && __address.state.toLowerCase() === this.state.toLowerCase()
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
            return this.__return(__ngo)
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
        if(!this.__verifyLatitude()) {
            return {
                status: 404,
                error: "The latitude provided is out of range.",
                comment: "The latitude has be in the range of [-90, 90]."
            }
        }
        if(!this.__verifyLongitude()) {
            return {
                status: 404,
                error: "The longitude provided is out of range.",
                comment: "The latitude has be in the range of [-180, 180]."
            }
        }
        if(!this.__verifyState()) {
            return {
                status: 404,
                error: "The state has to be one of the recognized indian states.",
                comment: "Search up the possible state name and enter."
            }
        }
        if(!this.__verifyAddress()) {
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
        if(__ngo && (__ngo.status === 404 || typeof __ngo === NGOObject)) {
            return __ngo
        }
        __ngo = this.doc
        __ngo._id = this.id
        delete __ngo.id
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
        var __ngo = this.verifyNGO()
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
        var __ngo = this.verifyNGO()
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
        var __ngo = this.verifyNGO()
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
        var __ngo = this.verifyNGO()
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
        var __ngo = this.verifyNGO()
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
                comment: "The nwe latitude format mentioned is incorrect. Use a number in the range [-90, 90]."
            }
        }
        var __ngo = this.verifyNGO()
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
        var __ngo = this.verifyNGO()
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
        var __ngo = this.verifyNGO()
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
        if(!this.__verifyPinCode()) {
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
        var __ngo = this.verifyNGO()
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

// var firstUser = new UserObject(
//     "user1", "First Name of User1", "Last name of user1",
//     "encryption of user1", "email.user1@domain.com", []
// )

// setTimeout(async () => {
//     firstUser = await firstUser.create()
// }, 4000)

// setImmediate(async () => {
//     firstUser = await firstUser.newBlog("Blog1", "Blog1 description")
// }, 0)

// setImmediate(async () => {
//     firstUser = await firstUser.newBlog("Blog2", "Blog2 des")
// }, 0)


// console.log(await firstUser.findByFirstName("Test1"))


// var firstBlog = new BlogObject(
//     "user1__blog__1", 
//     "This is the first blog by me", 
//     "This is the description of my first blog", 
//     "This is the content of my first blog"
// )

// console.log("search results for first: ", await firstBlog.findBySimilarity("first"))
// console.log("search results for None: ", await firstBlog.findBySimilarity("None"))




/*

update(
    "This is the first edited blog by me", 
    "This is the first edited description", 
    "This is the first edited content of my first blog"
)

*/

// var firstNGO = new NGOObject(
//     "test_ngo1",
//     "Test NGO 1 Name",
//     "07:00",
//     "19:00",
//     "Mon-Sun",
//     10,
//     20,
//     "+919898989890",
//     "ngo1@ngo1.com",
//     "Line address of NGO 1",
//     "Line 2 address of NGO 1",
//     "City 1",
//     "Telangana",
//     502001
// )

// console.log(await firstNGO.create())

export {
    UserObject, BlogObject, NGOObject, CollectionObject
}