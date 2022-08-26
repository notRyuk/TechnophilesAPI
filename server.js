import express from "express";
import { fileURLToPath } from 'url';
import { join, dirname } from "path";
import compression from "compression";
import cors from "cors";
import SHA256 from "crypto-js/sha256.js";
import Base64 from "crypto-js/enc-base64.js";

import { PORT } from "./config.js";
import { UserObject, CollectionObject, BlogObject, NGOObject, EmergencyObject, DevObject } from "./db.js";
import { user, blog, ngo, emergency, dev } from "./mongoose.js";
import { tokenizer } from "./helpers.js";

const app = express()

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(compression())

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const validateToken = async (req, res, next) => {
    const params = (Object.keys(req.params).length > 0)?params:req.header
    if(!req.api_key) {
        return
    }
    var dev = await dev.find({token: params.api_key})
    if(!dev) {
        return;
    }
    next();
}

// app.use(validateToken)

/**
 * @namespace User
*/
/**
 * @namespace Blog
*/
/**
 * @namespace NGO
*/
/**
 * @namespace Emergency
*/

/**
 * This routes helps in finding a collection element by ID
 * @name FindByID
 * @route {GET} /user/findByID
 * @memberof User
 * @bodyparam {String} id The id of the user to be searched for
*/
/**
 * This routes helps in finding a collection element by ID
 * @name FindByID
 * @route {GET} /blog/findByID
 * @memberof Blog
 * @bodyparam {String} id he id of the blog to be searched for
*/
/**
 * This routes helps in finding a collection element by ID
 * @name FindByID
 * @route {GET} /ngo/findByID
 * @memberof NGO
 * @bodyparam {String} id The id of the collection to be searched for
*/
/**
 * This routes helps in finding a collection element by ID
 * @name FindByID
 * @route {GET} /ngo/findByID
 * @memberof Emergency
 * @bodyparam {String} id The id of the collection to be searched for
*/
/**
 * This routes helps in finding a collection element by ID
 * @name findAll
 * @memberof User
 * @route {GET} /user/findAll 
*/
/**
 * This routes helps in finding a collection element by ID
 * @name findAll
 * @memberof Blog
 * @route {GET} /blog/findAll 
*/
/**
 * This routes helps in finding a collection element by ID
 * @name findAll
 * @memberof NGO
 * @route {GET} /blog/findAll 
 */
/**
 * This routes helps in finding a collection element by ID
 * @name findAll
 * @memberof Emergency
 * @route {GET} /blog/findAll 
 */
app.get(/^\/(user|blog|ngo|emergency)\/(findByID|findAll)$/, async (req, res) => {
    const path = req.path
    const body = Object.keys(req.body).length?req.body:req.query
    if(path.includes("findByID") && !body.id) {
        res.status(404)
        res.send({
            status: 404,
            error: "The id param id required to find in the body.",
            comment: "Send request body with id param"
        })
        return
    }
    var obj = null
    if(path.includes("user")) {
        obj = new CollectionObject(body.id, user)
    }
    if(path.includes("blog")) {
        obj = new CollectionObject(body.id, blog)
    }
    if(path.includes("ngo")) {
        obj = new CollectionObject(body.id, ngo)
    }
    if(path.includes("emergency")) {
        obj = new CollectionObject(body.id, emergency)
    }
    obj = path.includes("findByID")?(await obj.findById(body.id)):(await obj.findAll())
    if(!obj) {
        res.status(404)
        res.send({
            status: 404,
            error: "There is nothing in the collection.",
            comment: "Insert or Create some documents to use this method."
        })
        return
    }
    res.status(200)
    res.send({
        status: 200,
        col: obj
    })
    return
})

/**
 * This method creates a new user object in the database.
 * @name CreateUser
 * @memberof User
 * @route {POST} /user/create
 * @bodyparam {String} userName The username of the user 
 * @bodyparam {String} firstName The first name of the user 
 * @bodyparam {String} lastName The last name of that user
 * @bodyparam {String} password The encrypted password of the user
 * @bodyparam {String} email The email of the user
 */
app.post("/user/create", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["userName", "firstName", "lastName", "password", "email"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].trim().length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var newUser = (await new UserObject(
        body.userName.trim(),
        body.firstName.trim(),
        body.lastName.trim(),
        tokenizer.encrypt(body.password.trim()),
        body.email.trim(),
        []
    ).create()).doc
    res.status(200)
    res.send(newUser)
})

/**
 * This method updates the username of the mentioned user.
 * @name UpdateUserName
 * @memberof User
 * @route {POST} /user/updateUserName
 * @bodyparam {String} userName The username of the user
 * @bodyparam {String} token The token which is returned
 * @bodyparam {String} newUserName The new username of the user
 */
