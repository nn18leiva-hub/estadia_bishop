const fs = require('fs');

async function checkAllWorkflows() {
    console.log("===================================");
    console.log("   V2 COMPREHENSIVE WORKFLOW TEST");
    console.log("===================================\n");
    
    let passedTests = 0;
    let totalTests = 0;

    const assertCondition = async (res, expectedStatus, testName) => {
        totalTests++;
        let dataStr = '';
        try {
            dataStr = await res.text();
        } catch(e) {}
        
        let condition = res.status === expectedStatus || (Array.isArray(expectedStatus) && expectedStatus.includes(res.status));
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passedTests++;
        } else {
            console.error(`❌ [FAIL] ${testName} (Status: ${res.status}) - ${dataStr}`);
        }
        try { return JSON.parse(dataStr); } catch(e) { return {}; }
    };

    const baseURL = 'http://localhost:3000';

    try {
        // --- SETUP TEST USERS ---
        const db = require('../src/config/db');
        const bcrypt = require('bcrypt');
        const vHash = await bcrypt.hash('password123', 10);
        await db.query("INSERT INTO staff (full_name, email, password_hash, role) VALUES ('Admin User', 'admin@bmhs.edu.bz', $1, 'staff') ON CONFLICT DO NOTHING", [vHash]);
        await db.query("INSERT INTO staff (full_name, email, password_hash, role) VALUES ('Super Admin', 'superadmin@bmhs.edu.bz', $1, 'admin') ON CONFLICT DO NOTHING", [vHash]);
        await db.query("INSERT INTO staff (full_name, email, password_hash, role) VALUES ('Viewer User', 'viewer@tester.bz', $1, 'viewer') ON CONFLICT DO NOTHING", [vHash]);

        // --- SETUP DUMMY IMAGE ---
        const imageBlob = new Blob(['dummy image content'], { type: 'image/png' });

        console.log("--- PHASE 2: PARENT OVERVIEW ---");
        
        // 1. Parent Registration
        const parentEmail = `parent_${Date.now()}@test.com`;
        let res = await fetch(`${baseURL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: 'Test Mom',
                email: parentEmail,
                phone: '5551234',
                password: 'password123',
                user_type: 'parent',
                dob: '1980-01-01'
            })
        });
        const parentData = await assertCondition(res, 201, "Parent Registration");
        
        // 2. Parent Login
        res = await fetch(`${baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: parentEmail, password: 'password123' })
        });
        const loginData = await assertCondition(res, 200, "Parent Login");
        let parentToken = loginData.token;

        // 2b. Parent requests password reset code
        res = await fetch(`${baseURL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: parentEmail })
        });
        await assertCondition(res, 200, "Parent requests password reset code");

        // Fetch the generated 6-digit code from database to simulate reading the email
        const codeResult = await db.query('SELECT token FROM password_resets WHERE email = $1 ORDER BY created_at DESC LIMIT 1', [parentEmail]);
        const resetCode = codeResult.rows[0]?.token;
        if (!resetCode) throw new Error("Reset code was not saved in database.");

        // 2c. Parent resets password with 6-digit code
        res = await fetch(`${baseURL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: parentEmail, token: resetCode, newPassword: 'newpassword123' })
        });
        await assertCondition(res, 200, "Parent resets password with 6-digit code");

        // 2d. Parent logs in with new password
        res = await fetch(`${baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: parentEmail, password: 'newpassword123' })
        });
        const newLoginData = await assertCondition(res, 200, "Parent logs in with new password");
        parentToken = newLoginData.token;

        // 3. Parent Submits Enrolment Letter with ID image (Requires payment, no signature)
        let fd = new FormData();
        fd.append('document_type_id', 4); // enrolment_letter
        fd.append('student_full_name', 'Child One');
        fd.append('delivery_method', 'pickup');
        fd.append('id_image', imageBlob, 'id_card.png');
        res = await fetch(`${baseURL}/api/requests/create`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${parentToken}` },
            body: fd
        });
        const enrolmentData = await assertCondition(res, [200, 201], "Parent creates Enrolment Letter with ID");
        const absenceReqId = enrolmentData?.request?.request_id || enrolmentData?.request_id;
        
        console.log("\n--- PHASE 3: STAFF & ADMIN PROCESSING ---");
        
        // 6. Admin Login
        res = await fetch(`${baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@bmhs.edu.bz', password: 'password123' })
        });
        const adminLogin = await assertCondition(res, 200, "Admin Login");
        const adminToken = adminLogin.token;

        // 7. Admin fetches all pending requests
        res = await fetch(`${baseURL}/api/staff/requests`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const allReqs = await assertCondition(res, 200, "Admin fetches all pending requests");

        // 8. Admin validates SSN & sets to Ready
        if (absenceReqId) {
            const parentId = parentData.user?.parent_id;
            if (parentId) {
                res = await fetch(`${baseURL}/api/staff/verifications/${parentId}`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'approved' })
                });
                await assertCondition(res, 200, "Admin verifies Parent ID");
            }

            // Insert a verified payment record so request can be processed
            await db.query(
                "INSERT INTO payments (request_id, receipt_image_path, transfer_reference, verified, verified_by_staff_id) VALUES ($1, 'uploads/receipts/test.png', 'REF123', TRUE, 1) ON CONFLICT DO NOTHING",
                [absenceReqId]
            );

            res = await fetch(`${baseURL}/api/staff/update-request-status`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: absenceReqId,
                    status: 'ready_for_pickup'
                })
            });
            const patchRes = await assertCondition(res, 200, "Admin modifies request status to ready_for_pickup");
        } else {
            console.error("❌ [FAIL] Admin modifies request status (No ID found)");
        }

        console.log("\n--- PHASE 4: SUPER ADMIN & VIEWER CONSTRAINTS ---");
        
        // Viewer is already created at the start of checkAllWorkflows

        // 9. Viewer Login
        res = await fetch(`${baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'viewer@tester.bz', password: 'password123' })
        });
        const viewerLogin = await assertCondition(res, 200, "Viewer Login");
        const viewerToken = viewerLogin.token;

        // 10. Viewer tries to modify a request (Should fail 403)
        res = await fetch(`${baseURL}/api/staff/update-request-status`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${viewerToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                request_id: absenceReqId || 1,
                status: 'denied'
            })
        });
        await assertCondition(res, 403, "Viewer Sandbox restriction enforced (403 on PATCH)");

        // 11. Super Admin Login
        await db.query("UPDATE staff SET password_hash = $1 WHERE email = 'superadmin@bmhs.edu.bz'", [vHash]);
        res = await fetch(`${baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'superadmin@bmhs.edu.bz', password: 'password123' })
        });
        const saLogin = await assertCondition(res, 200, "Super Admin Login");
        const superToken = saLogin.token;

        // 12. Super Admin fetches Staff
        res = await fetch(`${baseURL}/api/superadmin/staff`, {
            headers: { 'Authorization': `Bearer ${superToken}` }
        });
        const staffList = await assertCondition(res, 200, "Super Admin accesses Staff Directory");

        console.log(`\nTEST RUN COMPLETE: ${passedTests}/${totalTests} Passed.`);
        process.exit(passedTests === totalTests ? 0 : 1);
    } catch(e) {
        console.error("Error running tests:", e);
        process.exit(1);
    }
}

checkAllWorkflows();
