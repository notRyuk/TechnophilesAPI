import express from "express";

import { PORT } from "./config.js";
import { UserObject, CollectionObject } from "./db.js";
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
    obj = (await obj.findById(body.id))?path.includes("findByID"):(await obj.findAll())
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
        if(!keys.includes(i) && values[keys.indexOf(i)].length === 0) {
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
        if(!keys.includes(i) && values[keys.indexOf(i)].length === 0) {
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
        if(!keys.includes(i) && values[keys.indexOf(i)].length === 0) {
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
    ).updateEncryption(body.newUserName)) // Enter the param for new encrypted password
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
        if(!keys.includes(i) && values[keys.indexOf(i)].length === 0) {
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
        if(!keys.includes(i) && values[keys.indexOf(i)].length === 0) {
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
    name.first = body.newName.first?(name.first!==body.newName.first):name.first
    name.last = body.newName.last?(name.last!==body.newName.last):name.last
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
        if(!keys.includes(i) && values[keys.indexOf(i)].length === 0) {
            res.status(404)
            res.send({
                status: 404,
                error: `The ${i} parameter is missing or empty in the request body.`,
                comment: "The required parameters are needed for making a user."
            })
            return
        }
    }

})

app.get("*", (_, res) => {
    res.status(404)
    res.send({
        status: 404,
        error: "BadRequest! URL/Path not found!"
    })
})

app.post("*", (_, res) => {
    res.status(404)
    res.send({
        status: 404,
        error: "BadRequest! URL/Path not found!"
    })
})

console.log("The app is listening on the port: ", PORT)
app.listen(PORT)