app.post("/user/updateUserName", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["userName", "token", "newUserName"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].trim().length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    if(body.userName === body.newUserName) {
        res.status(404)
        res.send({
            status: 404,
            error: "The new username and old username are equal.",
            comment: "The new username that is to updated has to be different."
        })
        return
    }
    var newUser = (await new UserObject(
        body.userName.trim(),
        "",
        "",
        "",
        "",
        []
    ).findById(body.userName))
    if(!newUser) {
        res.status(404)
        res.send({
            status: 404,
            error: "The input user is not found in the database.",
            comment: "Enter a valid username!"
        })
        return
    }
    if(tokenizer.decrypt(newUser.encryption) !== tokenizer.decrypt(body.token.trim())) {
        res.status(400)
        res.send({
            status: 400,
            error: "The given passwords do not match.",
            comment: "make sure the passwords match."
        })
        return
    }
    newUser = (await new UserObject(
        newUser._id,
        newUser.name.first,
        newUser.name.last,
        newUser.encryption,
        newUser.email,
        newUser.blogs
    ).updateUserName(body.newUserName))
    if(newUser.status) {
        res.status(newUser.status)
        res.send(newUser)
        return
    }
    res.status(200)
    res.send(newUser.doc)
    return
})

/**
 * This method updates the password of the mentioned user.
 * @name UpdatePassword
 * @memberof User
 * @route {POST} /user/updatePassword
 * @bodyparam {String} userName The username of the user
 * @bodyparam {String} token The tokenized password of the user
 * @bodyparam {String} newPassword The new tokenized of the user
 */
app.post("/user/updatePassword", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["userName", "token", "newPassword"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].trim().length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    if(tokenizer.decrypt(body.token) === body.newPassword) {
        res.status(404)
        res.send({
            status: 404,
            error: "The new password and old password are equal.",
            comment: "The new password that is to updated has to be different."
        })
        return
    }
    var newUser = (await new UserObject(
        body.userName.trim(),
        "",
        "",
        "",
        "",
        []
    ).findById(body.userName))
    if(!newUser) {
        res.status(404)
        res.send({
            status: 404,
            error: "The input user is not found in the database.",
            comment: "Enter a valid username!"
        })
        return
    }
    if(tokenizer.decrypt(newUser.encryption) !== tokenizer.decrypt(body.token.trim())) {
        res.status(400)
        res.send({
            status: 400,
            error: "The given passwords do not match.",
            comment: "make sure the passwords match."
        })
        return
    }
    newUser = (await new UserObject(
        newUser._id,
        newUser.name.first,
        newUser.name.last,
        newUser.encryption,
        newUser.email,
        newUser.blogs
    ).updateEncryption(tokenizer.encrypt(body.newPassword)))
    if(newUser.status) {
        res.status(newUser.status)
        res.send(newUser)
        return
    }
    res.status(200)
    res.send(newUser.doc)
    return
})

/**
 * The method to update the email id of the user
 * @name UpdateEmail
 * @memberof User
 * @route {POST} /user/updateEmail
 * @bodyparam {String} userName The username of the user
 * @bodyparam {String} The tokenized password of the user
 * @bodyparam {String} email The current email of the user
 * @bodyparam {String} newEmail The new email of the user
 */
app.post("/user/updateEmail", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["userName", "token", "email", "newEmail"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].trim().length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    if(body.email === body.newEmail) {
        res.status(404)
        res.send({
            status: 404,
            error: "The new email and old email are equal.",
            comment: "The new email that is to updated has to be different."
        })
        return
    }
    var newUser = (await new UserObject(
        body.userName.trim(),
        "",
        "",
        "",
        "",
        []
    ).findById(body.userName))
    if(!newUser) {
        res.status(404)
        res.send({
            status: 404,
            error: "The input user is not found in the database.",
            comment: "Enter a valid username!"
        })
        return
    }
    if(tokenizer.decrypt(newUser.encryption) !== tokenizer.decrypt(body.token.trim())) {
        res.status(400)
        res.send({
            status: 400,
            error: "The given passwords do not match.",
            comment: "make sure the passwords match."
        })
        return
    }
    newUser = (await new UserObject(
        newUser._id,
        newUser.name.first,
        newUser.name.last,
        newUser.encryption,
        newUser.email,
        newUser.blogs
    ).updateEmail(body.newEmail))
    if(newUser.status) {
        res.status(newUser.status)
        res.send(newUser)
        return
    }
    res.status(200)
    res.send(newUser.doc)
    return
})

