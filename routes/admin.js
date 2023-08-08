import express from "express";
import {
  usersCollection,
  adminsCollection,
  coursesCollection,
  pCoursesCollection,
} from "../db/index.js";

// // Firebase admin setup
// import admin from "firebase-admin";
// import credentials from "../credentials.js";
import middleware from '../middleware/index.js'
``
// admin.initializeApp({
//   credential: admin.credential.cert(credentials)
//});
const adminRouter = express.Router();

// Admin routes

// Admin Sign Up Route
adminRouter.post("/signup", async (req, res) => {
  if ("username" in req.body && "password" in req.body) {
    const adminexists = await middleware.adminExists(req.body.username, req.body.password);
    if (!adminexists) {
      const admin = {
        username: req.body.username,
        password: req.body.password,
      };
      const newAdmin = new adminsCollection(admin);
      await newAdmin.save();
      res.status(200).json({ message: "Admin created successfully" });
    } else {
      res.status(400).send("Admin already exists");
    }
  } else {
    res.status(400).send("Missing Parameters");
  }
});

// Admin Login Route
adminRouter.post("/login", middleware.authenticateAdmin, (req, res) => {
  const jwtToken = middleware.getAdminJWT(req.body.username);
  res.status(200).json({ message: "Logged in successfully", token: jwtToken });
});

// Add Course
adminRouter.post("/courses", middleware.authenticateAdminJwt, async (req, res) => {
  // logic to create a course
  const course = req.body;

  // Title not provided
  if (
    !course.title ||
    !course.description ||
    !course.price ||
    !course.imageLink ||
    !("published" in course)
  ) {
    res.status(403).send("Missing course params");
  }
  course.id = getCourseID();
  const newCourse = await coursesCollection(course);
  newCourse.save();
  res
    .status(200)
    .send({ message: "Course Added Successfully", course: course.id });
});

// Udpate Course Route
adminRouter.put(
  "/courses/:courseId",
  middleware.authenticateAdminJwt,
  middleware.findCourse,
  middleware.updateCourse,
  async (req, res) => {
    // logic to edit a course
    const course = await coursesCollection.findOneAndUpdate(
      { id: req.params.courseId },
      req.course,
      { new: true }
    );
    if (course) {
      res.status(200).send({ message: "Course Updated Successfully", course });
    } else {
      res.status(404).send("Course not found");
    }
  }
);

// Delete course
adminRouter.delete(
  "/courses/:courseId",
  middleware.authenticateAdminJwt,
  middleware.findCourse,
  async (req, res) => {
    const course = await coursesCollection.findByIdAndDelete(req.course._id);
    if (course) {
      res.status(200).send({ message: "Course Deleted Successfully", course });
    } else {
      res.status(500).send("Something went wrong");
    }
  }
);

// All Courses Route
adminRouter.get("/courses", middleware.authenticateAdminJwt, async (req, res) => {
  // logic to get all courses
  const allCourses = await coursesCollection.find({});
  if (allCourses) res.status(200).json({ data: allCourses });
  else res.status(404).json({ message: "Something went wrong" });
});


export { adminRouter };
