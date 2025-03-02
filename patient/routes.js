const express = require("express");
const { registerPatient, loginPatient,logoutPatient, getAppointments ,bookAppointment} = require("./controller");
const router = express.Router();

// POST route for patient registration
router.post("/register", registerPatient);
router.post("/login", loginPatient);
router.get("/logout",logoutPatient)

router.get("/session",(req,res) =>{
  if(req.session.user){
    res.json({user:req.session.user})
  }
  else{
    res.json({user:null})
  }
}
);
router.get("/home", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html"); // Redirect if no active session
  }
  res.sendFile(path.join(__dirname, "../public/home.html"));
});
router.get("/appointments",getAppointments)
router.post("/book-appointment", bookAppointment);

module.exports = router;