/**
 * The method to update the name of the user
 * @name UpdateName
 * @memberof User
 * @route {POST} /user/updateName
 * @bodyparam {String} userName The username of the user
 * @bodyparam {String} token The tokenized password of the user
 * @bodyparam {NameOfUser} name The current name of the user
 * @bodyparam {NameOfUser} newName The new name of the user
 */
app.post("/user/updateName", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["userName", "token", "name", "newName"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].trim().length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var name = {
        first: body.name.first || "",
        last: body.name.last || ""
    }
    name.first = (name.first!==body.newName.first)?body.newName.first:name.first
    name.last = (name.last!==body.newName.last)?body.newName.last:name.last
    var newUser = (await new UserObject(
        body.userName.trim(),
        "",
        "",
        "",
        "",
        []
    ).findById(body.userName))
    if(!newUser) {
        res.status(404)
        res.send({
            status: 404,
            error: "The input user is not found in the database.",
            comment: "Enter a valid username!"
        })
        return
    }
    if(tokenizer.decrypt(newUser.encryption) !== tokenizer.decrypt(body.token.trim())) {
        res.status(400)
        res.send({
            status: 400,
            error: "The given passwords do not match.",
            comment: "make sure the passwords match."
        })
        return
    }
    newUser = (await new UserObject(
        newUser._id,
        newUser.name.first,
        newUser.name.last,
        newUser.encryption,
        newUser.email,
        newUser.blogs
    ).updateName(name.first, name.last))
    if(newUser.status) {
        res.status(newUser.status)
        res.send(newUser)
        return
    }
    res.status(200)
    res.send(newUser.doc)
    return
})

/**
 * The method to delete the user from the database
 * @name DeleteUser
 * @memberof User
 * @route {DELETE} /user/delete
 * @bodyparam {String} userName The username of the user
 * @bodyparam {String} token The tokenized password of the user
 */
app.delete("/user/delete", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["userName", "token"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].trim().length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var newUser = (await new UserObject(
        body.userName,
        "",
        "",
        "",
        "",
        []
    ).findById(body.userName))
    if(!newUser) {
        res.status(404)
        res.send({
            status: 404,
            error: "The input user is not found in the database.",
            comment: "Enter a valid username!"
        })
        return
    }
    if(tokenizer.decrypt(newUser.encryption) !== tokenizer.decrypt(body.token.trim())) {
        res.status(400)
        res.send({
            status: 400,
            error: "The given passwords do not match.",
            comment: "make sure the passwords match."
        })
        return
    }
    newUser = (await new UserObject(
        newUser._id,
        newUser.name.first,
        newUser.name.last,
        newUser.encryption,
        newUser.email,
        newUser.blogs
    ).delete())
    if(newUser.status) {
        res.status(newUser.status)
        res.send(newUser)
        return
    }
    res.status(200)
    res.send(newUser)
    return
})

/**
 * The method to fetch users by name
 * @name FindByName
 * @memberof User
 * @route {GET} /user/findByName
 * @bodyparam {NameOfUser} name The name of the user to search
 */
app.get("/user/findByName", async (req, res) => {
    const body = Object.keys(req.body).length?req.body:req.query
    var name = {
        first: "",
        last: ""
    }
    if(!body.name) {
        res.status(404)
        res.send({
            status: 404,
            error: "The request body does not have a name key.",
            comment: "Send a name parameter with first and last keys in it."
        })
        return
    }
    name.first = body.name.first?body.name.first.trim():""
    name.last = body.name.last?body.name.last.trim():""
    if(name.first.trim() === "" && name.last.trim() === "") {
        res.status(404)
        res.send({
            status: 404,
            error: "The name object does not have a first name or last name",
            comment: "Add a first name or last name in the name object with the keys first and last."
        })
        return
    }
    var newUser = new UserObject()
    if(name.first.trim() !== "" && (!name.last.trim() || name.last.trim() === "")) {
        newUser = await newUser.findByFirstName(name.first)
    }
    if((!name.first.trim() || name.first.trim() === "") && name.last.trim() !== "") {
        newUser = await newUser.findByLastName(name.last)
    }
    if(name.first.trim() !== "" && name.last.trim() !== "") {
        newUser = await newUser.findByFullName(name.first.trim() + " " + name.last.trim())
    }
    if(!newUser) {
        res.status(404)
        res.send({
            status: 404,
            error: "The database refused to connect.",
            comment: "Try reconnecting after sometime or change the database URI"
        })
        return
    }
    res.status(200)
    res.send({
        status: 200,
        col: newUser
    })
})

