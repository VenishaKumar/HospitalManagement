const bcrypt = require("bcrypt");
const { savePatient, findPatientByphone, saveAppointment, findAppointmentsByUser } = require("./model");

// Handle patient registration
const registerPatient = async (req, res) => {
  const { name, phone, password } = req.body;

  try {
    const existingPatient = await findPatientByphone(phone);
    if (existingPatient) {
      return res.status(400).json({ message: "Number already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newPatient = { name, phone, password: hashedPassword };
    await savePatient(newPatient);

    res.status(201).json({ message: "Registration successful. Redirecting to login..." });
  } catch (error) {
    console.error("Error in registerPatient:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Handle patient login
const loginPatient = async (req, res) => {
  const { phone, password } = req.body;

  try {
    const patient = await findPatientByphone(phone);
    if (!patient) {
      return res.status(400).json({ message: "Invalid number or password" });
    }

    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid number or password" });
    }

    req.session.user = { id: patient._id, name: patient.name, phone: patient.phone };

    res.status(200).json({ message: "Login successful", redirectUrl: "/home.html" });
  } catch (error) {
    console.error("Error in loginPatient:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Handle logout
const logoutPatient = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.clearCookie("connect.sid", { path: "/" });
    res.redirect("/login.html");
  });
};

// Handle appointment booking
const bookAppointment = async (req, res) => {
  const { doctor, date, time, reason } = req.body;

  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "User not logged in" });
  }

  try {
    const newAppointment = {
      userId: req.session.user.id,
      name: req.session.user.name,
      phone: req.session.user.phone,
      doctor,
      date,
      time,
      reason,
      status: "Pending"
    };

    await saveAppointment(newAppointment);
    console.log("Admin notification: New appointment request by", req.session.user.name);

    res.status(201).json({ message: "Appointment booked successfully, awaiting admin approval!" });
  } catch (error) {
    console.error("Error in bookAppointment:", error);
    res.status(500).json({ message: "Error booking appointment", error: error.message });
  }
};

// Get all appointments for logged-in user
const getAppointments = async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "User not logged in" });
  }

  try {
    const appointments = await findAppointmentsByUser(req.session.user.id);
    res.json({ appointments });
  } catch (error) {
    console.error("Error in getAppointments:", error);
    res.status(500).json({ message: "Error retrieving appointments", error: error.message });
  }
};

module.exports = { registerPatient, loginPatient, logoutPatient, bookAppointment, getAppointments };
