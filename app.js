const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");

const patientRoutes = require("./patient/routes");
const doctorRoutes = require("./doctor/droute");
const adminRoutes = require("./admin/admin_routes");




const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Prevent caching issues
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup
app.use(
  session({
    secret: "hospital_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Serve the homepage (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Use patient and doctor routes
app.use("/patient", patientRoutes);
app.use("/doctor", doctorRoutes);
app.use("/admin", adminRoutes);

// Start the server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