/**
 * The method to identify the users by email
 * @name FindByEmail
 * @memberof User
 * @route {GET} /user/findByEmail
 * @bodyparam {String} email The email id to fetch
 */
app.get("/user/findByEmail", async (req, res) => {
    const body = Object.keys(req.body).length?req.body:req.query
    if(!body.email || body.email.length === 0) {
        res.status(404)
        res.send({
            status: 404,
            error: "There is not email parameter in the request body or it is empty.",
            comment: "Pass a valid email to check."
        })
        return
    }
    var newUser = new UserObject()
    if(!newUser.isEmailValid(body.email.trim())) {
        res.status(404)
        res.send({
            status: 404,
            error: "The entered email is not in a valid format.",
            comment: "Please enter a valid email with correct format."
        })
        return
    }
    newUser = await newUser.findByEmail(body.email.trim())
    if(!newUser) {
        res.status(404)
        res.send({
            status: 404,
            error: "The database refused to connect.",
            comment: "Try reconnecting after sometime."
        })
        return
    }
    res.status(200)
    res.send({
        status: 200,
        col: newUser
    })
    return
})

/**
 * The method to create the blog written by the user
 * @name CreateBlog
 * @memberof Blog
 * @route {POST} /blog/create
 * @bodyparam {String} userName The username of the user that wrote the blog
 * @bodyparam {String} name The name of the blog
 * @bodyparam {String} [description=""] The description of the blog
 * @bodyparam {String} content The markdown'd content of the blog
 */
app.post("/blog/create", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["userName", "name", "description", "content"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].trim().length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a blog."
            })
            return
        }
    }
    var newBlog = new BlogObject(body.userName+"__blog__1", "", "", "")
    var newUser = await newBlog.__verifyUser()
    if(!newUser) {
        res.status(404)
        res.send({
            status: 404,
            error: "The mentioned user does not exist in the database",
            comment: "Try providing a user that actually exists."
        })
        return
    }
    newBlog = await new BlogObject(
        newUser._id+"__blog__"+(newUser.blogs.length+1), 
        body.name, 
        body.description, 
        body.content
    ).create()
    if(!newBlog) {
        res.status(404)
        res.send({
            status: 404,
            error: "The database refused to connect.",
            comment: "Try reconnecting after some time or use a different URL/URI."
        })
        return
    }
    res.status(newBlog.status || 200)
    res.send(newBlog.doc || newBlog)
})

/**
 * The method to update the blog.
 * <br>
 * <b>Note:</b> Any one of the name or description or content have to be present to update the blog.
 * @name UpdateBlog
 * @memberof Blog
 * @route {POST} /blog/update
 * @bodyparam {String} [newName=""] The new name of the blog
 * @bodyparam {String} [newDescription=""] The new description of the blog
 * @bodyparam {String} [newContent=""] The new content of the blog
 */
app.post("/blog/update", async (req, res) => {
    const body = req.body
    if(!body.id || body.id.trim().length === 0) {
        res.status(404)
        res.send({
            status: 404,
            error: "The request body does not have a key called id.",
            comment: "Send the blog id to be updated."
        })
        return
    }
    var newBlog = {
        name: (body.newName && body.newName.length > 0)?body.newName:"",
        description: (body.newDescription && body.newDescription.length > 0)?body.newDescription:"",
        content: (body.newContent && body.newContent.length > 0)?body.newContent:""
    }
    newBlog = await new BlogObject(body.id.trim()).update(newBlog.name, newBlog.description, newBlog.content)
    if(!newBlog) {
        res.status(404)
        res.send({
            status: 404,
            error: "The database refused to connect.",
            comment: "Try reconnecting after some time or use a different URL/URI."
        })
        return
    }
    res.status(newBlog.status || 200)
    res.send(newBlog.doc || newBlog)
})

/**
 * The method to delete the blog written by the user
 * @name DeleteBlog
 * @memberof Blog
 * @route {DELETE} /blog/delete
 * @bodyparam {String} id The blog to delete
 */
app.delete("/blog/delete", async (req, res) => {
    const body = req.body
    if(!body.id || body.id.trim().length === 0) {
        res.status(404)
        res.send({
            status: 404,
            error: "The request body does not have a key called id.",
            comment: "Send the blog id to be updated."
        })
        return
    }
    var newBlog = await new BlogObject(body.id).delete()
    if(!newBlog) {
        res.status(404)
        res.send({
            status: 404,
            error: "The database refused to connect.",
            comment: "Try reconnecting after some time or use a different URL/URI."
        })
        return
    }
    res.status(newBlog.status || 200)
    res.send(newBlog.doc || newBlog)
})

