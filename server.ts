import express from "express";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { execSync } from "child_process";
import mysql from "mysql2/promise";
import { 
  getMySQLConfig, 
  saveMySQLConfig, 
  getFirebaseConfig, 
  syncToDualDatabases, 
  loadFromDualDatabases,
  clearFirestoreDatabase,
  getMySQLTableStatus,
  createMySQLTables,
  beautifyMySQLError
} from "./server/db";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const PORT = process.env.PORT || "3000";
const isSocket = isNaN(Number(PORT));

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API endpoint to generate a job description using Gemini AI
app.post("/api/ai/job-description", async (req, res) => {
  const { title, department, requirements, tone } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Job title is required" });
  }

  try {
    const prompt = `เขียนคำอธิบายลักษณะงาน (Job Description) ภาษาไทยที่ดึงดูดและเป็นมืออาชีพ สำหรับตำแหน่งงานนี้:
ตำแหน่ง: ${title}
แผนก/ฝ่าย: ${department || "ไม่ระบุ"}
ข้อกำหนดเบื้องต้น/ความสามารถที่ต้องการ: ${requirements || "ทั่วไป"}
โทนเสียง: ${tone || "สุภาพและเป็นมืออาชีพ"}

ช่วยแบ่งโครงสร้างเป็น 4 ส่วนหลักดังนี้:
1. ภาพรวมตำแหน่งงาน (Job Summary)
2. หน้าที่และความรับผิดชอบหลัก (Responsibilities)
3. คุณสมบัติของผู้สมัคร (Qualifications & Requirements)
4. สวัสดิการขั้นต้น (Benefits - เขียนสวัสดิการสมมติของบริษัทสตาร์ทอัพเทคโนโลยีชั้นนำ)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "คุณเป็นผู้เชี่ยวชาญด้านทรัพยากรบุคคล (HR Specialist) และการสรรหาบุคลากร เขียนข้อความในรูปแบบ Markdown ที่สวยงาม อ่านง่าย มีโครงสร้างหัวข้อชัดเจน ดึงดูดผู้สมัครระดับสูง",
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini AI Job Description error:", error);
    res.status(500).json({ error: error.message || "Failed to generate job description with AI" });
  }
});

// API endpoint to draft a performance review using Gemini AI
app.post("/api/ai/performance-review", async (req, res) => {
  const { employeeName, role, score, strengths, improvements, goals } = req.body;

  if (!employeeName || !role) {
    return res.status(400).json({ error: "Employee name and role are required" });
  }

  try {
    const prompt = `กรุณาเขียนร่างประเมินผลการปฏิบัติงานประจำปี (Performance Review) ภาษาไทย อย่างเป็นทางการ สุภาพ และสร้างสรรค์ สำหรับพนักงานต่อไปนี้:
ชื่อพนักงาน: ${employeeName}
ตำแหน่ง: ${role}
คะแนนการประเมิน: ${score || 3} เต็ม 5
จุดเด่นหลัก: ${strengths || "มีความรับผิดชอบดี"}
จุดที่ควรปรับปรุง: ${improvements || "ไม่มีข้อบ่งชี้พิเศษ"}
เป้าหมายในอนาคต: ${goals || "พัฒนาศักยภาพตามบทบาทหน้าที่"}

ช่วยร่างรายงานประเมินผลแบ่งตามหัวข้อ Markdown ต่อไปนี้:
- บทสรุปภาพรวมผลงาน (Overall Summary)
- จุดเด่นและข้อดีของพนักงาน (Key Strengths)
- ข้อเสนอแนะเชิงสร้างสรรค์เพื่อการปรับปรุงและเติบโต (Feedback for Growth)
- คำแนะนำเป้าหมายในรอบถัดไป (Target Goals)
- ข้อคิดเห็นเพิ่มเติมจากผู้ประเมิน (Evaluator Comments)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "คุณเป็นหัวหน้างานและผู้บริหารฝ่ายทรัพยากรบุคคลที่มีวุฒิภาวะ สูงด้วยความเป็นผู้นำ เขียนประเมินพนักงานด้วยถ้อยคำที่สุภาพ ให้เกียรติ พัฒนาบุคคลได้จริง และสร้างแรงบันดาลใจให้พนักงานพัฒนาตนเอง เขียนผลลัพธ์เป็นโครงสร้าง Markdown",
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini AI Performance Review error:", error);
    res.status(500).json({ error: error.message || "Failed to draft performance review with AI" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API endpoint to send a message via LINE Notify
app.post("/api/line-notify", async (req, res) => {
  const { message, token } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (!token) {
    return res.status(400).json({ error: "LINE Notify Token is not configured" });
  }

  // Trim token to handle copy-paste whitespaces or newline characters
  const cleanToken = token.trim();

  // Validate that the token is valid ASCII to prevent ByteString TypeErrors on fetch headers
  const isAscii = /^[\x20-\x7E]*$/.test(cleanToken);
  if (!isAscii) {
    return res.status(400).json({ 
      error: "รหัสโทเค็น (LINE Notify Token) ไม่ถูกต้อง เนื่องจากมีอักษรภาษาไทยหรืออักขระพิเศษ กรุณาใช้รหัส Token ภาษาอังกฤษยาว 43 ตัวอักษรที่คัดลอกมาจากระบบ LINE เท่านั้น" 
    });
  }

  try {
    const response = await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${cleanToken}`
      },
      body: `message=${encodeURIComponent(message)}`
    });

    if (response.ok) {
      const data = await response.json();
      res.json({ success: true, data });
    } else {
      const status = response.status;
      let errorMsg = `เกิดข้อผิดพลาดในการเชื่อมต่อ (รหัส ${status})`;
      try {
        const errJson = await response.json();
        const lineMsg = errJson.message || '';
        if (status === 401 || lineMsg.toLowerCase().includes('invalid')) {
          errorMsg = `รหัสโทเค็น (LINE Notify Token) ไม่ถูกต้อง หรือหมดอายุ กรุณาตรวจสอบรหัสใหม่อีกครั้ง (Status 401)`;
        } else if (status === 400) {
          errorMsg = `ข้อมูลส่งไปยังไลน์ไม่ถูกต้อง หรือข้อความว่างเปล่าเกินไป (Status 400)`;
        } else {
          errorMsg = `LINE Notify Error: ${lineMsg} (Status ${status})`;
        }
      } catch (e) {
        const errText = await response.text().catch(() => '');
        if (status === 401) {
          errorMsg = `รหัสโทเค็น (LINE Notify Token) ไม่ถูกต้อง กรุณาตรวจสอบและตั้งค่ารหัสโทเค็นใหม่อีกครั้ง (Status 401)`;
        } else {
          errorMsg = `ไม่สามารถส่งข้อความได้ (Status ${status}): ${errText || 'เซิร์ฟเวอร์ LINE ปฏิเสธการเชื่อมต่อ'}`;
        }
      }
      res.status(status).json({ error: errorMsg });
    }
  } catch (error: any) {
    console.error("LINE Notify API error:", error);
    let errorMessage = error.message || "Failed to send LINE Notify";
    let isSandboxError = false;

    const lowerErr = errorMessage.toLowerCase();
    if (lowerErr.includes("bytestring") || lowerErr.includes("byte string")) {
      errorMessage = "รหัสโทเค็น (LINE Notify Token) มีอักขระที่ไม่รองรับ (เช่น ภาษาไทย อักขระพิเศษ หรืออักษรเว้นวรรค) กรุณาใช้รหัสอักษรภาษาอังกฤษที่คัดลอกมาจาก LINE เท่านั้น";
    } else if (
      error.code === 'ENOTFOUND' || 
      error.code === 'EAI_AGAIN' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNREFUSED' ||
      (error.cause && (
        error.cause.code === 'ENOTFOUND' || 
        error.cause.code === 'EAI_AGAIN' ||
        error.cause.code === 'ETIMEDOUT' ||
        error.cause.code === 'ECONNREFUSED'
      )) || 
      errorMessage.includes('ENOTFOUND') || 
      errorMessage.includes('EAI_AGAIN') || 
      errorMessage.includes('fetch failed')
    ) {
      isSandboxError = true;
      errorMessage = "ไม่สามารถเชื่อมต่อระบบ LINE Notify ได้ (เกตเวย์หรือ DNS ขัดข้อง): เซิร์ฟเวอร์ Sandbox ของ AI Studio ถูกจำกัดไม่ให้เข้าถึงอินเทอร์เน็ตภายนอก จึงไม่สามารถแปลรหัสโฮสต์ notify-api.line.me ได้ ขออภัยในความไม่สะดวก";
    }
    res.status(500).json({ error: errorMessage, isSandboxError });
  }
});

// Download full project code as ZIP
app.get("/api/download-zip", (req, res) => {
  try {
    const zip = new AdmZip();
    const rootDir = process.cwd();

    const addDirToZip = (localPath: string, zipPath: string) => {
      const items = fs.readdirSync(localPath);
      for (const item of items) {
        if (item === "node_modules" || item === ".git" || item === "package-lock.json") {
          continue;
        }
        const fullPath = path.join(localPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          addDirToZip(fullPath, zipPath ? `${zipPath}/${item}` : item);
        } else {
          zip.addLocalFile(fullPath, zipPath);
        }
      }
    };

    addDirToZip(rootDir, "");

    const buffer = zip.toBuffer();
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=hr-payroll-system.zip");
    res.send(buffer);
  } catch (error: any) {
    console.error("ZIP Generation failed:", error);
    res.status(500).send("Error compiling project to ZIP: " + error.message);
  }
});

// Download dynamic .env file for Hostinger deployment
app.get("/api/download-env", (req, res) => {
  try {
    const mysqlConfig = getMySQLConfig();

    let envContent = `# =========================================================================
# คอนฟิกูเรชันไฟล์สำหรับระบบบริหารจัดการงานบุคคล (HR & Payroll Management System)
# วิธีใช้: เปลี่ยนชื่อไฟล์นี้เป็น ".env" แล้วนำไปวางไว้ที่โฟลเดอร์หลักบน Hostinger
# =========================================================================

# 1. การตั้งค่าระบบเซิร์ฟเวอร์
PORT=3000
NODE_ENV=production

# 2. คีย์เชื่อมต่อระบบปัญญาประดิษฐ์ AI (ใช้สำหรับประเมินผลพนักงานและสรรหาคำอธิบายงาน)
GEMINI_API_KEY="${process.env.GEMINI_API_KEY || ""}"

# 3. ตั้งค่าฐานข้อมูล Hostinger MySQL (นำไปสร้างและกรอกตาม Hostinger hPanel)
MYSQL_HOST="${mysqlConfig?.host || "localhost"}"
MYSQL_PORT=${mysqlConfig?.port || 3306}
MYSQL_USER="${mysqlConfig?.user || "your_mysql_username"}"
MYSQL_PASSWORD="${mysqlConfig?.password || ""}"
MYSQL_DATABASE="${mysqlConfig?.database || "your_mysql_database_name"}"
MYSQL_AUTO_CREATE=true
`;

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", "attachment; filename=.env");
    res.send(envContent);
  } catch (error: any) {
    console.error("Failed to generate .env file:", error);
    res.status(500).send("Error generating .env file: " + error.message);
  }
});

// GET Database Connection configurations and status (Firebase & MySQL)
app.get("/api/db/config", async (req, res) => {
  try {
    const firebaseConfig = getFirebaseConfig();
    const mysqlConfig = getMySQLConfig();

    const statuses = {
      mysql: { connected: false, error: "" },
      firebase: { connected: false, error: "" }
    };

    // 1. Firebase Disabled per user instruction
    statuses.firebase.error = "Firebase disabled per user instruction";

    // 2. Test Hostinger MySQL Connection
    if (mysqlConfig && mysqlConfig.host) {
      try {
        const connection = await mysql.createConnection({
          host: mysqlConfig.host,
          port: Number(mysqlConfig.port) || 3306,
          user: mysqlConfig.user,
          password: mysqlConfig.password || "",
          database: mysqlConfig.database,
          connectTimeout: 2000
        });
        statuses.mysql.connected = true;
        await connection.end();
      } catch (err: any) {
        statuses.mysql.connected = false;
        statuses.mysql.error = beautifyMySQLError(err, mysqlConfig.host);
      }
    } else {
      statuses.mysql.error = "ยังไม่มีการตั้งค่าเชื่อมต่อ Hostinger MySQL (กรุณากรอกข้อมูลโฮสต์)";
    }

    res.json({
      mysql: {
        host: mysqlConfig?.host || "",
        port: mysqlConfig?.port || 3306,
        user: mysqlConfig?.user || "",
        database: mysqlConfig?.database || "",
        autoCreateDb: mysqlConfig?.autoCreateDb || false
      },
      firebase: {
        projectId: firebaseConfig?.projectId || "",
        apiKey: firebaseConfig?.apiKey ? "AIzaSy..." : "",
        firestoreDatabaseId: firebaseConfig?.firestoreDatabaseId || "(default)",
        storageBucket: firebaseConfig?.storageBucket || ""
      },
      status: statuses
    });
  } catch (outerErr: any) {
    console.warn("Gracefully caught error in /api/db/config:", outerErr);
    res.json({
      mysql: { host: "", port: 3306, user: "", database: "", autoCreateDb: false },
      firebase: { projectId: "", apiKey: "", firestoreDatabaseId: "(default)", storageBucket: "" },
      status: {
        mysql: { connected: false, error: "MySQL status check failed" },
        firebase: { connected: false, error: outerErr?.message || "Failed to resolve DB configuration status" }
      }
    });
  }
});

// POST Database Config (Saved to local configuration & Connection Tested)
app.post("/api/db/config", async (req, res) => {
  const config = req.body;
  
  // Save config
  const saved = saveMySQLConfig(config);
  if (!saved) {
    return res.status(500).json({ success: false, error: "ไม่สามารถบันทึกการตั้งค่าบนเซิร์ฟเวอร์ได้" });
  }

  if (!config.host) {
    return res.json({ 
      success: true, 
      message: "บันทึกข้อมูลการตั้งค่าแล้ว แต่กรุณากรอกชื่อ Host เพื่อเริ่มเชื่อมโยงฐานข้อมูล" 
    });
  }

  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: Number(config.port) || 3306,
      user: config.user,
      password: config.password || "",
      database: config.database,
      connectTimeout: 4000
    });

    if (config.autoCreateDb) {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS app_collections (
          collection_key VARCHAR(100) PRIMARY KEY,
          collection_data LONGTEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    }

    await connection.end();

    res.json({ 
      success: true, 
      message: "เชื่อมต่อกับฐานข้อมูล Hostinger MySQL สำเร็จเรียบร้อยแล้วและตารางพร้อมใช้งาน!" 
    });
  } catch (err: any) {
    console.warn("MySQL connection save check error:", err.message);
    res.json({ 
      success: true, // we still return success to save the configuration, but add a warning message about connection failure so they can fix credentials
      warning: `บันทึกข้อมูลการตั้งค่าสำเร็จแล้ว แต่ไม่สามารถทดสอบเชื่อมต่อ Host ได้: ${beautifyMySQLError(err, config.host)}`
    });
  }
});

// GET Database Ledger status - inspect Hostinger MySQL tables
app.get("/api/db/ledger", async (req, res) => {
  try {
    const result = await getMySQLTableStatus();
    res.json(result);
  } catch (error: any) {
    console.error("Get database ledger status error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to inspect database tables" });
  }
});

// POST Database Ledger create - auto-create all missing relational tables in MySQL
app.post("/api/db/ledger/create", async (req, res) => {
  try {
    const result = await createMySQLTables();
    res.json(result);
  } catch (error: any) {
    console.error("Create database tables error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to create missing database tables" });
  }
});

// POST DB Sync - synchronize local state to BOTH Hostinger & Firebase
app.post("/api/db/sync", async (req, res) => {
  const payload = req.body;
  const mysqlConfig = getMySQLConfig();

  try {
    const results = await syncToDualDatabases(payload, mysqlConfig);
    res.json({ success: true, results });
  } catch (error: any) {
    console.error("Database Sync Error:", error);
    res.status(500).json({ error: error.message || "Failed to sync databases" });
  }
});

// GET DB Load - retrieve data from both databases
app.get("/api/db/load", async (req, res) => {
  const mysqlConfig = getMySQLConfig();

  try {
    const data = await loadFromDualDatabases(mysqlConfig);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Database Load Error:", error);
    res.status(500).json({ error: error.message || "Failed to load databases" });
  }
});

// POST DB Clear - reset the Firebase Firestore database to empty data
app.post("/api/db/clear", async (req, res) => {
  try {
    const result = await clearFirestoreDatabase();
    res.json(result);
  } catch (error: any) {
    console.error("Database Clear Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to clear Firestore database" });
  }
});

// POST DB Copy Firebase to MySQL - fetch Firebase Firestore data and copy/migrate it directly to Hostinger MySQL
app.post("/api/db/copy-firebase-to-mysql", async (req, res) => {
  const mysqlConfig = getMySQLConfig();
  if (!mysqlConfig || !mysqlConfig.host) {
    return res.status(400).json({ success: false, error: "Hostinger MySQL ไม่ได้รับการตั้งค่าหรือยังไม่ได้เชื่อมต่อโฮสต์" });
  }

  try {
    // 1. Fetch remote dual database payload
    const remoteData = await loadFromDualDatabases(mysqlConfig);
    if (!remoteData.firebase) {
      return res.status(404).json({ success: false, error: "ตรวจไม่พบข้อมูลบนคลาวด์ Firebase Firestore หรือเกิดปัญหาโควตาเต็ม" });
    }

    // 2. Synchronize the Firebase dataset directly into Hostinger MySQL
    const syncResults = await syncToDualDatabases(remoteData.firebase, mysqlConfig);

    if (syncResults.mysql.success) {
      res.json({ 
        success: true, 
        message: "คัดลอกข้อมูลจาก Firebase Firestore ไปยัง Hostinger MySQL สำเร็จ!",
        results: syncResults
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: syncResults.mysql.error || "ไม่สามารถเขียนข้อมูลลงในฐานข้อมูล Hostinger MySQL ได้" 
      });
    }
  } catch (error: any) {
    console.error("Copy Firebase to MySQL Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to copy Firebase to MySQL" });
  }
});

// Integrate Vite as Middleware
async function initializeServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err: any) {
      console.warn("Vite could not be loaded dynamically, falling back to production static assets:", err.message || err);
      const distPath = typeof __dirname !== "undefined"
        ? (__dirname.endsWith("dist") ? __dirname : path.join(__dirname, "dist"))
        : path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  } else {
    const distPath = typeof __dirname !== "undefined"
      ? (__dirname.endsWith("dist") ? __dirname : path.join(__dirname, "dist"))
      : path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (isSocket) {
    app.listen(PORT, () => {
      console.log(`Server is running on Unix socket: ${PORT}`);
    });
  } else {
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  }
}

initializeServer().catch((err) => {
  console.error("Error starting server:", err);
});
