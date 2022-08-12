import express from "express";

import { PORT } from "./config.js";
import { UserObject, CollectionObject, BlogObject } from "./db.js";
import { user, blog, ngo } from "./mongoose.js";

const app = express()

app.use(express.json())

/**
 *  TODO: Updated the res.send function with a param of Object which contains key status of status mentioned above and a key doc with the given doc
 *  The above has to be only done only when the send contains a 200 status else status is already present.
 * 
 *  Add the encryption algorithm to all the methods
*/

app.get(/^\/(user|blog|ngo)\/(findByID|findAll)$/, async (req, res) => {
    const path = req.path
    const body = req.body
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

app.post("/user/create", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["userName", "firstName", "lastName", "password", "email"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a user."
            })
            return
        }
    }
    var newUser = (await new UserObject(
        body.userName.trim(),
        body.firstName.trim(),
        body.lastName.trim(),
        body.password.trim(),
        body.email.trim(),
        []
    ).create()).doc
    res.status(200)
    res.send(newUser)
})

app.post("/user/updateUserName", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["userName", "token", "newUserName"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a user."
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

app.post("/user/updatePassword", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["userName", "token", "newPassword"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a user."
            })
            return
        }
    }
    // Encryption of the new password and change the conditional statement
    if(body.token === body.newPassword) {
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
    newUser = (await new UserObject(
        newUser._id,
        newUser.name.first,
        newUser.name.last,
        newUser.encryption,
        newUser.email,
        newUser.blogs
    ).updateEncryption(body.newPassword)) // Enter the param for new encrypted password
    if(newUser.status) {
        res.status(newUser.status)
        res.send(newUser)
        return
    }
    res.status(200)
    res.send(newUser.doc)
    return
})

app.post("/user/updateEmail", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["userName", "token", "email", "newEmail"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a user."
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

app.post("/user/updateName", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    /**
     * TODO: In docs we have to specify the name format as an object( {first: "", last: ""} )
     */
    var required = ["userName", "token", "name", "newName"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a user."
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

app.delete("/user/delete", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["userName", "token"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a user."
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

app.get("/user/findByName", async (req, res) => {
    const body = req.body
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

app.get("/user/findByEmail", async (req, res) => {
    const body = req.body
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

app.post("/blog/create", async (req, res) => {
    const body = req.body
    var keys = Object.keys(body)
    var values = Object.values(body)
    var required = ["userName", "name", "description", "content"]
    for(var i of required) {
        if(!keys.includes(i) || values[keys.indexOf(i)].length === 0) {
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
            comment: "Try providing a user that actually exists"
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

app.get("/blog/findByName", async (req, res) => {
    const body = req.body
    if(!body.key || body.key.trim().length === 0) {
        res.status(404)
        res.send({
            status: 404,
            error: "The request body does not have a key to search.",
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
    res.send((typeof newBlog !== Array)?newBlog:{status: 200, col: newBlog})
})

// app.post("/ngo/create", async (req, res) => {

// })

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

console.log("The app is listening on the port: ", PORT)
app.listen(PORT)