/**
 * The method to find the blog by name
 * @name FindByName
 * @memberof Blog
 * @route {GET} /blog/findByName
 * @bodyparam {String} key The key to search in the blogs
 */
app.get("/blog/findByName", async (req, res) => {
    const body = Object.keys(req.body).length?req.body:req.query
    if(!body.key || body.key.trim().length === 0) {
        res.status(404)
        res.send({
            status: 404,
            error: "The request body does not have a key to search.",
            comment: "Send the blog id to be updated."
        })
        return
    }
    var newBlog = await new BlogObject(body.id).findBySimilarity(body.key.trim())
    if(!newBlog) {
        res.status(404)
        res.send({
            status: 404,
            error: "The database refused to connect.",
            comment: "Try reconnecting after some time or use a different URL/URI."
        })
        return
    }
    res.status(newBlog.status || 200)
    res.send((typeof newBlog !== Array)?newBlog:{status: 200, col: newBlog})
})

/**
 * The method to crete the NGO object in the database
 * @name CreateNGO
 * @memberof NGO
 * @route {POST} /ngo/create
 * @bodyparam {String} id The id of the NGO
 * @bodyparam {String} name The name of the NGO
 * @bodyparam {TimingsOfNGO} timings The working timings of the NGO
 * @bodyparam {LocationOfNGO} location The current location of the NGO based on address
 * @bodyparam {String} phone The contact number of the NGO 
 * @bodyparam {String} email The contact email of the NGO
 * @bodyparam {AddressOfNGO} address The address of the NGO
 */
app.post("/ngo/create", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "name", "timings", "location", "phone", "email", "address"]
    for(var i of required) {
        if(!keys.includes(i) || (typeof values[keys.indexOf(i)] === String && values[keys.indexOf(i)].trim().length === 0)) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var newNGO = await new NGOObject(
        body.id,
        body.name,
        body.timings.start,
        body.timings.close,
        body.timings.days,
        body.location.lat,
        body.location.long,
        body.phone,
        body.email,
        body.address.line_1,
        body.address.line_2,
        body.address.city_village,
        body.address.state,
        body.address.pin_code
    ).create()
    res.status(newNGO.status || 200)
    res.send(newNGO.doc || newNGO)
})

/**
 * The method to update the name of the NGO
 * @name UpdateName
 * @memberof NGO
 * @route {POST} /ngo/updateName
 * @bodyparam {Sting} id The id of the NGO
 * @bodyparam {String} newName The new name of the NGO
 */
app.post("/ngo/updateName", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newName"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].trim().length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var newNGO = await new NGOObject(body.id).updateName(body.newName)
    res.status(newNGO.status || 200)
    res.send(newNGO.doc || newNGO)
})

/**
 * The method to update the name of the NGO
 * @name UpdateStartTime
 * @memberof NGO
 * @route {POST} /ngo/updateStartTime
 * @bodyparam {Sting} id The id of the NGO
 * @bodyparam {String} newStartTime The new start time of the NGO
 */
app.post("/ngo/updateStartTime", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newStartTime"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].trim().length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var newNGO = await new NGOObject(body.id).updateStartTime(body.newStartTime)
    res.status(newNGO.status || 200)
    res.send(newNGO.doc || newNGO)
})

/**
 * The method to update the name of the NGO
 * @name UpdateCloseTime
 * @memberof NGO
 * @route {POST} /ngo/updateCloseTime
 * @bodyparam {Sting} id The id of the NGO
 * @bodyparam {String} newCloseTime The new close time of the NGO
 */
app.post("/ngo/updateCloseTime", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newCloseTime"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].trim().length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var newNGO = await new NGOObject(body.id).updateCloseTime(body.newCloseTime)
    res.status(newNGO.status || 200)
    res.send(newNGO.doc || newNGO)
})

/**
 * The method to update the name of the NGO
 * @name UpdateDays
 * @memberof NGO
 * @route {POST} /ngo/updateDays
 * @bodyparam {Sting} id The id of the NGO
 * @bodyparam {String} newDays The new working days of the NGO
 */
app.post("/ngo/updateDays", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newDays"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].trim().length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var newNGO = await new NGOObject(body.id).updateDays(body.newDays)
    res.status(newNGO.status || 200)
    res.send(newNGO.doc || newNGO)
})

/**
 * The method to update the name of the NGO
 * @name UpdateTimings
 * @memberof NGO
 * @route {POST} /ngo/updateTimings
 * @bodyparam {Sting} id The id of the NGO
 * @bodyparam {String} newDays The new working days of the NGO
 * @bodyparam {String} newStartTime The new start time of the NGO
 * @bodyparam {String} newCloseTime The new close time of the NGO
 */
