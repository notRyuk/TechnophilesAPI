import mongoose from "mongoose";

import { user, blog, ngo, UserBlogSchema } from "./mongoose.js";
import { DB_URL } from "./config.js";


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
        if(await this.verify()) {
            return new UserObject(
                this.id,
                this.firstName,
                this.lastName,
                this.encryption,
                this.email,
                this.blogs
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
        var __user = await (new user({
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

    async usernameAlreadyExists(username) {
        // console.log(__globals.users)
        return (await this.findAll()).map(__user => __user._id).includes(username)
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
                comment: "Bad Request! The provided new user name already exists in the database."
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
        await this.col.findByIdAndDelete(this.id)
        .then(data => {
            if(data) {
                return __user
            }
        })
        .catch(_ => {
            return {
                status: 404,
                comment: "BadRequest! The id provided is not present in the database."
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

    async findAll() {
        return await this.findAll()
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


var firstUser = new UserObject(
    "user1", "First Name of User1", "Last name of user1",
    "encryption of user1", "email.user1@domain.com", []
)

// setTimeout(async () => {
//     firstUser = await firstUser.create()
// }, 4000)

// setImmediate(async () => {
//     firstUser = await firstUser.newBlog("Blog1", "Blog1 description")
// }, 0)

// setImmediate(async () => {
//     firstUser = await firstUser.newBlog("Blog2", "Blog2 des")
// }, 0)


console.log(await firstUser.findByFirstName("Test1"))