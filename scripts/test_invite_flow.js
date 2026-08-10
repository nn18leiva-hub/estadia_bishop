require('dotenv').config();
const db = require('../src/config/db');
const { inviteUser } = require('../src/controllers/adminController');
const { login } = require('../src/controllers/authController');

async function testDirectInviteFlow() {
  console.log("🚀 Directly testing inviteUser logic & email dispatch...\n");

  const testEmail = `invited_admin_${Date.now()}@bmhs.edu.bz`;
  const req = {
    body: {
      name: 'Test Invited Admin',
      email: testEmail,
      phone: '+501 622-3344',
      role: 'admin',
      department: 'IT Administration'
    }
  };

  let responseData = null;
  let responseStatus = null;

  const res = {
    status: (code) => {
      responseStatus = code;
      return {
        json: (data) => { responseData = data; return data; }
      };
    },
    json: (data) => {
      responseStatus = 200;
      responseData = data;
      return data;
    }
  };

  try {
    await inviteUser(req, res);

    console.log("Response Status:", responseStatus);
    console.log("Response Data:", JSON.stringify(responseData, null, 2));

    if (responseStatus === 201) {
      console.log("\n✅ Account created successfully in DB.");

      // Check DB entry
      const dbCheck = await db.query('SELECT * FROM staff WHERE email = $1', [testEmail]);
      console.log("DB Staff record created:", {
        staff_id: dbCheck.rows[0].staff_id,
        full_name: dbCheck.rows[0].full_name,
        email: dbCheck.rows[0].email,
        role: dbCheck.rows[0].role,
        permissions: dbCheck.rows[0].permissions
      });

      // Wait 3 seconds for Nodemailer async send
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log("\n✅ Invite Email call completed successfully.");
    } else {
      console.error("❌ inviteUser returned non-201 status.");
    }
  } catch (err) {
    console.error("Error testing inviteUser:", err);
  } finally {
    process.exit(0);
  }
}

testDirectInviteFlow();