app.post("/ngo/updateTimings", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newDays", "newStartTime", "newCloseTime"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].trim().length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var newNGO = await new NGOObject(body.id).updateTimings(body.newStartTime, body.newCloseTime, body.newDays)
    res.status(newNGO.status || 200)
    res.send(newNGO.doc || newNGO)
})

/**
 * The method to update the name of the NGO
 * @name UpdateLatitude
 * @memberof NGO
 * @route {POST} /ngo/updateLatitude
 * @bodyparam {Sting} id The id of the NGO
 * @bodyparam {Number} newLatitude The new close time of the NGO
 */
app.post("/ngo/updateLatitude", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newLatitude"]
    for(var i of required) {
        if(!keys.includes(i)) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    if(values[keys.indexOf("id")].trim().length === 0) {
        res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
    }
    var newNGO = await new NGOObject(body.id).updateLatitude(body.newLatitude)
    res.status(newNGO.status || 200)
    res.send(newNGO.doc || newNGO)
})

/**
 * The method to update the name of the NGO
 * @name UpdateLongitude
 * @memberof NGO
 * @route {POST} /ngo/updateLongitude
 * @bodyparam {Sting} id The id of the NGO
 * @bodyparam {Number} newLongitude The new close time of the NGO
 */
app.post("/ngo/updateLongitude", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newLongitude"]
    for(var i of required) {
        if(!keys.includes(i)) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    if(values[keys.indexOf("id")].trim().length === 0) {
        res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
    }
    var newNGO = await new NGOObject(body.id).updateLongitude(body.newLongitude)
    res.status(newNGO.status || 200)
    res.send(newNGO.doc || newNGO)
})

/**
 * The method to update the name of the NGO
 * @name UpdateLocation
 * @memberof NGO
 * @route {POST} /ngo/updateLocation
 * @bodyparam {Sting} id The id of the NGO
 * @bodyparam {Number} newLatitude The new close time of the NGO
 * @bodyparam {Number} newLongitude The new close time of the NGO
 */
 app.post("/ngo/updateLocation", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newLatitude", "newLongitude"]
    for(var i of required) {
        if(!keys.includes(i)) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    if(values[keys.indexOf("id")].trim().length === 0) {
        res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
    }
    var newNGO = await new NGOObject(body.id).updateLocation(body.newLocation)
    res.status(newNGO.status || 200)
    res.send(newNGO.doc || newNGO)
})


/**
 * The method to update the name of the NGO
 * @name UpdatePhone
 * @memberof NGO
 * @route {POST} /ngo/updatePhone
 * @bodyparam {Sting} id The id of the NGO
 * @bodyparam {String} newPhone The new close time of the NGO
 */
 app.post("/ngo/updatePhone", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newPhone"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].trim().length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var newNGO = await new NGOObject(body.id).updatePhone(body.newPhone)
    res.status(newNGO.status || 200)
    res.send(newNGO.doc || newNGO)
})



/**
 * The method to update the name of the NGO
 * @name UpdateEmail
 * @memberof NGO
 * @route {POST} /ngo/updateEmail
 * @bodyparam {Sting} id The id of the NGO
 * @bodyparam {String} newEmail The new close time of the NGO
 */
 app.post("/ngo/updateEmail", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newEmail"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].trim().length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var newNGO = await new NGOObject(body.id).updateEmail(body.newEmail)
    res.status(newNGO.status || 200)
    res.send(newNGO.doc || newNGO)
})


/**
 * The method to update the name of the NGO
 * @name UpdateAddress
 * @memberof NGO
 * @route {POST} /ngo/updateAddress
 * @bodyparam {Sting} id The id of the NGO
 * @bodyparam {AddressOfNGO} newAddress The new close time of the NGO
 */
 app.post("/ngo/updateAddress", async (req, res) => {
    const body = req.body
    if(!body.id || body.id.trim().length === 0) {
        res.status(404)
        res.send({
            status: 404,
            error: `The ${i} parameter is missing or empty in the request body.`,
            comment: "The required parameters are needed for making a request."
        })
        return
    }
    var newNGO = await new NGOObject(body.id).updateAddress(
        body.newAddress.line_1.trim(),
        body.newAddress.line_2.trim(),
        body.newAddress.city_village.trim(),
        body.newAddress.state.trim(),
        body.newAddress.pin_code
    )
    res.status(newNGO.status || 200)
    res.send(newNGO.doc || newNGO)
})


