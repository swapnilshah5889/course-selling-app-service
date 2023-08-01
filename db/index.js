import mongoose from 'mongoose';

// MongoDB Setup

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    isFirebaseUser : Boolean
});

const adminSchema = new mongoose.Schema({
    username: String,
    password: String,
});

const coursesSchema = new mongoose.Schema({
    id:Number,
    title: String,
    description: String,
    price: Number,
    imageLink: String,
    published: Boolean
});

const purchasedCoursesSchema = new mongoose.Schema({
    username:String,
    courseId:Number
});


mongoose.connect('mongodb+srv://swapnilshah5889:%23799201Nag@cluster0.ngruj58.mongodb.net/course-app');
const usersCollection = mongoose.model('users', userSchema);
const adminsCollection = mongoose.model('admins', adminSchema);
const coursesCollection = mongoose.model('courses', coursesSchema);
const pCoursesCollection = mongoose.model('purchased_courses', purchasedCoursesSchema);

export {
    usersCollection,
    adminsCollection,
    coursesCollection,
    pCoursesCollection
}