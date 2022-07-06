import mongoose from "mongoose";

import {user, blog, ngo, UserBlogSchema} from "./mongoose.js";

mongoose.Promise = global.Promise

Object.prototype.keys = () => Object.keys(this)
Object.prototype.values = () => Object.values(this)

class CollectionObject {
    constructor(id, col) {
        this.id = id
        this.col = col
    }

    async verify() {
        return await this.col.findById(this.id)
    }

    __removeVersionInfo(obj) {
        delete obj.__v
    }
}


class UserObject extends CollectionObject {
    /**
     * 
     * @param {string} id ID of the user to be saved in the database
     * @param {string} firstName First Name of the user to be saved in the database
     * @param {string} lastName Last Name of the user to be saved in the database
     * @param {string} encryption Password of the user to be saved in the database
     * @param {string} email Email of the user to be saved in the database
     * @param {UserBlogSchema[]} blogs List of Simplified blogs to be saved in the database
     */
    constructor(id, firstName, lastName, encryption, email, blogs) {
        this.col = user
        this.id = id
        this.firstName = firstName
        this.lastName = lastName
        this.encryption = encryption
        this.email = email
        this.blogs = blogs

        super(this.id, this.col)
    }

    __hasId() {
        return this.id?true:false
    }

    /**
     * 
     * @param {string} id ID of the user to be saved in the database
     * @param {string} firstName First Name of the user to be saved in the database
     * @param {string} lastName Last Name of the user to be saved in the database
     * @param {string} encryption Password of the user to be saved in the database
     * @param {string} email Email of the user to be saved in the database
     * @returns UserObject
     */
    async create(id, firstName, lastName, encryption, email) {
        if(this.__hasId()) {
            return new UserObject(
                this.id,
                this.lastName,
                this.encryption,
                this.email,
                this.blogs
            )
        }
        var __user = new user({
            _id: id,
            name: {
                first: firstName,
                last: lastName
            },
            encryption: encryption
        })
    }
}