const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

const bcrypt = require("bcrypt");
const { savePatient, findPatientByphone,updatePatient2FA, getPatient2FASecret } = require("./model");
const { saveAppointment, findAppointmentsByUser,getPrescriptionsByPhone,updatePatient } = require("./model");
const path = require("path");
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
      const patient = await findPatientByphone(phone);
      if (!patient) {
          return res.send(`<script>alert("Invalid phone or password."); window.location.href="/login.html";</script>`);
      }

      const isMatch = await bcrypt.compare(password, patient.password);
      if (!isMatch) {
          return res.send(`<script>alert("Invalid phone or password."); window.location.href="/login.html";</script>`);
      }

      // If 2FA is enabled, redirect to OTP page
      if (patient.secret) {
        req.session.tempUser = { 
            phone: patient.phone,
            name: patient.name // ✅ Now storing name in tempUser
        };
          return res.redirect("/otp.html"); // ✅ Redirects to OTP page
      }

      // If no 2FA, log in normally
      req.session.user = {
        phone: patient.phone,
        name: patient.name // ✅ Now session includes name
    };
      res.redirect("/home.html"); // ✅ Redirects to home

  } catch (error) {
      console.error("❌ Error during login:", error);
      res.send(`<script>alert("Server error. Please try again later."); window.location.href="/login.html";</script>`);
  }
};

// Step 2: Verify OTP and Complete Login
const verifyAuthenticatorOTP = async (req, res) => {
  const { phone, token } = req.body;

  if (!req.session.tempUser || req.session.tempUser.phone !== phone) {
      return res.send(`<script>alert("Unauthorized. Please log in again."); window.location.href="/login.html";</script>`);
  }

  const secret = await getPatient2FASecret(phone);
  if (!secret) {
      return res.send(`<script>alert("2FA not set up. Please contact support."); window.location.href="/login.html";</script>`);
  }

  const isValid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1
  });

  if (!isValid) {
      return res.send(`<script>alert("Invalid OTP. Try again."); window.location.href="/otp.html";</script>`);
  }

  req.session.user = req.session.tempUser; 
  //delete req.session.tempUser;

  res.redirect("/home.html");
};

const enable2FA = async (req, res) => {
  if (!req.session.user) {
      return res.send(`<script>alert("Unauthorized. Please log in."); window.location.href="/login.html";</script>`);
  }

  const phone = req.session.user.phone;

  // Check if 2FA is already enabled
  const existingSecret = await getPatient2FASecret(phone);
  if (existingSecret) {
      return res.send(`<script>alert("2FA is already enabled."); window.location.href="/home.html";</script>`);
  }

  // Generate a new secret key
  const secret = speakeasy.generateSecret({ length: 20 });

  // Store the secret in the database
  await updatePatient2FA(phone, secret.base32);

  // Generate a QR Code for Google Authenticator
  QRCode.toDataURL(secret.otpauth_url, (err, qrCodeData) => {
      if (err) {
          return res.send(`<script>alert("Error generating QR code."); window.location.href="/home.html";</script>`);
      }
      
      // Show QR Code & Secret Key
      res.send(`
          <html>
          <head>
              <title>Enable 2FA</title>
              <style>
                  body { text-align: center; font-family: Arial, sans-serif; }
                  img { width: 200px; margin: 20px; }
              </style>
          </head>
          <body>
              <h2>Enable Google Authenticator</h2>
              <p>Scan the QR code below using Google Authenticator:</p>
              <img src="${qrCodeData}" alt="QR Code">
              <p>Or manually enter this key in Google Authenticator:</p>
              <strong>${secret.base32}</strong>
              <br><br>
              <a href="/home.html">Go to Home</a>
          </body>
          </html>
      `);
  });
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
      const appointments = await findAppointmentsByUser(req.session.user.name);
      res.json({ appointments });
  } catch (error) {
      res.status(500).json({ message: "Error retrieving appointments", error });
  }
};