/**
 * The method to create the Emergency Object
 * @name CreateEmergency
 * @memberof Emergency
 * @route {POST} /emergency/create
 * @bodyparam {String} id The id of the Emergency Unit
 * @bodyparam {String} name The name of the Emergency Unit
 * @bodyparam {Number} latitude The latitude of the Emergency Unit
 * @bodyparam {Number} longitude The longitude of the Emergency Unit
 * @bodyparam {String} phone The international format of phone number
 * @bodyparam {String} email The email of the Emergency Unit
 * @bodyparam {String} address The current address of the Emergency Service
 */
app.post("/emergency/create", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "name", "phone", "email", "latitude", "longitude", "address"]
    for(var i of required) {
        if(!keys.includes(i) || (typeof values[keys.indexOf(i)] === String && values[keys.indexOf(i)].trim().length === 0)) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var emergency = await new EmergencyObject(
        body.id,
        body.name,
        body.latitude,
        body.longitude,
        body.phone,
        body.email,
        body.address
    ).create()
    res.status(emergency.status || 200)
    res.send(emergency.doc || emergency)
})

/**
 * The method to create the Emergency Object
 * @name UpdateName
 * @memberof Emergency
 * @route {POST} /emergency/updateName
 * @bodyparam {String} id The id of the user
 * @bodyparam {String} newName The new name of Emergency Service
 */
app.post("/emergency/updateName", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newName"]
    for(var i of required) {
        if(!keys.includes(i) || (typeof values[keys.indexOf(i)] === String && values[keys.indexOf(i)].trim().length === 0)) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var emergency = await new EmergencyObject(body.id).updateName(body.newName)
    res.status(emergency.status || 200)
    res.send(emergency.doc || emergency)
})

/**
 * The method to create the Emergency Object
 * @name UpdateLatitude
 * @memberof Emergency
 * @route {POST} /emergency/updateLatitude
 * @bodyparam {String} id The id of the Emergency Service object
 * @bodyparam {Number} newLat The new Latitude of the location to be updated
 */
app.post("/emergency/updateLatitude", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newLat"]
    for(var i of required) {
        if(!keys.includes(i) || (typeof values[keys.indexOf(i)] === String && values[keys.indexOf(i)].trim().length === 0)) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var emergency = await new EmergencyObject(body.id).updateLatitude(body.newLat)
    res.status(emergency.status || 200)
    res.send(emergency.doc || emergency)
})

/**
 * The method to create the Emergency Object
 * @name UpdateLongitude
 * @memberof Emergency
 * @route {POST} /emergency/updateLongitude
 * @bodyparam {String} id The id of the Emergency service object
 * @bodyparam {Number} newLong The new longitude of the location that is to be updated
 */
app.post("/emergency/updateLongitude", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newLong"]
    for(var i of required) {
        if(!keys.includes(i) || (typeof values[keys.indexOf(i)] === String && values[keys.indexOf(i)].trim().length === 0)) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var emergency = await new EmergencyObject(body.id).updateLongitude(body.newLong)
    res.status(emergency.status || 200)
    res.send(emergency.doc || emergency)
})

/**
 * The method to create the Emergency Object
 * @name UpdateLocation
 * @memberof Emergency
 * @route {POST} /emergency/updateLocation
 * @bodyparam {String} id The id of the emergency service that is to be updated
 * @bodyparam {Number} newLat The new latitude of the emergency service
 * @bodyparam {Number} newLong The new longitude of the emergency service
 */
app.post("/emergency/updateLocation", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newLong", "newLat"]
    for(var i of required) {
        if(!keys.includes(i) || (typeof values[keys.indexOf(i)] === String && values[keys.indexOf(i)].trim().length === 0)) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var emergency = await new EmergencyObject(body.id).updateLocation(body.newLat, body.newLong)
    res.status(emergency.status || 200)
    res.send(emergency.doc || emergency)
})

/**
 * The method to create the Emergency Object
 * @name UpdatePhone
 * @memberof Emergency
 * @route {POST} /emergency/updatePhone
 * @bodyparam {String} id The id of the emergency service object that is to be updated
 * @bodyparam {String} newPhone The new phone number of the emergency service
 */
app.post("/emergency/updatePhone", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newPhone"]
    for(var i of required) {
        if(!keys.includes(i) || (typeof values[keys.indexOf(i)] === String && values[keys.indexOf(i)].trim().length === 0)) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var emergency = await new EmergencyObject(body.id).updatePhone(body.newPhone)
    res.status(emergency.status || 200)
    res.send(emergency.doc || emergency)
})

