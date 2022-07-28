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

    async usernameAlreadyExists(username) {
        // console.log(__globals.users)
        return Boolean((await this.findAll()).filter(__user => __user._id === username).length)
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
        return null
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

var firstBlog = new BlogObject(
    "user1__blog__1", 
    "This is the first blog by me", 
    "This is the description of my first blog", 
    "This is the content of my first blog"
)

console.log(await firstBlog.update(
    "This is the first edited blog by me", 
    "This is the first edited description", 
    "This is the first edited content of my first blog"
))

/*

update(
    "This is the first edited blog by me", 
    "This is the first edited description", 
    "This is the first edited content of my first blog"
)

*/