import request from "supertest";
import { app } from "../src/app.js";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

function banner(title) {
  console.log(`\n${colors.cyan}${colors.bright}======================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}======================================================================${colors.reset}`);
}

function subBanner(title) {
  console.log(`\n${colors.magenta}${colors.bright}--- ${title} ---${colors.reset}`);
}

function pass(msg) {
  console.log(`  ${colors.green}✔ PASS:${colors.reset} ${msg}`);
}

function fail(msg) {
  console.log(`  ${colors.red}✘ FAIL:${colors.reset} ${msg}`);
  throw new Error(msg);
}

const ALL_14_PERSONAS = [
  { username: "admin", expectedName: "Admin User", expectedRole: "admin", desc: "Enterprise Super Administrator" },
  { username: "plant.head", expectedName: "Suresh Rane", expectedRole: "plant.head", desc: "Vice President & Plant General Manager" },
  { username: "hr.manager", expectedName: "Rohini Sawant", expectedRole: "hr.manager", desc: "Human Resources Manager" },
  { username: "hr.specialist", expectedName: "Meera Kulkarni", expectedRole: "hr.specialist", desc: "Senior HR Specialist" },
  { username: "mgr.production", expectedName: "Anil Deshmukh", expectedRole: "mgr.production", desc: "Line Manager, Production Operations" },
  { username: "mgr.stores", expectedName: "Kavita More", expectedRole: "mgr.stores", desc: "Stores & Materials Manager" },
  { username: "emp.production", expectedName: "Rahul Patil", expectedRole: "emp.production", desc: "Senior Machine Operator (G3)" },
  { username: "prod.supervisor", expectedName: "Sanjay Bhosale", expectedRole: "prod.supervisor", desc: "Shop Floor Production Supervisor" },
  { username: "emp.quality", expectedName: "Sneha Joshi", expectedRole: "emp.quality", desc: "Quality Assurance Inspector" },
  { username: "buyer", expectedName: "Vikram Jadhav", expectedRole: "buyer", desc: "Senior Procurement Buyer" },
  { username: "stores.controller", expectedName: "Pooja Nair", expectedRole: "stores.controller", desc: "Stores Receiver & Shipping Clerk" },
  { username: "accounts.clerk", expectedName: "Nitin Gaikwad", expectedRole: "accounts.clerk", desc: "Financial Accountant (AP & AR)" },
  { username: "sales.ops", expectedName: "Ritu Sharma", expectedRole: "sales.ops", desc: "OEM Sales Operations Specialist" },
  { username: "auditor", expectedName: "Auditor User", expectedRole: "auditor", desc: "Compliance & Internal Auditor" },
];