/**
 * The method to create the Emergency Object
 * @name UpdateEmail
 * @memberof Emergency
 * @route {POST} /emergency/updateEmail
 * @bodyparam {String} id The id of the emergency service object
 * @bodyparam {String} newEmail The new email address that is to be fed to the server
 */
app.post("/emergency/updateEmail", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newEmail"]
    for(var i of required) {
        if(!keys.includes(i) || (typeof values[keys.indexOf(i)] === String && values[keys.indexOf(i)].trim().length === 0)) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var emergency = await new EmergencyObject(body.id).updateEmail(body.newEmail)
    res.status(emergency.status || 200)
    res.send(emergency.doc || emergency)
})

/**
 * The method to create the Emergency Object
 * @name UpdateAddress
 * @memberof Emergency
 * @route {POST} /emergency/updateAddress
 * @bodyparam {String} id The id of the emergency service object
 * @bodyparam {String} newAddress The new email address that is to be fed to the server
 */
 app.post("/emergency/updateAddress", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["id", "newAddress"]
    for(var i of required) {
        if(!keys.includes(i) || (typeof values[keys.indexOf(i)] === String && values[keys.indexOf(i)].trim().length === 0)) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var emergency = await new EmergencyObject(body.id).updateAddress(body.newAddress)
    res.status(emergency.status || 200)
    res.send(emergency.doc || emergency)
})

/**
 * The method to create the Emergency Object
 * @name CreateEmergency
 * @memberof Emergency
 */
app.post("/emergency/update", async (req, res) => {
    res.send({status: 200, comment: "This method is yet to be built"})

})

/**
 * The method to create the Emergency Object
 * @name CreateEmergency
 * @memberof Emergency
 */
app.get("/emergency/findByName", async (req, res) => {
    res.send({status: 200, comment: "This method is yet to be built"})

})

/**
 * The method to create the Emergency Object
 * @name CreateEmergency
 * @memberof Emergency
 */
app.get("/emergency/findByEmail", async (req, res) => {
    res.send({status: 200, comment: "This method is yet to be built"})

})

/**
 * The method to create the Emergency Object
 * @name CreateEmergency
 * @memberof Emergency
 */
app.get("/emergency/findByPhone", async (req, res) => {
    res.send({status: 200, comment: "This method is yet to be built"})

})

/**
 * The method to create the Emergency Object
 * @name CreateEmergency
 * @memberof Emergency
 */
app.get("/emergency/findByType", async (req, res) => {
    res.send({status: 200, comment: "This method is yet to be built"})

})

/**
 * The method to create the Emergency Object
 * @name CreateEmergency
 * @memberof Emergency
 */
app.get("/emergency/findByType", async (req, res) => {
    res.send({status: 200, comment: "This method is yet to be built"})

})



app.use(express.static(join(__dirname, "logo")))
app.get(/\/logo(.png)?$/, async (_, res) => {
    res.sendFile(join(__dirname, "logo", "logo.png"))
})
app.get(/\/circular(.png)?$/, async (_, res) => {
    res.sendFile(join(__dirname, "logo", "circular.png"))
})

app.use(express.static(join(__dirname, "docs")))
app.get("/", (_, res) => {
    res.sendFile(join(__dirname, "docs", "index.html"))
})

app.use(express.static(join(__dirname, "login")))

app.get("/login", (_, res) => {
    res.sendFile(join(__dirname, "login", "index.html"))
})

app.post("/signup", async (req, res) => {
    const body = req.body
    console.log(body)
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["username", "email", "password"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].trim().length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a request."
            })
            return
        }
    }
    var encryption = tokenizer.encrypt(body.password)
    var token = Base64.stringify(SHA256(body.username+body.email+encryption));
    var dev = await new DevObject(body.username, body.email, encryption, token, new Date()).create()
    res.status(dev.status || 200)
    res.send(dev.doc || dev)
})

app.get("*", (_, res) => {
    res.status(404)
    res.send({
        status: 404,
        error: "BadRequest! URL/Path not found!",
        comment: "Please enter a valid Path."
    })
})

app.post("*", (_, res) => {
    res.status(404)
    res.send({
        status: 404,
        error: "BadRequest! URL/Path not found!",
        comment: "Please enter a valid Path."
    })
})

app.delete("*", (_, res) => {
    res.status(404)
    res.send({
        status: 404,
        error: "BadRequest! URL/Path not found!",
        comment: "Please enter a valid Path."
    })
})

app.get(/\/*.(js|html)$/, (_, res) => {
    res.status(404)
    res.send({
        status: 404,
        error: "BadRequest! URL/Path not found!",
        comment: "Please enter a valid Path."
    })
})

console.log("The app is listening on the port: ", PORT)
app.listen(PORT)
