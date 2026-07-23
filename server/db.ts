import fs from "fs";
import path from "path";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, writeBatch, deleteDoc } from "firebase/firestore";
import mysql from "mysql2/promise";

export function beautifyMySQLError(error: any, host: string): string {
  const errMsg = error?.message || String(error);
  if (errMsg.includes("ECONNREFUSED") || errMsg.includes("ENOTFOUND")) {
    if (host === "127.0.0.1" || host === "localhost") {
      return `ไม่สามารถเชื่อมต่อกับโฮสต์ฐานข้อมูล '${host}' ได้ (ECONNREFUSED/ENOTFOUND). หากยังไม่ได้กรอกหรือเปิดใช้งาน Hostinger MySQL กรุณากรอกชื่อ Host ภายนอกจริง (เช่น sqlXXX.hostinger.com) ในหน้าจอตั้งค่า โดยข้อมูลทั้งหมดได้รับการสำรองไว้บนไฟล์ระบบเซิร์ฟเวอร์เรียบร้อยแล้ว`;
    }
    return `ไม่สามารถเชื่อมต่อกับฐานข้อมูลโฮสต์ '${host}' ได้: กรุณาตรวจสอบว่าข้อมูลถูกต้องและเปิดรับการเชื่อมต่อจากภายนอก (Remote MySQL) ในโฮสติ้งแล้ว`;
  }
  return errMsg;
}


// Config paths
const LOCAL_DB_PATH = path.join(process.cwd(), "server", "local_db.json");
const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
const MYSQL_CONFIG_PATH = path.join(process.cwd(), "server", "mysql_config.json");

export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  autoCreateDb?: boolean;
}

export interface SyncPayload {
  employees: any[];
  payroll: any[];
  leaves: any[];
  sales: any[];
  cheques: any[];
  cashflow: any[];
  partnerBillings: any[];
  transportWaybills?: any[];
  auditLogs: any[];
  jobs?: any[];
  applicants?: any[];
  evaluations?: any[];
  attendance?: any;
  dayoffSwaps?: any[];
  partnerCompanies?: any[];
  systemSettings?: any;
  counterDuties?: any[];
}

// Load Firebase configuration
export function getFirebaseConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const configData = fs.readFileSync(CONFIG_PATH, "utf8");
      return JSON.parse(configData);
    }
  } catch (err) {
    console.error("Error reading firebase config:", err);
  }
  return null;
}

// Initialize Firebase App & Firestore
let firebaseApp: any = null;
let firestoreDb: any = null;

function getFirestoreInstance() {
  if (firestoreDb) return firestoreDb;

  const config = getFirebaseConfig();
  if (!config || !config.projectId) {
    throw new Error("Firebase config is missing or invalid");
  }

  const app = getApps().length === 0 ? initializeApp(config) : getApp();
  firebaseApp = app;

  if (config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)") {
    firestoreDb = getFirestore(app, config.firestoreDatabaseId);
  } else {
    firestoreDb = getFirestore(app);
  }

  return firestoreDb;
}

export function getMySQLConfig(): MySQLConfig {
  try {
    if (fs.existsSync(MYSQL_CONFIG_PATH)) {
      const data = fs.readFileSync(MYSQL_CONFIG_PATH, "utf8");
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        database: parsed.database || "u753988669_hr",
        user: parsed.user || "u753988669_hr"
      };
    }
  } catch (error) {
    console.error("Error reading mysql_config.json:", error);
  }
  
  return {
    host: process.env.MYSQL_HOST || "",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "u753988669_hr",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "u753988669_hr",
    autoCreateDb: process.env.MYSQL_AUTO_CREATE === "true" || true
  };
}