// Get prescriptions for logged-in patient
const getPrescriptions = async (req, res) => {
  if (!req.session.user) {
      return res.status(401).send("<h3>Error: User not logged in</h3>");
  }

  const phoneNumber = req.session.user.phone; // Retrieve phone from session

  try {
      const prescriptions = await getPrescriptionsByPhone(phoneNumber);

      if (!prescriptions.length) {
          return res.send("<h3>No prescriptions found.</h3>");
      }

      let prescriptionHTML = "<h2>My Prescriptions</h2>";
      
      prescriptions.forEach(prescription => {
          let medicinesList = prescription.medicines.map(med => 
              `<li>${med.name} - ${med.dosage} (${med.instructions || "No instructions"})</li>`
          ).join("");

          prescriptionHTML += `
              <div class="prescription-card">
                  <h3>Doctor: ${prescription.doctor.name}</h3>
                  <p><strong>Diagnosis:</strong> ${prescription.diagnosis}</p>
                  <p><strong>Date:</strong> ${new Date(prescription.date).toLocaleDateString()}</p>
                  <h4>Medicines:</h4>
                  <ul>${medicinesList}</ul>
                  <p><strong>Additional Notes:</strong> ${prescription.additionalInstructions || "None"}</p>
              </div>
          `;
      });

      res.send(prescriptionHTML);

  } catch (error) {
      console.error("❌ Error retrieving prescriptions:", error);
      res.send("<h3>Error retrieving prescriptions</h3>");
  }
};




const getPatientProfile = async (req, res) => {
  if (!req.session.user || !req.session.user.phone) {
      return res.status(401).send("<h3>Error: User not logged in</h3>");
  }

  const phoneNumber = req.session.user.phone; // Retrieve phone from session

  try {
      const patient = await findPatientByphone(phoneNumber);

      if (!patient) {
          return res.status(404).send("<h3>Patient not found</h3>");
      }

      // Generate the HTML for displaying patient details
      let patientHTML = `
          <h2>Patient Profile</h2>
          <p><strong>Name:</strong> ${patient.name || "Not provided"}</p>
          <p><strong>Phone:</strong> ${patient.phone || "Not provided"}</p>
          <p><strong>Email:</strong> ${patient.email || "Not provided"}</p>
          <p><strong>DOB:</strong> ${patient.dob || "Not provided"}</p>
          <p><strong>Gender:</strong> ${patient.gender || "Not specified"}</p>
          <p><strong>Blood Group:</strong> ${patient.bloodGroup || "Not provided"}</p>
          <p><strong>Address:</strong> ${patient.address || "Not provided"}</p>
          <p><strong>Allergies:</strong> ${patient.allergies || "Not provided"}</p>
          <p><strong>Chronic Illnesses:</strong> ${patient.chronicIllnesses || "Not provided"}</p>
          <p><strong>Current Medications:</strong> ${patient.currentMedications || "Not provided"}</p>
          <p><strong>Past Surgeries:</strong> ${patient.pastSurgeries || "Not provided"}</p>
      `;

      res.send(patientHTML); // Send the generated HTML

  } catch (error) {
      console.error("❌ Error retrieving patient profile:", error);
      res.send("<h3>Error retrieving patient profile</h3>");
  }
};








const updatePatientProfile = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "User not logged in" });
  }

  const {
    name, email, dob, age, gender, bloodGroup, address,
    chronicIllnesses, pastSurgeries, allergies, currentMedications,
    emergencyContact, insurance
  } = req.body;

  try {
    await updatePatient(req.session.user.phone, {
      name, email, dob, age, gender, bloodGroup, address,
      chronicIllnesses, pastSurgeries, allergies, currentMedications,
      emergencyContact, insurance
    });

    req.session.user.name = name; // Update session info
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile" });
  }
};












module.exports = { registerPatient, loginPatient ,logoutPatient,bookAppointment, getAppointments,getPrescriptions,getPatientProfile,updatePatientProfile,verifyAuthenticatorOTP,enable2FA};



