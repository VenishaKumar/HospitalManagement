const bcrypt = require("bcrypt");
const { savePatient, findPatientByphone } = require("./model");
const { saveAppointment, findAppointmentsByUser } = require("./model");

// Handle patient registration
const registerPatient = async (req, res) => {
  const { name, phone, password } = req.body;

  try {
    // Check if the patient already exists
    const existingPatient = await findPatientByphone(phone);
    if (existingPatient) {
      return res.status(400).json({ message: "Number already registered" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the patient to the database
    const newPatient = {
      name,
      phone,
      password: hashedPassword,
    };
    await savePatient(newPatient);

    res.redirect("/login.html");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const loginPatient = async (req, res) => {
  const { phone, password } = req.body;

  try {
    // Check if the patient exists
    const patient = await findPatientByphone(phone);
    if (!patient) {
      return res.status(400).json({ message: "Invalid number or password" });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid number or password" });
    }

    req.session.user={
      id:patient._id,
      name:patient.name,
      phone:patient.phone,
    };

    // Redirect to the home page on successful login
    res.redirect("/home.html");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const logoutPatient=(req,res)=>{
  req.session.destroy((err)=>{
    if (err){
    return res.ststus(500).json({message:"Error logging out"});
  }
  res.clearCookie("connect.sid", { path: "/" });
  res.redirect("/login.html")
}
  
)
};



// Handle appointment booking
const bookAppointment = async (req, res) => {
    const { doctor, date, time, reason } = req.body;
    
    if (!req.session.user) {
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
            status: "Pending" // Default status is 'Pending'
        };

        await saveAppointment(newAppointment);

        
        console.log("Admin notification: New appointment request by", req.session.user.name);

        res.status(201).json({ message: "Appointment booked successfully, awaiting admin approval!" });
    } catch (error) {
        res.status(500).json({ message: "Error booking appointment", error });
    }
};

//Get all appointments for logged-in user
const getAppointments = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "User not logged in" });
    }

    try {
        const appointments = await findAppointmentsByUser(req.session.user.id);
         res.json({ appointments });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving appointments", error });

    }
};










module.exports = { registerPatient, loginPatient ,logoutPatient,bookAppointment, getAppointments};