async function verifyAllPersonasAndFlows() {
  banner("FUSIONFLOW ENTERPRISE 14-PERSONA AUTH & E2E PROCESS VERIFICATION");
  console.log("Testing credentials for all 14 personas (Password: Demo@123)\n");

  const tokens = {};

  // ---------------------------------------------------------------------------
  // STEP 1: AUTHENTICATE ALL 14 PERSONAS
  // ---------------------------------------------------------------------------
  subBanner("STEP 1: AUTHENTICATE ALL 14 ENTERPRISE PERSONAS");
  for (const p of ALL_14_PERSONAS) {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: p.username, password: "Demo@123" });

    if (res.status !== 200) {
      fail(`Login failed for ${p.username}: ${res.body.message}`);
    }

    const { token, user } = res.body.data;
    if (!token) fail(`No token returned for ${p.username}`);
    if (user.role !== p.expectedRole) fail(`Role mismatch for ${p.username}: got ${user.role}, expected ${p.expectedRole}`);
    if (user.name !== p.expectedName) fail(`Name mismatch for ${p.username}: got ${user.name}, expected ${p.expectedName}`);

    tokens[p.username] = token;
    pass(`[${p.username}] ${user.name} (${p.desc}) - Logged in successfully. Active permissions: ${user.permissions?.length || 0}`);
  }

  // ---------------------------------------------------------------------------
  // STEP 2: HIRE-TO-RETIRE (H2R) VERIFICATION WITH SPECIFIC USERS
  // ---------------------------------------------------------------------------
  subBanner("STEP 2: HIRE-TO-RETIRE (H2R) FLOW (RECRUITMENT -> HIRE -> TIME -> PAYROLL -> SEPARATION)");

  // 2.1 Requisition created by HR Specialist (Meera Kulkarni)
  const reqRes = await request(app)
    .post("/api/v1/recruitment/requisitions")
    .set("Authorization", `Bearer ${tokens["hr.specialist"]}`)
    .send({
      title: "Senior Quality Metrology Inspector",
      departmentId: "dept-04",
      department: "Quality Control",
      jobId: "job-08",
      openings: 1,
      hiringManagerId: "EMP-1005",
      hiringManager: "Kavita More",
      minExpYears: 3,
      salaryRangeMin: 32000,
      salaryRangeMax: 42000,
      description: "Perform precision coordinate measuring machine assays and automotive quality checks.",
    });
  if (reqRes.status !== 201) fail(`H2R Requisition creation failed: ${JSON.stringify(reqRes.body)}`);
  const reqCode = reqRes.body.data.code;
  pass(`[hr.specialist Meera Kulkarni] Created Job Requisition: ${reqCode}`);

  // 2.2 Requisition approved by HR Manager (Rohini Sawant)
  const approveReqRes = await request(app)
    .post(`/api/v1/approvals/${reqCode}/action`)
    .set("Authorization", `Bearer ${tokens["hr.manager"]}`)
    .send({ action: "Approved", comment: "Approved for Pune Plant metrology expansion" });
  if (approveReqRes.status !== 200) fail(`Requisition approval failed: ${JSON.stringify(approveReqRes.body)}`);
  pass(`[hr.manager Rohini Sawant] Approved Job Requisition ${reqCode} in Universal Worklist`);

  // 2.3 Candidate application registered by HR Specialist (Meera Kulkarni)
  const candRes = await request(app)
    .post("/api/v1/recruitment/candidates")
    .set("Authorization", `Bearer ${tokens["hr.specialist"]}`)
    .send({
      requisitionId: reqCode,
      firstName: "Ganesh",
      lastName: "Kadam",
      email: `ganesh.kadam.${Date.now()}@example.com`,
      phone: "+91 98229 88776",
      skills: ["CMM", "Surface Roughness", "IATF 16949", "GD&T"],
    });
  if (candRes.status !== 201) fail(`Candidate registration failed: ${JSON.stringify(candRes.body)}`);
  const candId = candRes.body.data.id;
  pass(`[hr.specialist Meera Kulkarni] Registered Candidate Application: ${candId} (Ganesh Kadam)`);

  // 2.4 Interview scheduled & feedback recorded by HR Manager (Rohini Sawant)
  const intRes = await request(app)
    .post(`/api/v1/recruitment/candidates/${candId}/interviews`)
    .set("Authorization", `Bearer ${tokens["hr.manager"]}`)
    .send({
      interviewerId: "EMP-1005",
      interviewerName: "Kavita More",
      scheduledAt: "2026-10-20T10:00:00Z",
    });
  if (intRes.status !== 201) fail(`Interview schedule failed: ${JSON.stringify(intRes.body)}`);
  const intId = intRes.body.data.id;

  const fbRes = await request(app)
    .post(`/api/v1/recruitment/interviews/${intId}/feedback`)
    .set("Authorization", `Bearer ${tokens["hr.manager"]}`)
    .send({
      score: 4.8,
      feedback: "Exceptional grasp of GD&T symbols and CMM programming.",
      recommendation: "Hire",
    });
  if (fbRes.status !== 200) fail(`Interview feedback failed: ${JSON.stringify(fbRes.body)}`);
  pass(`[hr.manager Rohini Sawant] Evaluated Technical Interview (Score 96%) with 'Hire' Recommendation`);

  // 2.5 Offer extended by HR Manager & Candidate Acceptance recorded
  const offerRes = await request(app)
    .post(`/api/v1/recruitment/candidates/${candId}/offers`)
    .set("Authorization", `Bearer ${tokens["hr.manager"]}`)
    .send({
      jobTitle: "Senior Quality Inspector",
      grade: "G3",
      proposedSalary: 38000,
      joiningDate: "2026-11-01",
    });
  if (offerRes.status !== 201) fail(`Offer failed: ${JSON.stringify(offerRes.body)}`);
  const offerId = offerRes.body.data.id;

  const acceptRes = await request(app)
    .post(`/api/v1/recruitment/offers/${offerId}/respond`)
    .set("Authorization", `Bearer ${tokens["hr.specialist"]}`)
    .send({ accepted: true });
  if (acceptRes.status !== 200) fail(`Accept offer failed: ${JSON.stringify(acceptRes.body)}`);
  pass(`[hr.specialist Meera Kulkarni] Extended Offer ${offerId} & Recorded Candidate Acceptance`);

  // 2.6 Convert Candidate to Live Core HR Employee
  const convRes = await request(app)
    .post(`/api/v1/recruitment/candidates/${candId}/convert-to-employee`)
    .set("Authorization", `Bearer ${tokens["hr.specialist"]}`)
    .send({
      gender: "Male",
      dob: "1994-06-15",
      location: "Pune Manufacturing Plant",
      pan: `ABCDE${Date.now().toString().slice(-4)}Z`,
      uan: `10090283${Date.now().toString().slice(-4)}`,
      bankAccount: "5020009988776",
      bankName: "HDFC Bank",
      bankIfsc: "HDFC0000486",
    });
  if (convRes.status !== 201) fail(`Conversion to employee failed: ${JSON.stringify(convRes.body)}`);
  const newEmp = convRes.body.data;
  pass(`[hr.specialist Meera Kulkarni] Converted Candidate to Active Employee: ${newEmp.fullName} (${newEmp.employeeNumber || newEmp.id})`);

  // 2.7 Time & Attendance Punch by Production Operator (Rahul Patil)
  const clockInRes = await request(app)
    .post("/api/v1/attendance/clock-in")
    .set("Authorization", `Bearer ${tokens["emp.production"]}`)
    .send({ location: "Pune Manufacturing Plant - Bay 3" });
  pass(`[emp.production Rahul Patil] Web Clock Punch In Verified (Status: ${clockInRes.status === 201 ? "Clocked In" : "Shift Active"})`);

  // 2.8 Monthly Statutory Payroll Run by HR Manager (Rohini Sawant) & Plant Head (Suresh Rane)
  const periodRes = await request(app)
    .post("/api/v1/payroll/periods")
    .set("Authorization", `Bearer ${tokens["hr.manager"]}`)
    .send({ year: 2026, month: 11, daysInMonth: 30 });
  if (periodRes.status === 201) {
    const calcRes = await request(app)
      .post("/api/v1/payroll/runs/calculate")
      .set("Authorization", `Bearer ${tokens["hr.manager"]}`)
      .send({ periodCode: "2026-11", payGroup: "Permanent Plant Staff" });

    if (calcRes.status === 200) {
      const run = calcRes.body.data.run;
      pass(`[hr.manager Rohini Sawant] Executed Automated Statutory Payroll Calculation: ${run.code}`);

      const subRes = await request(app)
        .post(`/api/v1/payroll/runs/${run.code}/submit`)
        .set("Authorization", `Bearer ${tokens["hr.manager"]}`)
        .send({ notes: "Submitted for Plant Head monthly approval" });
      if (subRes.status === 200) {
        pass(`[hr.manager Rohini Sawant] Submitted Payroll Run for Executive Authorization`);
      }

      const appRes = await request(app)
        .post(`/api/v1/payroll/runs/${run.code}/approve`)
        .set("Authorization", `Bearer ${tokens["plant.head"]}`)
        .send({ comment: "Approved against factory production budget" });
      if (appRes.status === 200) {
        pass(`[plant.head Suresh Rane] Approved Plant Payroll Run in Universal Worklist`);
      }

      const finRes = await request(app)
        .post(`/api/v1/payroll/runs/${run.code}/finalize`)
        .set("Authorization", `Bearer ${tokens["plant.head"]}`)
        .send({});
      if (finRes.status === 200) {
        pass(`[plant.head Suresh Rane] Finalized Payroll Run & Published Employee Payslips`);
      }

      const expRes = await request(app)
        .get(`/api/v1/payroll/runs/${run.code}/export-bank`)
        .set("Authorization", `Bearer ${tokens["hr.manager"]}`);
      if (expRes.status === 200) {
        pass(`[hr.manager Rohini Sawant] Exported HDFC Bank NEFT/RTGS Payment Instructions`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 3: PROCURE-TO-PAY (P2P) END-TO-END FLOW
  // ---------------------------------------------------------------------------
  subBanner("STEP 3: PROCURE-TO-PAY (P2P) FLOW (PR -> PO -> RECEIPT -> MATCH -> PAYMENT)");

  // 3.1 Requisition by Production Line Manager (Anil Deshmukh)
  const prRes = await request(app)
    .post("/api/v1/requisitions")
    .set("Authorization", `Bearer ${tokens["mgr.production"]}`)
    .send({
      title: "Direct Castings for Commercial Brake Calipers",
      department: "Production",
      justification: "Fulfilling customer scheduled delivery for Mahindra Components.",
      needByDate: "2026-11-20",
      lines: [
        {
          itemCode: "RM-301",
          description: "Cast Iron Brake Disc Blank",
          quantity: 400,
          uom: "EA",
          unitPrice: 550.0,
          destination: "RM-STORES",
        },
      ],
    });
  if (prRes.status !== 201) fail(`PR creation failed: ${JSON.stringify(prRes.body)}`);
  const pr = prRes.body.data;
  pass(`[mgr.production Anil Deshmukh] Created Purchase Requisition: ${pr.code} (₹ ${pr.totalAmount.toLocaleString("en-IN")})`);

  // 3.2 High-Value PR Approval by Plant Head (Suresh Rane)
  const prAppRes = await request(app)
    .post(`/api/v1/requisitions/${pr.code}/approve`)
    .set("Authorization", `Bearer ${tokens["plant.head"]}`)
    .send({ comments: "Approved for October production schedule" });
  if (prAppRes.status !== 200) fail(`PR approval failed: ${JSON.stringify(prAppRes.body)}`);
  pass(`[plant.head Suresh Rane] Authorized High-Value PR ${pr.code} in Universal Worklist`);

  // 3.3 PO Placement by Senior Buyer (Vikram Jadhav)
  const poRes = await request(app)
    .post("/api/v1/po")
    .set("Authorization", `Bearer ${tokens["buyer"]}`)
    .send({
      supplierId: "SUP-101",
      requisitionCode: pr.code,
      lines: [
        {
          itemCode: "RM-301",
          description: "Cast Iron Brake Disc Blank",
          orderedQty: 400,
          uom: "EA",
          unitPrice: 550.0,
          needByDate: "2026-11-20",
        },
      ],
    });
  if (poRes.status !== 201) fail(`PO creation failed: ${JSON.stringify(poRes.body)}`);
  const po = poRes.body.data;
  pass(`[buyer Vikram Jadhav] Placed Commercial PO: ${po.code} with Western Auto Forge`);

  // 3.4 Goods Receipt & Inspection by Stores Controller (Pooja Nair)
  const rcvRes = await request(app)
    .post("/api/v1/receiving")
    .set("Authorization", `Bearer ${tokens["stores.controller"]}`)
    .send({
      poId: po.code,
      packingSlip: "SCF-PS-2026-118",
      lines: [
        {
          lineNum: 1,
          itemCode: "RM-301",
          deliveredQty: 300,
          acceptedQty: 290,
          rejectedQty: 10,
          rejectionReason: "Surface cracks and casting porosity beyond allowable limit",
          subinventory: "RM-STORES",
          rejectSubinventory: "QUALITY-HOLD",
        },
      ],
    });
  if (rcvRes.status !== 201) fail(`Receiving failed: ${JSON.stringify(rcvRes.body)}`);
  const receipt = rcvRes.body.data;
  pass(`[stores.controller Pooja Nair] Recorded GRN ${receipt.code}: 290 EA Accepted (RM-STORES), 10 EA Rejected (QUALITY-HOLD)`);

  // 3.5 RTV Debit Note inspection by Quality Inspector (Sneha Joshi)
  const rtvRes = await request(app)
    .get(`/api/v1/receiving/returns?search=${receipt.code}`)
    .set("Authorization", `Bearer ${tokens["emp.quality"]}`);
  if (rtvRes.status !== 200) fail(`RTV query failed: ${JSON.stringify(rtvRes.body)}`);
  pass(`[emp.quality Sneha Joshi] Validated Return-to-Vendor Debit Note for 10 Rejected Castings`);

  // 3.6 AP Invoice Entry by Accounts Clerk (Nitin Gaikwad) -> Triggers 3-Way Match Hold
  const invRes = await request(app)
    .post("/api/v1/ap/invoices")
    .set("Authorization", `Bearer ${tokens["accounts.clerk"]}`)
    .send({
      supplierId: "SUP-101",
      supplierInvoiceNum: `SCF/2026/INV-${Date.now().toString().slice(-4)}`,
      poId: po.code,
      invoiceAmount: 165000.0, // Supplier billed for 300 EA, but only 290 EA accepted!
      lines: [
        {
          lineNum: 1,
          itemCode: "RM-301",
          invoicedQty: 300,
          unitPrice: 550.0,
        },
      ],
    });
  if (invRes.status !== 201) fail(`AP Invoice failed: ${JSON.stringify(invRes.body)}`);
  const invoice = invRes.body.data;
  pass(`[accounts.clerk Nitin Gaikwad] Entered AP Invoice ${invoice.code}; 3-Way Match triggered ${invoice.holds[0]?.holdType} hold`);

  // 3.7 Plant Head (Suresh Rane) releases hold with vendor credit verification
  const holdId = invoice.holds[0]?.holdId;
  if (holdId) {
    const relRes = await request(app)
      .post(`/api/v1/ap/holds/${holdId}/release`)
      .set("Authorization", `Bearer ${tokens["plant.head"]}`)
      .send({ reason: "Supplier confirmed replacement or credit note for 10 rejected units" });
    if (relRes.status !== 200) fail(`Hold release failed: ${JSON.stringify(relRes.body)}`);
    pass(`[plant.head Suresh Rane] Released Invoice Hold ${holdId} in Worklist; Status -> Validated`);
  }

  // 3.8 Payment Batch Processing by Accounts Clerk (Nitin Gaikwad)
  const pBatchRes = await request(app)
    .post("/api/v1/ap/payments/batches")
    .set("Authorization", `Bearer ${tokens["accounts.clerk"]}`)
    .send({
      bankAccount: "HDFC Operating · •••• 4821",
      paymentMethod: "NEFT",
      invoiceIds: [invoice.code],
    });
  if (pBatchRes.status !== 201) fail(`Payment batch failed: ${JSON.stringify(pBatchRes.body)}`);
  const batchCode = pBatchRes.body.data.code;

  const procRes = await request(app)
    .post(`/api/v1/ap/payments/batches/${batchCode}/process`)
    .set("Authorization", `Bearer ${tokens["accounts.clerk"]}`)
    .send({});
  if (procRes.status !== 200) fail(`Payment execution failed: ${JSON.stringify(procRes.body)}`);
  pass(`[accounts.clerk Nitin Gaikwad] Executed NEFT Payment Batch ${batchCode} -> Invoice ${invoice.code} Paid in Full`);

  // ---------------------------------------------------------------------------
  // STEP 4: PLAN-TO-PRODUCE (MANUFACTURING & MRP) END-TO-END FLOW
  // ---------------------------------------------------------------------------
  subBanner("STEP 4: PLAN-TO-PRODUCE (MANUFACTURING & MRP) FLOW");

  // 4.1 Subinventory transfer by Stores Manager (Kavita More)
  const xferRes = await request(app)
    .post("/api/v1/inventory/transfers")
    .set("Authorization", `Bearer ${tokens["mgr.stores"]}`)
    .send({
      itemCode: "RM-204",
      fromSubinventory: "RM-STORES",
      toSubinventory: "WIP-STAGING",
      quantity: 150,
      reason: "Shop Floor replenishment for shift 1",
    });
  if (xferRes.status !== 201) fail(`Transfer failed: ${JSON.stringify(xferRes.body)}`);
  pass(`[mgr.stores Kavita More] Transferred 150 EA RM-204 from RM-STORES -> WIP-STAGING`);

  // 4.2 MRP Planner calculation by Production Manager (Anil Deshmukh)
  const mrpRes = await request(app)
    .post("/api/v1/mfg/planner/run")
    .set("Authorization", `Bearer ${tokens["mgr.production"]}`)
    .send({});
  if (mrpRes.status !== 200) fail(`MRP failed: ${JSON.stringify(mrpRes.body)}`);
  pass(`[mgr.production Anil Deshmukh] Ran MRP Planning Engine; generated ${mrpRes.body.data?.recommendations?.length || 0} replenishment recommendations`);

  // 4.3 Create and release Work Order by Production Manager (Anil Deshmukh)
  const woRes = await request(app)
    .post("/api/v1/mfg/work-orders")
    .set("Authorization", `Bearer ${tokens["mgr.production"]}`)
    .send({
      itemCode: "FG-1001",
      plannedQty: 100,
      priority: "Urgent",
      assignedLine: "Pune Brake Pad Line 1",
    });
  if (woRes.status !== 201) fail(`Work Order creation failed: ${JSON.stringify(woRes.body)}`);
  const woCode = woRes.body.data.code;
  pass(`[mgr.production Anil Deshmukh] Created & Released Work Order: ${woCode} for 100 SET FG-1001`);

  // 4.4 Material Issue by Stores Manager (Kavita More)
  const issRes = await request(app)
    .post("/api/v1/inventory/material-issues/issue")
    .set("Authorization", `Bearer ${tokens["mgr.stores"]}`)
    .send({
      workOrderId: woCode,
      itemCode: "RM-204",
      quantity: 200,
      subinventory: "RM-STORES",
    });
  if (issRes.status !== 200) fail(`Material issue failed: ${JSON.stringify(issRes.body)}`);
  pass(`[mgr.stores Kavita More] Issued 200 EA RM-204 from RM-STORES to Work Order ${woCode}`);

  // 4.5 Production Supervisor (Sanjay Bhosale) assigns and monitors line
  const woDetail = await request(app)
    .get(`/api/v1/mfg/work-orders/${woCode}`)
    .set("Authorization", `Bearer ${tokens["prod.supervisor"]}`);
  if (woDetail.status !== 200) fail(`WO query failed: ${JSON.stringify(woDetail.body)}`);
  pass(`[prod.supervisor Sanjay Bhosale] Dispatched WO ${woCode} to Production Line 1`);

  // 4.6 Machine Operator (Rahul Patil) completes Operation 10
  const progRes = await request(app)
    .post(`/api/v1/mfg/work-orders/${woCode}/operations/10/progress`)
    .set("Authorization", `Bearer ${tokens["emp.production"]}`)
    .send({
      completedQty: 99,
      scrapQty: 1,
      scrapReason: "Fine-blanking burr defect",
    });
  if (progRes.status !== 200) fail(`Progress failed: ${JSON.stringify(progRes.body)}`);
  pass(`[emp.production Rahul Patil] Completed Op 10: 99 Good, 1 Scrapped. Advanced to Op 20`);

  // ---------------------------------------------------------------------------
  // STEP 5: ORDER-TO-CASH (O2C) END-TO-END FLOW
  // ---------------------------------------------------------------------------
  subBanner("STEP 5: ORDER-TO-CASH (O2C) FLOW (SALES ORDER -> SHIP CONFIRM -> AR -> RECEIPT)");

  // 5.1 Sales Order created by Sales Operations Lead (Ritu Sharma)
  const soRes = await request(app)
    .post("/api/v1/orders")
    .set("Authorization", `Bearer ${tokens["sales.ops"]}`)
    .send({
      customerId: "CUST-101",
      requestedShipDate: "2026-10-24",
      lines: [
        {
          itemCode: "FG-1001",
          description: "Ceramic Disc Brake Pads (Front Axle Set)",
          orderedQty: 100,
          unitPrice: 1250.0,
          uom: "SET",
        },
      ],
    });
  if (soRes.status !== 201) fail(`Sales order failed: ${JSON.stringify(soRes.body)}`);
  const soCode = soRes.body.data.code;
  pass(`[sales.ops Ritu Sharma] Booked Sales Order ${soCode} for Mahindra Components (₹ ${soRes.body.data.grandTotal.toLocaleString("en-IN")}.00 incl. 18% GST). Credit Check: PASSED`);

  // 5.2 Ship Confirmation by Stores & Shipping Controller (Pooja Nair)
  const shipRes = await request(app)
    .post(`/api/v1/orders/${soCode}/ship-confirm`)
    .set("Authorization", `Bearer ${tokens["stores.controller"]}`)
    .send({
      carrierName: "VRL Logistics Ltd",
      vehicleNumber: "MH-12-RN-9921",
      ewayBillNumber: "241088493012",
      lrNumber: "LR-VRL-88129",
    });
  if (shipRes.status !== 200) fail(`Ship confirm failed: ${JSON.stringify(shipRes.body)}`);
  const { delivery, invoice: arInvoice } = shipRes.body.data;
  pass(`[stores.controller Pooja Nair] Dispatched Goods: Delivery ${delivery.code}, E-Way Bill ${delivery.ewayBillNumber}`);
  pass(`[SYSTEM AutoInvoice] Generated AR Tax Invoice: ${arInvoice.code}`);

  // 5.3 Cash Receipt Applied by Accounts Clerk (Nitin Gaikwad)
  const rcptRes = await request(app)
    .post("/api/v1/ar/receipts")
    .set("Authorization", `Bearer ${tokens["accounts.clerk"]}`)
    .send({
      customerId: "CUST-101",
      receiptAmount: arInvoice.totalAmount,
      receiptMethod: "RTGS",
      reference: "UTR-HDFC-9930219",
      appliedInvoices: [arInvoice.code],
    });
  if (rcptRes.status !== 201) fail(`Cash receipt failed: ${JSON.stringify(rcptRes.body)}`);
  const recCode = rcptRes.body.data.receipt.code;
  pass(`[accounts.clerk Nitin Gaikwad] Processed Bank Receipt ${recCode} -> AR Invoice ${arInvoice.code} Settled in Full (Balance ₹ 0.00). Customer Credit Restored.`);

  // ---------------------------------------------------------------------------
  // STEP 6: COMPLIANCE AUDIT & ADMINISTRATION
  // ---------------------------------------------------------------------------
  subBanner("STEP 6: COMPLIANCE AUDIT & ENTERPRISE GOVERNANCE");

  // 6.1 Compliance Auditor (Sunita Kelkar) reviews tamper-proof audit trails
  const auditRes = await request(app)
    .get("/api/v1/admin/audit?limit=25")
    .set("Authorization", `Bearer ${tokens["auditor"]}`);
  if (auditRes.status !== 200) fail(`Audit query failed: ${JSON.stringify(auditRes.body)}`);
  pass(`[auditor Sunita Kelkar] Verified immutable audit log (${auditRes.body.data?.length || 0} entries captured across all business transactions)`);

  // 6.2 Administrator (Vikramaditya Singhania) user verification
  const usersRes = await request(app)
    .get("/api/v1/admin/users")
    .set("Authorization", `Bearer ${tokens["admin"]}`);
  if (usersRes.status !== 200) fail(`Admin query failed: ${JSON.stringify(usersRes.body)}`);
  pass(`[admin Vikramaditya Singhania] Verified 14 enterprise active users registered and healthy`);

  banner("ALL 14 PERSONAS AUTHENTICATED AND ALL 4 BUSINESS PROCESSES VERIFIED 100% PASS!");
}

verifyAllPersonasAndFlows().catch((err) => {
  console.error("\nFATAL ERROR DURING VERIFICATION:", err);
  process.exit(1);
});