export function saveMySQLConfig(config: MySQLConfig) {
  try {
    const parentDir = path.dirname(MYSQL_CONFIG_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(MYSQL_CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error saving mysql_config.json:", error);
    return false;
  }
}

export async function initMySQLTables(connection: any) {
  // No-op
}

// List of collection mapping for quick document reads and writes matching firestore.rules
const COLLECTION_KEYS = [
  { key: "employees", path: "employees/current" },
  { key: "payroll", path: "payroll/current" },
  { key: "leaves", path: "leaves/current" },
  { key: "sales", path: "sales/current" },
  { key: "cheques", path: "cheques/current" },
  { key: "cashflow", path: "cashflow/current" },
  { key: "partnerBillings", path: "partner_billings/current" },
  { key: "transportWaybills", path: "transport_waybills/current" },
  { key: "auditLogs", path: "audit_logs/current" },
  { key: "jobs", path: "jobs/current" },
  { key: "applicants", path: "applicants/current" },
  { key: "evaluations", path: "evaluations/current" },
  { key: "attendance", path: "attendance/current" },
  { key: "dayoffSwaps", path: "dayoff_swaps/current" },
  { key: "partnerCompanies", path: "partner_companies/current" },
  { key: "systemSettings", path: "system_settings/current" },
  { key: "counterDuties", path: "counter_duties/current" }
];

// Sync to BOTH Local Database and Firebase Firestore
export async function syncToDualDatabases(payload: SyncPayload, mysqlConfig?: MySQLConfig) {
  const results = {
    mysql: { success: false, error: "MySQL integration disabled" },
    firebase: { success: false, error: "" }
  };

  // 1. Read existing local database copy to detect what actually changed
  let previousPayload: any = null;
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const fileData = fs.readFileSync(LOCAL_DB_PATH, "utf8");
      previousPayload = JSON.parse(fileData);
    }
  } catch (error) {
    console.warn("Failed to read previous database payload for change detection:", error);
  }

  // 2. Always save a local copy as a backup (including counterDuties for local backup resilience)
  try {
    const parentDir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    const localPayload = { ...payload };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localPayload, null, 2), "utf8");
  } catch (error: any) {
    console.error("Local backup save error:", error);
  }

  // 3. Skip Firebase Firestore (Disabled per user request)
  results.firebase = { success: false, error: "Firebase connections canceled by user configuration" };

  // 4. Sync to Hostinger MySQL (if configured)
  const activeMysqlConfig = mysqlConfig || getMySQLConfig();
  if (activeMysqlConfig && activeMysqlConfig.host) {
    let connection: any = null;
    try {
      connection = await mysql.createConnection({
        host: activeMysqlConfig.host,
        port: Number(activeMysqlConfig.port) || 3306,
        user: activeMysqlConfig.user,
        password: activeMysqlConfig.password || "",
        database: activeMysqlConfig.database,
        connectTimeout: 5000
      });

      // Ensure table exists
      await connection.query(`
        CREATE TABLE IF NOT EXISTS app_collections (
          collection_key VARCHAR(100) PRIMARY KEY,
          collection_data LONGTEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Write each collection in SyncPayload to MySQL
      for (const item of COLLECTION_KEYS) {
        let val = (payload as any)[item.key];
        if (val === undefined || val === null) {
          if (item.key === "systemSettings") {
            val = {};
          } else if (item.key === "attendance") {
            val = {};
          } else {
            val = [];
          }
        }

        const serialized = JSON.stringify(val);
        await connection.query(
          "INSERT INTO app_collections (collection_key, collection_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE collection_data = ?, updated_at = CURRENT_TIMESTAMP",
          [item.key, serialized, serialized]
        );
      }

      results.mysql.success = true;
      results.mysql.error = "";
      console.log("[MySQL Sync] Successfully synced all collections to Hostinger MySQL!");

      // Sync to individual relational tables in the Hostinger MySQL database
      try {
        await syncToRelationalTables(connection, payload);
      } catch (relErr: any) {
        console.error("[MySQL Relational Sync] Failed to populate relational tables:", relErr);
      }
    } catch (error: any) {
      if (activeMysqlConfig.host === "127.0.0.1" || activeMysqlConfig.host === "localhost") {
        console.info(`[MySQL Sync Info] Bypassed or failed local MySQL sync (127.0.0.1). Fallback active.`);
      } else {
        console.warn("[MySQL Sync] Gracefully caught MySQL sync connection error (falling back):", error.message);
      }
      results.mysql.success = false;
      results.mysql.error = beautifyMySQLError(error, activeMysqlConfig.host);
    } finally {
      if (connection) {
        try {
          await connection.end();
        } catch (e) {}
      }
    }
  } else {
    results.mysql.error = "ยังไม่มีการตั้งค่าการเชื่อมต่อ Hostinger MySQL (กรุณากรอกข้อมูลโฮสต์ในหน้าจอตั้งค่า)";
  }

  return results;
}

// Load from Firebase Firestore, fallback to Local Database
export async function loadFromDualDatabases(mysqlConfig?: MySQLConfig) {
  const data: any = {
    mysql: null,
    firebase: null
  };

  // Attempt to load from Hostinger MySQL
  const activeMysqlConfig = mysqlConfig || getMySQLConfig();
  if (activeMysqlConfig && activeMysqlConfig.host) {
    let connection: any = null;
    try {
      connection = await mysql.createConnection({
        host: activeMysqlConfig.host,
        port: Number(activeMysqlConfig.port) || 3306,
        user: activeMysqlConfig.user,
        password: activeMysqlConfig.password || "",
        database: activeMysqlConfig.database,
        connectTimeout: 4000
      });

      // Ensure table exists
      await connection.query(`
        CREATE TABLE IF NOT EXISTS app_collections (
          collection_key VARCHAR(100) PRIMARY KEY,
          collection_data LONGTEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      const [rows]: any = await connection.query("SELECT collection_key, collection_data FROM app_collections");
      const mysqlPayload: any = {};
      if (rows && rows.length > 0) {
        rows.forEach((row: any) => {
          try {
            mysqlPayload[row.collection_key] = JSON.parse(row.collection_data);
          } catch (e) {
            console.error(`Error parsing mysql collection ${row.collection_key}:`, e);
          }
        });
      }

      data.mysql = {
        employees: mysqlPayload.employees || [],
        payroll: mysqlPayload.payroll || [],
        leaves: mysqlPayload.leaves || [],
        sales: mysqlPayload.sales || [],
        cheques: mysqlPayload.cheques || [],
        cashflow: mysqlPayload.cashflow || [],
        partnerBillings: mysqlPayload.partnerBillings || [],
        transportWaybills: mysqlPayload.transportWaybills || [],
        auditLogs: mysqlPayload.auditLogs || [],
        jobs: mysqlPayload.jobs || [],
        applicants: mysqlPayload.applicants || [],
        evaluations: mysqlPayload.evaluations || [],
        attendance: mysqlPayload.attendance || {},
        dayoffSwaps: mysqlPayload.dayoffSwaps || [],
        partnerCompanies: mysqlPayload.partnerCompanies || [],
        systemSettings: mysqlPayload.systemSettings || {},
        counterDuties: mysqlPayload.counterDuties || []
      };
      console.log("Successfully loaded data from Hostinger MySQL!");
    } catch (error: any) {
      if (activeMysqlConfig.host === "127.0.0.1" || activeMysqlConfig.host === "localhost") {
        console.info(`[MySQL Load Info] Bypassed or failed local MySQL load (127.0.0.1). Fallback active.`);
      } else {
        console.warn("[MySQL Load] Gracefully caught MySQL load connection error (falling back):", error.message);
      }
      data.mysqlError = beautifyMySQLError(error, activeMysqlConfig.host);
    } finally {
      if (connection) {
        try {
          await connection.end();
        } catch (e) {}
      }
    }
  }

  // Fallback to local file database if Hostinger MySQL load returned no data or failed
  if (!data.mysql) {
    try {
      if (fs.existsSync(LOCAL_DB_PATH)) {
        const fileData = fs.readFileSync(LOCAL_DB_PATH, "utf8");
        const parsed = JSON.parse(fileData);
        data.mysql = {
          employees: parsed.employees || [],
          payroll: parsed.payroll || [],
          leaves: parsed.leaves || [],
          sales: parsed.sales || [],
          cheques: parsed.cheques || [],
          cashflow: parsed.cashflow || [],
          partnerBillings: parsed.partnerBillings || [],
          transportWaybills: parsed.transportWaybills || [],
          auditLogs: parsed.auditLogs || [],
          jobs: parsed.jobs || [],
          applicants: parsed.applicants || [],
          evaluations: parsed.evaluations || [],
          attendance: parsed.attendance || {},
          dayoffSwaps: parsed.dayoffSwaps || [],
          partnerCompanies: parsed.partnerCompanies || [],
          systemSettings: parsed.systemSettings || {},
          counterDuties: parsed.counterDuties || []
        };
        console.log("Loaded data from local backup file (Hostinger MySQL fallback)");
      }
    } catch (error: any) {
      console.error("Local Backup Load Error:", error);
    }
  }

  data.firebase = null;
  data.firebaseError = null;
  return data;
}

// Clear Firestore Database
export async function clearFirestoreDatabase(): Promise<{ success: boolean; clearedCollections: string[]; error?: string }> {
  try {
    const db = getFirestoreInstance();
    const cleared: string[] = [];

    // Delete documents in Firestore
    await Promise.all(
      COLLECTION_KEYS.map(async (item) => {
        try {
          const docRef = doc(db, item.path);
          await deleteDoc(docRef);
          cleared.push(item.key);
        } catch (err) {
          console.error(`Error deleting key ${item.key} from Firebase:`, err);
        }
      })
    );

    // Also clear the local file backup
    if (fs.existsSync(LOCAL_DB_PATH)) {
      fs.unlinkSync(LOCAL_DB_PATH);
    }

    // Also clear Hostinger MySQL database collections table if configured to keep both empty
    const activeMysqlConfig = getMySQLConfig();
    if (activeMysqlConfig && activeMysqlConfig.host) {
      let connection: any = null;
      try {
        connection = await mysql.createConnection({
          host: activeMysqlConfig.host,
          port: Number(activeMysqlConfig.port) || 3306,
          user: activeMysqlConfig.user,
          password: activeMysqlConfig.password || "",
          database: activeMysqlConfig.database,
          connectTimeout: 4000
        });
        await connection.query("TRUNCATE TABLE app_collections");
        console.log("[MySQL Clear] Successfully truncated app_collections table");
      } catch (mysqlErr: any) {
        console.error("[MySQL Clear] Error clearing MySQL:", mysqlErr);
      } finally {
        if (connection) {
          try {
            await connection.end();
          } catch (e) {}
        }
      }
    }

    return {
      success: true,
      clearedCollections: cleared
    };
  } catch (error: any) {
    console.error("Firebase Firestore Clear Error:", error);
    return {
      success: false,
      clearedCollections: [],
      error: error.message || "Failed to clear Firestore database"
    };
  }
}

// Relational Table Schemas definition for System Database Ledger
export interface TableSchema {
  name: string;
  createSql: string;
}

export const TABLE_SCHEMAS: TableSchema[] = [
  {
    name: "app_collections",
    createSql: `
      CREATE TABLE IF NOT EXISTS app_collections (
        collection_key VARCHAR(100) PRIMARY KEY,
        collection_data LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "employees",
    createSql: `
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        avatar VARCHAR(255),
        role VARCHAR(100),
        department VARCHAR(100),
        email VARCHAR(150),
        phone VARCHAR(50),
        salary DECIMAL(12,2) DEFAULT 0,
        salary_type VARCHAR(20) DEFAULT 'monthly',
        join_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        bank_account VARCHAR(100),
        leave_balance_sick INT DEFAULT 0,
        leave_balance_personal INT DEFAULT 0,
        leave_balance_annual INT DEFAULT 0,
        work_days INT DEFAULT 0,
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "leaves",
    createSql: `
      CREATE TABLE IF NOT EXISTS leaves (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        employee_name VARCHAR(255),
        type VARCHAR(50),
        start_date DATE,
        end_date DATE,
        days INT DEFAULT 0,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        applied_date DATE,
        duration_unit VARCHAR(10) DEFAULT 'days',
        hours INT DEFAULT 0,
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "payroll",
    createSql: `
      CREATE TABLE IF NOT EXISTS payroll (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        employee_name VARCHAR(255),
        month VARCHAR(20),
        year INT,
        base_salary DECIMAL(12,2) DEFAULT 0,
        allowances DECIMAL(12,2) DEFAULT 0,
        deductions DECIMAL(12,2) DEFAULT 0,
        net_salary DECIMAL(12,2) DEFAULT 0,
        tax DECIMAL(12,2) DEFAULT 0,
        social_security DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        period VARCHAR(50),
        voucher_no VARCHAR(50),
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "sales",
    createSql: `
      CREATE TABLE IF NOT EXISTS sales (
        id VARCHAR(50) PRIMARY KEY,
        date DATE NOT NULL,
        amount DECIMAL(12,2) DEFAULT 0,
        notes TEXT,
        payment_channel VARCHAR(50),
        customer_name VARCHAR(255),
        receipt_number VARCHAR(100),
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "cheques",
    createSql: `
      CREATE TABLE IF NOT EXISTS cheques (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        cheque_number VARCHAR(100) NOT NULL,
        bank VARCHAR(100),
        partner_name VARCHAR(255),
        amount DECIMAL(12,2) DEFAULT 0,
        due_date DATE,
        issue_date DATE,
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "cashflow",
    createSql: `
      CREATE TABLE IF NOT EXISTS cashflow (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        category VARCHAR(100),
        amount DECIMAL(12,2) DEFAULT 0,
        date DATE NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'completed',
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "partner_billings",
    createSql: `
      CREATE TABLE IF NOT EXISTS partner_billings (
        id VARCHAR(50) PRIMARY KEY,
        partner_name VARCHAR(255) NOT NULL,
        doc_type VARCHAR(50),
        doc_number VARCHAR(100),
        delivery_doc_number VARCHAR(100),
        billing_doc_number VARCHAR(100),
        cn_doc_number VARCHAR(100),
        cn_amount DECIMAL(12,2) DEFAULT 0,
        book_number VARCHAR(50),
        page_number VARCHAR(50),
        billing_book_number VARCHAR(50),
        billing_page_number VARCHAR(50),
        transport_carrier VARCHAR(100),
        amount DECIMAL(12,2) DEFAULT 0,
        billing_amount DECIMAL(12,2) DEFAULT 0,
        issue_date DATE,
        due_date DATE,
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        contact_person VARCHAR(255),
        phone VARCHAR(50),
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "transport_waybills",
    createSql: `
      CREATE TABLE IF NOT EXISTS transport_waybills (
        id VARCHAR(50) PRIMARY KEY,
        waybill_number VARCHAR(50) NOT NULL,
        carrier_name VARCHAR(100) NOT NULL,
        partner_name VARCHAR(255) NOT NULL,
        delivery_date DATE NOT NULL,
        book_number VARCHAR(50) DEFAULT '',
        receipt_number VARCHAR(50) DEFAULT '',
        quantity INT DEFAULT 1,
        unit_price DECIMAL(12,2) DEFAULT 0.00,
        total_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        wht_doc_number VARCHAR(50) DEFAULT '',
        wht_rate DECIMAL(5,2) DEFAULT 1.00,
        wht_amount DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(30) NOT NULL DEFAULT 'pending_receipt',
        tracking_number VARCHAR(100) DEFAULT '',
        notes TEXT,
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "audit_logs",
    createSql: `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        timestamp DATETIME NOT NULL,
        action VARCHAR(20) NOT NULL,
        module VARCHAR(100) NOT NULL,
        description TEXT,
        user VARCHAR(150),
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "jobs",
    createSql: `
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        type VARCHAR(50),
        location VARCHAR(100),
        status VARCHAR(20) DEFAULT 'open',
        description TEXT,
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "applicants",
    createSql: `
      CREATE TABLE IF NOT EXISTS applicants (
        id VARCHAR(50) PRIMARY KEY,
        job_id VARCHAR(50) NOT NULL,
        job_title VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(150),
        stage VARCHAR(20) DEFAULT 'applied',
        rating INT DEFAULT 0,
        applied_date DATE,
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "evaluations",
    createSql: `
      CREATE TABLE IF NOT EXISTS evaluations (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        employee_name VARCHAR(255),
        role VARCHAR(100),
        department VARCHAR(100),
        evaluator_name VARCHAR(255),
        period VARCHAR(100),
        score INT DEFAULT 0,
        strengths TEXT,
        improvements TEXT,
        goals TEXT,
        comments TEXT,
        date DATE,
        status VARCHAR(20) DEFAULT 'draft',
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "attendance",
    createSql: `
      CREATE TABLE IF NOT EXISTS attendance (
        employee_id VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL,
        late_minutes INT DEFAULT 0,
        notes TEXT,
        clock_in VARCHAR(10),
        clock_out VARCHAR(10),
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (employee_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "dayoff_swaps",
    createSql: `
      CREATE TABLE IF NOT EXISTS dayoff_swaps (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        employee_name VARCHAR(255),
        original_off_date DATE,
        swapped_off_date DATE,
        status VARCHAR(20) DEFAULT 'pending',
        reason TEXT,
        applied_date DATE,
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "partner_companies",
    createSql: `
      CREATE TABLE IF NOT EXISTS partner_companies (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        tax_id VARCHAR(50),
        address TEXT,
        contact_person VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(150),
        notes TEXT,
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "system_settings",
    createSql: `
      CREATE TABLE IF NOT EXISTS system_settings (
        id VARCHAR(50) PRIMARY KEY,
        company_name VARCHAR(255),
        company_address TEXT,
        company_phone VARCHAR(50),
        company_tax_id VARCHAR(50),
        company_email VARCHAR(150),
        working_hours_start VARCHAR(10),
        working_hours_end VARCHAR(10),
        ot_rate_multiplier DECIMAL(5,2),
        social_security_rate DECIMAL(5,2),
        social_security_max_cap DECIMAL(12,2),
        withholding_tax_rate DECIMAL(5,2),
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: "counter_duties",
    createSql: `
      CREATE TABLE IF NOT EXISTS counter_duties (
        id VARCHAR(50) PRIMARY KEY,
        month VARCHAR(10),
        year INT,
        raw_json LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  }
];

// Check status of each MySQL table
export async function getMySQLTableStatus(mysqlConfig?: MySQLConfig) {
  const activeMysqlConfig = mysqlConfig || getMySQLConfig();
  if (!activeMysqlConfig || !activeMysqlConfig.host) {
    throw new Error("ไม่ได้ตั้งค่า Hostinger MySQL หรือโฮสต์ว่างเปล่า");
  }

  let connection: any = null;
  try {
    connection = await mysql.createConnection({
      host: activeMysqlConfig.host,
      port: Number(activeMysqlConfig.port) || 3306,
      user: activeMysqlConfig.user,
      password: activeMysqlConfig.password || "",
      database: activeMysqlConfig.database,
      connectTimeout: 4000
    });

    // 1. Get existing tables list
    const [tablesResult]: any = await connection.query("SHOW TABLES");
    const dbName = activeMysqlConfig.database;
    const existingTableNames = tablesResult.map((row: any) => Object.values(row)[0] as string);

    // 2. Map through our defined schemas and calculate statuses
    const tablesStatus = [];
    for (const schema of TABLE_SCHEMAS) {
      const exists = existingTableNames.some(name => name.toLowerCase() === schema.name.toLowerCase());
      let rowCount = 0;
      let columns: string[] = [];

      if (exists) {
        try {
          const [countResult]: any = await connection.query(`SELECT COUNT(*) as count FROM \`${schema.name}\``);
          rowCount = countResult[0]?.count || 0;

          const [colsResult]: any = await connection.query(`DESCRIBE \`${schema.name}\``);
          columns = colsResult.map((c: any) => c.Field);
        } catch (err) {
          console.error(`Error querying details for table ${schema.name}:`, err);
        }
      }

      tablesStatus.push({
        name: schema.name,
        exists,
        rowCount,
        columns
      });
    }

    return {
      success: true,
      tables: tablesStatus
    };
  } catch (err: any) {
    console.warn("Gracefully caught MySQL tables status check error:", err.message);
    return {
      success: false,
      error: beautifyMySQLError(err, activeMysqlConfig.host),
      tables: []
    };
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {}
    }
  }
}

// Auto-create any missing MySQL tables
export async function createMySQLTables(mysqlConfig?: MySQLConfig) {
  const activeMysqlConfig = mysqlConfig || getMySQLConfig();
  if (!activeMysqlConfig || !activeMysqlConfig.host) {
    throw new Error("ไม่ได้ตั้งค่า Hostinger MySQL หรือโฮสต์ว่างเปล่า");
  }

  let connection: any = null;
  const created: string[] = [];
  try {
    connection = await mysql.createConnection({
      host: activeMysqlConfig.host,
      port: Number(activeMysqlConfig.port) || 3306,
      user: activeMysqlConfig.user,
      password: activeMysqlConfig.password || "",
      database: activeMysqlConfig.database,
      connectTimeout: 5000
    });

    for (const schema of TABLE_SCHEMAS) {
      await connection.query(schema.createSql);
      created.push(schema.name);
    }

    return {
      success: true,
      message: `สร้าง/ตรวจสอบความสมบูรณ์ของตารางเรียบร้อยแล้ว (${created.length} ตาราง)`,
      created
    };
  } catch (err: any) {
    console.warn("Gracefully caught MySQL table creation error:", err.message);
    return {
      success: false,
      message: beautifyMySQLError(err, activeMysqlConfig.host),
      created
    };
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {}
    }
  }
}

// Sync JSON payload into Relational structures inside MySQL
export async function syncToRelationalTables(connection: any, payload: SyncPayload) {
  console.log("[Relational Sync] Starting synchronization into relational MySQL tables...");

  // 1. employees
  if (Array.isArray(payload.employees)) {
    await connection.query("DELETE FROM employees");
    for (const item of payload.employees) {
      await connection.query(
        `INSERT INTO employees (
          id, name, avatar, role, department, email, phone, salary, salary_type, join_date, status, bank_account,
          leave_balance_sick, leave_balance_personal, leave_balance_annual, work_days, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id || "",
          item.name || "",
          item.avatar || "",
          item.role || "",
          item.department || "",
          item.email || "",
          item.phone || "",
          item.salary || 0,
          item.salaryType || "monthly",
          item.joinDate ? item.joinDate.substring(0, 10) : null,
          item.status || "active",
          item.bankAccount || "",
          item.leaveBalance?.sick || 0,
          item.leaveBalance?.personal || 0,
          item.leaveBalance?.annual || 0,
          item.workDays || 0,
          JSON.stringify(item)
        ]
      );
    }
  }

  // 2. leaves
  if (Array.isArray(payload.leaves)) {
    await connection.query("DELETE FROM leaves");
    for (const item of payload.leaves) {
      await connection.query(
        `INSERT INTO leaves (
          id, employee_id, employee_name, type, start_date, end_date, days, reason, status, applied_date, duration_unit, hours, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id || "",
          item.employeeId || "",
          item.employeeName || "",
          item.type || "other",
          item.startDate ? item.startDate.substring(0, 10) : null,
          item.endDate ? item.endDate.substring(0, 10) : null,
          item.days || 0,
          item.reason || "",
          item.status || "pending",
          item.appliedDate ? item.appliedDate.substring(0, 10) : null,
          item.durationUnit || "days",
          item.hours || 0,
          JSON.stringify(item)
        ]
      );
    }
  }

  // 3. payroll
  if (Array.isArray(payload.payroll)) {
    await connection.query("DELETE FROM payroll");
    for (const item of payload.payroll) {
      await connection.query(
        `INSERT INTO payroll (
          id, employee_id, employee_name, month, year, base_salary, allowances, deductions, net_salary, tax, social_security, status, period, voucher_no, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id || "",
          item.employeeId || "",
          item.employeeName || "",
          item.month || "",
          item.year || 0,
          item.baseSalary || 0,
          item.allowances || 0,
          item.deductions || 0,
          item.netSalary || 0,
          item.tax || 0,
          item.socialSecurity || 0,
          item.status || "pending",
          item.period || "",
          item.voucherNo || "",
          JSON.stringify(item)
        ]
      );
    }
  }

  // 4. sales
  if (Array.isArray(payload.sales)) {
    await connection.query("DELETE FROM sales");
    for (const item of payload.sales) {
      await connection.query(
        `INSERT INTO sales (
          id, date, amount, notes, payment_channel, customer_name, receipt_number, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id || "",
          item.date ? item.date.substring(0, 10) : null,
          item.amount || 0,
          item.notes || "",
          item.paymentChannel || "",
          item.customerName || "",
          item.receiptNumber || "",
          JSON.stringify(item)
        ]
      );
    }
  }

  // 5. cheques
  if (Array.isArray(payload.cheques)) {
    await connection.query("DELETE FROM cheques");
    for (const item of payload.cheques) {
      await connection.query(
        `INSERT INTO cheques (
          id, type, cheque_number, bank, partner_name, amount, due_date, issue_date, status, notes, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id || "",
          item.type || "payable",
          item.chequeNumber || "",
          item.bank || "",
          item.partnerName || "",
          item.amount || 0,
          item.dueDate ? item.dueDate.substring(0, 10) : null,
          item.issueDate ? item.issueDate.substring(0, 10) : null,
          item.status || "pending",
          item.notes || "",
          JSON.stringify(item)
        ]
      );
    }
  }

  // 6. cashflow
  if (Array.isArray(payload.cashflow)) {
    await connection.query("DELETE FROM cashflow");
    for (const item of payload.cashflow) {
      await connection.query(
        `INSERT INTO cashflow (
          id, type, category, amount, date, description, status, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id || "",
          item.type || "expense",
          item.category || "",
          item.amount || 0,
          item.date ? item.date.substring(0, 10) : null,
          item.description || "",
          item.status || "completed",
          JSON.stringify(item)
        ]
      );
    }
  }

  // 7. partner_billings
  if (Array.isArray(payload.partnerBillings)) {
    await connection.query("DELETE FROM partner_billings");
    for (const item of payload.partnerBillings) {
      await connection.query(
        `INSERT INTO partner_billings (
          id, partner_name, doc_type, doc_number, delivery_doc_number, billing_doc_number, cn_doc_number, cn_amount,
          book_number, page_number, billing_book_number, billing_page_number, transport_carrier, amount, billing_amount,
          issue_date, due_date, status, notes, contact_person, phone, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id || "",
          item.partnerName || "",
          item.docType || "",
          item.docNumber || "",
          item.deliveryDocNumber || "",
          item.billingDocNumber || "",
          item.cnDocNumber || "",
          item.cnAmount || 0,
          item.bookNumber || "",
          item.pageNumber || "",
          item.billingBookNumber || "",
          item.billingPageNumber || "",
          item.transportCarrier || "",
          item.amount || 0,
          item.billingAmount || 0,
          item.issueDate ? item.issueDate.substring(0, 10) : null,
          item.dueDate ? item.dueDate.substring(0, 10) : null,
          item.status || "pending",
          item.notes || "",
          item.contactPerson || "",
          item.phone || "",
          JSON.stringify(item)
        ]
      );
    }
  }

  // 7b. transport_waybills
  if (Array.isArray(payload.transportWaybills)) {
    await connection.query("DELETE FROM transport_waybills");
    for (const item of payload.transportWaybills) {
      await connection.query(
        `INSERT INTO transport_waybills (
          id, waybill_number, carrier_name, partner_name, delivery_date, book_number, receipt_number,
          quantity, unit_price, total_price, wht_doc_number, wht_rate, wht_amount, status,
          tracking_number, notes, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id || "",
          item.waybillNumber || "",
          item.carrierName || "",
          item.partnerName || "",
          item.deliveryDate ? item.deliveryDate.substring(0, 10) : null,
          item.bookNumber || "",
          item.receiptNumber || "",
          item.quantity || 1,
          item.unitPrice || 0,
          item.totalPrice || 0,
          item.whtDocNumber || "",
          item.whtRate || 1,
          item.whtAmount || 0,
          item.status || "pending_receipt",
          item.trackingNumber || "",
          item.notes || "",
          JSON.stringify(item)
        ]
      );
    }
  }

  // 8. audit_logs
  if (Array.isArray(payload.auditLogs)) {
    await connection.query("DELETE FROM audit_logs");
    for (const item of payload.auditLogs) {
      await connection.query(
        `INSERT INTO audit_logs (
          id, timestamp, action, module, description, user, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id || "",
          item.timestamp ? new Date(item.timestamp) : new Date(),
          item.action || "SYSTEM",
          item.module || "",
          item.description || "",
          item.user || "",
          JSON.stringify(item)
        ]
      );
    }
  }

  // 9. jobs
  if (Array.isArray(payload.jobs)) {
    await connection.query("DELETE FROM jobs");
    for (const item of payload.jobs) {
      await connection.query(
        `INSERT INTO jobs (
          id, title, department, type, location, status, description, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id || "",
          item.title || "",
          item.department || "",
          item.type || "full-time",
          item.location || "",
          item.status || "open",
          item.description || "",
          JSON.stringify(item)
        ]
      );
    }
  }

  // 10. applicants
  if (Array.isArray(payload.applicants)) {
    await connection.query("DELETE FROM applicants");
    for (const item of payload.applicants) {
      await connection.query(
        `INSERT INTO applicants (
          id, job_id, job_title, name, email, stage, rating, applied_date, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id || "",
          item.jobId || "",
          item.jobTitle || "",
          item.name || "",
          item.email || "",
          item.stage || "applied",
          item.rating || 0,
          item.appliedDate ? item.appliedDate.substring(0, 10) : null,
          JSON.stringify(item)
        ]
      );
    }
  }

  // 11. evaluations
  if (Array.isArray(payload.evaluations)) {
    await connection.query("DELETE FROM evaluations");
    for (const item of payload.evaluations) {
      await connection.query(
        `INSERT INTO evaluations (
          id, employee_id, employee_name, role, department, evaluator_name, period, score, strengths, improvements, goals, comments, date, status, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id || "",
          item.employeeId || "",
          item.employeeName || "",
          item.role || "",
          item.department || "",
          item.evaluatorName || "",
          item.period || "",
          item.score || 0,
          item.strengths || "",
          item.improvements || "",
          item.goals || "",
          item.comments || "",
          item.date ? item.date.substring(0, 10) : null,
          item.status || "draft",
          JSON.stringify(item)
        ]
      );
    }
  }

  // 12. attendance
  if (payload.attendance && typeof payload.attendance === "object") {
    await connection.query("DELETE FROM attendance");
    for (const empId of Object.keys(payload.attendance)) {
      const empAttendance = payload.attendance[empId];
      if (empAttendance && empAttendance.records) {
        for (const dateStr of Object.keys(empAttendance.records)) {
          const rec = empAttendance.records[dateStr];
          if (rec) {
            await connection.query(
              `INSERT INTO attendance (
                employee_id, date, status, late_minutes, notes, clock_in, clock_out, raw_json
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                empId,
                dateStr.substring(0, 10),
                rec.status || "present",
                rec.lateMinutes || 0,
                rec.notes || "",
                rec.clockIn || null,
                rec.clockOut || null,
                JSON.stringify(rec)
              ]
            );
          }
        }
      }
    }
  }

  // 13. dayoff_swaps
  if (Array.isArray(payload.dayoffSwaps)) {
    await connection.query("DELETE FROM dayoff_swaps");
    for (const item of payload.dayoffSwaps) {
      await connection.query(
        `INSERT INTO dayoff_swaps (
          id, employee_id, employee_name, original_off_date, swapped_off_date, status, reason, applied_date, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id || "",
          item.employeeId || "",
          item.employeeName || "",
          item.originalOffDate ? item.originalOffDate.substring(0, 10) : null,
          item.swappedOffDate ? item.swappedOffDate.substring(0, 10) : null,
          item.status || "pending",
          item.reason || "",
          item.appliedDate ? item.appliedDate.substring(0, 10) : null,
          JSON.stringify(item)
        ]
      );
    }
  }

  // 14. partner_companies
  if (Array.isArray(payload.partnerCompanies)) {
    await connection.query("DELETE FROM partner_companies");
    for (const item of payload.partnerCompanies) {
      await connection.query(
        `INSERT INTO partner_companies (
          id, name, tax_id, address, contact_person, phone, email, notes, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id || "",
          item.name || "",
          item.taxId || "",
          item.address || "",
          item.contactPerson || "",
          item.phone || "",
          item.email || "",
          item.notes || "",
          JSON.stringify(item)
        ]
      );
    }
  }

  // 15. system_settings
  if (payload.systemSettings && typeof payload.systemSettings === "object" && Object.keys(payload.systemSettings).length > 0) {
    await connection.query("DELETE FROM system_settings");
    const item = payload.systemSettings;
    await connection.query(
      `INSERT INTO system_settings (
        id, company_name, company_address, company_phone, company_tax_id, company_email,
        working_hours_start, working_hours_end, ot_rate_multiplier, social_security_rate,
        social_security_max_cap, withholding_tax_rate, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "current",
        item.companyName || "",
        item.companyAddress || "",
        item.companyPhone || "",
        item.companyTaxId || "",
        item.companyEmail || "",
        item.workingHoursStart || "08:30",
        item.workingHoursEnd || "17:30",
        item.otRateMultiplier || 1.5,
        item.socialSecurityRate || 5,
        item.socialSecurityMaxCap || 750,
        item.withholdingTaxRate || 3,
        JSON.stringify(item)
      ]
    );
  }

  // 16. counter_duties
  if (Array.isArray(payload.counterDuties)) {
    await connection.query("DELETE FROM counter_duties");
    for (const item of payload.counterDuties) {
      await connection.query(
        `INSERT INTO counter_duties (
          id, month, year, raw_json
        ) VALUES (?, ?, ?, ?)`,
        [
          item.id || "",
          item.month || "",
          item.year || 0,
          JSON.stringify(item)
        ]
      );
    }
  }

  console.log("[Relational Sync] Relational synchronization completed successfully.");
}
