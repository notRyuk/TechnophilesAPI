<h1 align="center">
    Technophiles API v1.2
</h1>

<p align="center">
    <img alt="Logo" src="./logo/logo.png" style="position:relative;width:70%;">
</p>

KeyBlue is a portal created by Tricolored Technophiles for:
- Creating awareness blogs about Disaster Management and organizing mock drills
- Providing status of each registered rehabilitation organizations and active ranger

The Technophiles API serves as the backend to the the KeyBlue Android app and website. The documentation for the API can be found [here](https://technophilesapi.herokuapp.com/BlogObject.html)

## More about KeyBlue

- Service is provided in multiple languages to ensure inclusivity and reach.
- Ensures credibility through a verification system.
- Provides real-time assistance via Bluetooth technology connecting all nearby rehabilitation organizations and rangers in the disaster prone areas.
- Uses the latest industry-standard technology stack to provide the smoothest experience to the user.
- Bridges the connectivity gap between the rescuers and the rescuees through affiliation with NGOs.

## Basic API Usage

### Node.js
```js
import axios from "axios";

await axios.get("https://technophilesapi.herokuapp.com/user/findByID", {
    data: {
        id: "user1"
    }
})
```
- Output
```json
{
    "status": 200,
    "col": {
        "name": {
            "first": "First Name of User1",
            "last": "Last name of user1"
        },
        "_id": "user1",
        "encryption": "encryption of user1",
        "email": "email.user1@domain.com",
        "blogs": [
            {
                "_id": "user1__blog__1",
                "name": "This is the first edited blog by me",
                "description": "This is the first edited description"
            }
        ],
        "__v": 15
    }
}
```
- For other methods just replace `.get` with `.post` or `.delete`

## About us

Tricolored Technophiles is a 6 membered team from Indian Institute of Information Technology, Sri City, Chittoor.

Contact us at <tricolored.technophiles@gmail.com>

