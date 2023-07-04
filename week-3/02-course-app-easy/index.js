const express = require('express');
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const adminAuthentication  = (req,res,next) =>{
  const headers = req.headers
  const admin = ADMINS.find(ele => ele.username ===headers.username && ele.password === headers.password)
 
  if(admin){
    next();
  }else{
    res.status(403).json({ message: 'Admin authentication failed' });
  }
}
const userAuthentication  = (req,res,next) =>{
  const headers = req.headers
  const user = USERS.find(ele => ele.username ===headers.username && ele.password === headers.password)
 
  if( req.user = user){
    req.user = user
    next();
  }else{
    res.status(403).json({ message: 'user authentication failed' });
  }
}

// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const body = req.body;
  const exist = ADMINS.find(ele => ele.username === body.username )
  if(exist){
    res.status(401).send("admin already exists!")
  }else{
    ADMINS.push(body);
    res.status(201).json({message:"Admin created successfully"})
  }
});

app.post('/admin/login', adminAuthentication, (req, res) => {
  // logic to log in admin
  res.status(200).json({ message: 'Logged in successfully' })
  
});

app.post('/admin/courses', adminAuthentication, (req, res) => {
  // logic to create a course
  const {body} = req
 
  COURSES.push({...body,courseId: COURSES.length+1})
  res.status(201).json({message: 'Course created successfully', courseId: COURSES.length+1 })
  
});

app.put('/admin/courses/:courseId', adminAuthentication, (req, res) => {
  // logic to edit a course
  const {body, params} = req
  
  const course = COURSES.find(ele => ele.courseId === Number(params.courseId))
  Object.assign(course, body)
  res.status(201).json({ message: 'Course updated successfully' })
  
});

app.get('/admin/courses', adminAuthentication, (req, res) => {
  // logic to get all courses
  res.status(201).json({courses:COURSES})
  
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const {body} = req
  const exist = USERS.find(ele => ele.username === body.username && ele.password === body.password)
  if(exist){
    res.send("user already exist")
  }else{
    USERS.push({...body, purchasedCourses:[]})
    res.status(201).json({ message: 'User created successfully' })
  }
});

app.post('/users/login', userAuthentication, (req, res) => {
  // logic to log in user
  res.json({ message: 'Logged in successfully' })
});

app.get('/users/courses', userAuthentication, (req, res) => {
  // logic to list all courses
  res.json({courses:COURSES})
});

app.post('/users/courses/:courseId', userAuthentication, (req, res) => {
  // logic to purchase a course
  const {params} = req
  const courseId = params.courseId
  const course = COURSES.find(ele => ele.courseId === Number(courseId))
  const user = USERS.find(ele => ele.username === req.headers.username)
  user.purchasedCourses.push(course)
  res.json({ message: 'Course purchased successfully' })
  
});

app.get('/users/purchasedCourses', userAuthentication, (req, res) => {
  // logic to view purchased courses
  res.json({purchasedCourses:req.user.purchasedCourses})
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
