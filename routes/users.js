import express from "express";
import {
  usersCollection,
  adminsCollection,
  coursesCollection,
  pCoursesCollection,
} from "../db/index.js";

import middleware from '../middleware/index.js'

const usersRouter = express.Router();

// User routes

// User Sign Up Route
usersRouter.post('/signup', async (req, res) => {
    // logic to sign up user
    
    // If params available
    if(req.body.username && req.body.password) {
      const userexists = await middleware.userExists(req.body.username)
      //If user already exists
      if(userexists) {
        res.status(200).json({status:false, message:"Email is already registered"});
      }
      // User does not exists, create a new user
      else {
          req.body.isFirebaseUser = false;
          const newUser = await usersCollection(req.body)
          newUser.save();
          if(newUser) {
              const token = middleware.getUserJWT(req.headers.username);
              res.status(200).json({status:true, message:"User created successfully", token});
          }
          else {
              res.status(200).json({status:false, message:"Something went wrong"});
          }
      }
    }
    // Missing params
    else {
      res.status(403).send("Missing parameters");
    }
  
});

// Login User
usersRouter.post('/login', middleware.authenticateUser, (req, res) => {
// logic to log in user
const token = middleware.getUserJWT(req.headers.username);
res.status(200).json({status:true, message:"Login successful", token:token});
});

// Login/Signup with firebase
usersRouter.post('/firebase-login', 
    middleware.validateFirebaseToken, 
    middleware.manageFirebaseUser, 
    async (req, res) => {
        const token = middleware.getUserJWT(req.headers.username);
        res.status(200).send({message:"Login successful", token:token});
});

// Fetch All UserCourses
usersRouter.get('/courses', middleware.authenticateUserJwt, async (req, res) => {
// logic to list all courses

const userCourses = await coursesCollection.find({published:true});
if(userCourses) {
    res.status(200).json(userCourses);
}
else {
    res.status(500).send("Something went wrong");
}
});


// Purchase Course Route
usersRouter.post('/courses/:courseId', 
    middleware.authenticateUserJwt, 
    middleware.checkValidUserCourse,
    middleware.checkIfCourseAlreadyPurchased, 
    async (req, res) => {

        // logic to purchase a course
        const obj = {
            username:req.user.username,
            courseId:parseInt(req.params.courseId)
        }

        const newPCourse = await pCoursesCollection(obj);
        if(newPCourse) {
            newPCourse.save();
            res.status(200).json({message:"Course Purchased Successfully", data:newPCourse});
        }
        else {
            res.status(500).json({message:"Something went wrong"});
        }

});

// Fetch All Purchased Courses
usersRouter.get('/purchasedCourses', middleware.authenticateUserJwt, async (req, res) => {
    const purchasedIds = await pCoursesCollection.find({username:req.user.username}, {courseId:1,_id:0});

    const purchasedIdArr = purchasedIds.map((idJson) => {
        return idJson.courseId;
    });

    const purchasedCourses = await coursesCollection.find({id:{$in:purchasedIdArr}});
    res.status(200).json({purchasedCourses:purchasedCourses});

});
  
export {usersRouter};