import {
    usersCollection,
    adminsCollection,
    coursesCollection,
    pCoursesCollection,
} from "../db/index.js";
import jwt from 'jsonwebtoken';

const jwtSecretAdmin = "$secret%";
const jwtSecretUser = "$secret%user^";

const adminRole = "admin";
const userRole = "user";

// Check if Admin exists
const adminExists = async (username) => {
    const adminExists = await adminsCollection.findOne({username:username});
    return adminExists;
};

// Check if credentials are correct
const checkLogin = async (username, password) => {
    const validCreds = await adminsCollection.findOne({username:username, password:password});
    return validCreds;
};

const getJWT = (username, jwtSecret, role) => {
    const payload = {
      username,
      role
    };
    return jwt.sign( 
      payload,
      jwtSecret,
      {expiresIn:'1h'}
    );
};

const getAdminJWT = (username) => {
return getJWT(username, jwtSecretAdmin, adminRole);
}

const getUserJWT = (username) => {
return getJWT(username, jwtSecretUser, userRole);
}

const authenticateAdminJwt = (req, res, next) => {
if(req.headers.authorization) {
    const authHeader = req.headers.authorization.split(" ")[1]; 
    if(authHeader) {
    if(jwt.verify(authHeader, jwtSecretAdmin, (err, user) => {

        if(err) {
        return res.status(403).send("Unauthorized");
        }
        if(user.role == adminRole) {
        req.user = user;
        next();
        }
        else {
        return res.status(403).send("Unauthorized");
        }

    }));
    }
    else {
    res.status(403).send("Unauthorized");
    }
}
else {
    res.status(403).send("Unauthorized");
}
};

const authenticateUserJwt = (req, res, next) => {
if(req.headers.authorization) {
    const authHeader = req.headers.authorization.split(" ")[1]; 
    if(authHeader) {
    if(jwt.verify(authHeader, jwtSecretUser, (err, user) => {

        if(err) {
        return res.status(403).send("Unauthorized");
        }
        if(user.role == userRole) {
        req.user = user;
        next();
        }
        else {
        return res.status(403).send("Unauthorized");
        }

    }));
    }
    else {
    res.status(403).send("Unauthorized");
    }
}
else {
    res.status(403).send("Unauthorized");
}
};

const authenticateAdmin = async (req, res, next) => {
if("username" in req.headers && "password" in req.headers){
    const validCreds = await checkLogin(req.headers.username, req.headers.password);
    // If creds correct
    if(validCreds) {
    req.jwtToken = getAdminJWT(req.headers.username);
    next();
    }
    //Incorrect creds 
    else {
    res.status(400).send("Incorrect credentials");
    }

}
else {
    res.status(400).send("Missing Parameters");
}
}

// Check if course exists and is published
const checkValidUserCourse = async (req,res,next) => {
const course = await coursesCollection.findOne({id:req.params.courseId, published:true});
// Course available to purchase
if(course) {
    next();
}
// Course not available to purchase
else{
    res.status(403).send("Invalid course");
}
}

const checkIfCourseAlreadyPurchased = async (req, res, next) => {
const pcourse = await pCoursesCollection.findOne({username:req.user.username, courseId:req.params.courseId});
// If course not purchased
if(!pcourse) {
    next();
}
// Course already purchased
else {
    res.status(500).send("Course Already Purchased");
}
};

// Find and update course middleware
const findCourse = async (req, res, next) => {
const course = await coursesCollection.findOne({id:req.params.courseId});
if(course) {
    req.course = course;
    next();
}
else {
    res.status(403).send("Invalid course ID");
}
}

const updateCourse = (req, res, next) => {
req.course.title = req.body.title? req.body.title : req.course.title;
req.course.description = req.body.description? req.body.description : req.course.description;
req.course.price = req.body.price? req.body.price : req.course.price;
req.course.imageLink = req.body.imageLink? req.body.imageLink : req.course.imageLink;
req.course.published = "published" in req.body? req.body.published : req.course.published;
next();
};

const validateFirebaseToken = async (req, res, next) => {
    if(req.body.username && req.body.token) {

        try {
            const authUser = await admin.auth().verifyIdToken(req.body.token);
            if(authUser.email == req.body.username && authUser.email_verified) {
                next();
            }
            else {
                res.status(401).send("Invalid token");    
            }
        } catch (error) {
            console.log(error);
            res.status(401).send("Invalid token");
        }
    }   
    else {
        res.status(500).send("Missing params");
    }
}

const manageFirebaseUser = async(req, res, next) => {
    try {
        const user = await usersCollection.findOne({username:req.body.username});

        // User already exists
        if(user) {
            if(!user.isFirebaseUser) {
                const updatedUser = await usersCollection.findOneAndUpdate(
                    {username:user.username}, {isFirebaseUser:true}, {new:true});
            }
            next();
        }
        // Create user
        else {
            const obj = {isFirebaseUser:true, username:req.body.username, password:''};
            const newUser = await usersCollection(obj)
            newUser.save();
            next();
        }
    } catch (error) {
        res.status(500).send("Something went wrong");
    }
}

// Check if User exists
const userExists = async (username) => {
    const user = await usersCollection.findOne({username});
    return user;
}

// Check if user can login
const checkUserLogin = async (username, password) => {
const user = await usersCollection.findOne({username, password});
return user;
}; 

// Authenticate user
const authenticateUser = async (req, res, next) => {
// If creds in headers
if(req.headers.username && req.headers.password) {
    const userLoggedIn = await checkUserLogin(req.headers.username, req.headers.password);
    // If correct credentials
    if(userLoggedIn) {
    next();
    }
    else {
    res.status(200).json({status:false, message:"Invalid credentials"});
    }
}
else{
    res.status(200).json({status:false, message:"Missing authentication"});
}
};

const middleware = {
    adminExists,
    checkLogin,
    getJWT,
    getAdminJWT,
    getUserJWT,
    authenticateAdminJwt,
    authenticateUserJwt,
    authenticateAdmin,
    checkValidUserCourse,
    checkIfCourseAlreadyPurchased,
    findCourse,
    updateCourse,
    validateFirebaseToken,
    manageFirebaseUser,
    userExists,
    checkUserLogin,
    authenticateUser
}

export default middleware;