const express = require("express");
const bodyParser = require("body-parser");
const session=require('express-session')
const path = require("path");

const patientRoutes = require("./patient/routes"); // Import patient routes

const app = express();

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});



// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//session 
app.use(session({
  secret:"hospital_key",
  resave:false,
  saveUninitialized:true,
  cookie:{secure:false},
  }));

// Root route to prevent "Cannot GET /"
app.get("/", (req, res) => {
  res.send("Welcome to the Hospital Management System! /n <a href='register.html'>register</a>" );
});

// Use patient routes
app.use("/patient", patientRoutes);

// Start the server
//const PORT = process.env.PORT || 5001;
app.listen(5000, () => {
  console.log('Server running on port 5000');
});
