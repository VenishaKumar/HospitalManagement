const express = require("express");
const path = require("path"); // Add this
const { registerPatient, loginPatient, logoutPatient, getAppointments, bookAppointment, getPrescriptions ,getPatientProfile, updatePatientProfile,verifyAuthenticatorOTP,enable2FA} = require("./controller");

const router = express.Router();

// POST route for patient registration
router.post("/register", registerPatient);
router.post("/login", loginPatient);
router.post("/verify-otp", verifyAuthenticatorOTP);
router.get("/enable-2fa", enable2FA);
router.get("/logout",logoutPatient)
// Get Patient Profile
router.get("/profile", getPatientProfile);
router.post("/profile/update", updatePatientProfile);


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



// Add route for fetching prescriptions
router.get("/viewprescriptions", getPrescriptions)
module.exports = router;
