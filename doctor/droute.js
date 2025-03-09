const express = require("express");
const path = require("path");

const {
  loginDoctor,
  logoutDoctor,
  searchForPatients,
  addPrescription,viewPrescriptions,getDoctorAppointments

} = require("./doctor_controller");

const router = express.Router();

// Doctor login & logout routes
router.post("/login", loginDoctor);
router.get("/logout", logoutDoctor);

// Search patients
router.get("/search-patients", searchForPatients);

router.post("/add-prescription", addPrescription);

// View prescriptions for a patient
router.get("/view-prescriptions", viewPrescriptions);

router.get("/appointments", getDoctorAppointments);

module.exports = router;
