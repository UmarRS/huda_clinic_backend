const express = require("express");
const axios = require("axios");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();
const qs = require("querystring");

const app = express();
app.use(express.json());

// Enable CORS for all routes
app.use(cors({ origin: "http://localhost:3001" }));

// Use Morgan for logging HTTP requests
app.use(morgan("combined"));

const BASE_URL = "https://api.preview.platform.athenahealth.com/v1/1128700";
const CLIENT_ID = process.env.CLIENT_ID;
const SECRET = process.env.SECRET;

// Ensure API_KEY and API_SECRET are set
if (!CLIENT_ID || !SECRET) {
  console.error("API_KEY or API_SECRET is not set in the .env file.");
  process.exit(1); // Exit the application
}

async function getAccessToken() {
  const tokenUrl = `https://api.preview.platform.athenahealth.com/oauth2/v1/token`;

  // Prepare the data for the body
  const data = qs.stringify({
    grant_type: "client_credentials",
    scope: "athena/service/Athenanet.MDP.*",
  });

  // Prepare the header
  const auth = {
    username: CLIENT_ID,
    password: SECRET,
  };

  try {
    const response = await axios.post(tokenUrl, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      auth: auth,
    });

    console.log("Access token retrieved successfully");
    return response.data.access_token;
  } catch (error) {
    console.error("Error retrieving access token:", error.message);
    console.error(
      "Error response:",
      error.response ? error.response.data : "No response data"
    );
    throw new Error("Failed to retrieve access token");
  }
}

app.post("/register", async (req, res) => {
  console.log("Received patient data:", req.body);

  try {
    const accessToken = await getAccessToken();
    const patientData = {
      firstName: req.body.firstname,
      lastName: req.body.lastname,
      dob: req.body.dob,
      departmentID: parseInt(req.body.departmentid, 10),
      email: req.body.email,
    };
    console.log("Sending data to external API:", patientData);
    const response = await axios.post(`${BASE_URL}/patients`, patientData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    console.log("Patient registered successfully:", response.data);
    res.status(201).json(response.data);
  } catch (error) {
    console.error(
      "Error registering patient:",
      error.response ? error.response.data : error.message
    );
    res
      .status(400)
      .json({ error: error.response ? error.response.data : error.message });
  }
});

const port = process.env.PORT || 5007;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
