import fs from "fs";
import path from "path";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, writeBatch, deleteDoc } from "firebase/firestore";
import mysql from "mysql2/promise";

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
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading mysql_config.json:", error);
  }
  
  return {
    host: process.env.MYSQL_HOST || "",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "",
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

  // 3. Sync to Firebase Firestore (ONLY write changed collections to optimize Spark quota usage)
  try {
    const db = getFirestoreInstance();
    const batch = writeBatch(db);
    let queuedWritesCount = 0;

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

      // Check change detection
      let hasChanged = true;
      if (previousPayload) {
        let prevVal = previousPayload[item.key];
        if (prevVal === undefined || prevVal === null) {
          if (item.key === "systemSettings") {
            prevVal = {};
          } else if (item.key === "attendance") {
            prevVal = {};
          } else {
            prevVal = [];
          }
        }
        
        // Quick structural JSON comparison
        if (JSON.stringify(val) === JSON.stringify(prevVal)) {
          hasChanged = false;
        }
      }

      if (hasChanged) {
        const docRef = doc(db, item.path);
        batch.set(docRef, { data: val });
        queuedWritesCount++;
        console.log(`[Firestore Sync] Queueing change for collection: ${item.key}`);
      }
    }

    if (queuedWritesCount > 0) {
      await batch.commit();
      console.log(`Successfully synced ${queuedWritesCount} modified collections to Firebase Firestore!`);
    } else {
      console.log("[Firestore Sync] No collections changed. Skipped Firestore write batch to conserve free daily quota.");
    }
    results.firebase.success = true;
  } catch (error: any) {
    console.error("Firebase Firestore Sync Error:", error);
    results.firebase.success = false;
    results.firebase.error = error.message || "Failed to save to Firestore";
  }

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
    } catch (error: any) {
      console.error("[MySQL Sync] Error syncing to MySQL:", error);
      results.mysql.success = false;
      results.mysql.error = error.message || "Failed to sync to MySQL";
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
      console.error("[MySQL Load] Error loading from MySQL:", error);
      data.mysqlError = error.message || "Failed to load from MySQL";
    } finally {
      if (connection) {
        try {
          await connection.end();
        } catch (e) {}
      }
    }
  }

  let loadedFromFirebase = false;
  let firebaseLoadError: string | null = null;

  try {
    const db = getFirestoreInstance();
    const firebasePayload: any = {};

    // Load each document in parallel
    await Promise.all(
      COLLECTION_KEYS.map(async (item) => {
        try {
          const docRef = doc(db, item.path);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            firebasePayload[item.key] = docSnap.data().data;
          } else {
            firebasePayload[item.key] = null;
          }
        } catch (err: any) {
          console.error(`Error loading key ${item.key} from Firebase:`, err);
          firebasePayload[item.key] = null;
          const errMsg = err?.message || String(err);
          if (
            errMsg.toLowerCase().includes("quota") || 
            errMsg.toLowerCase().includes("resource_exhausted") || 
            errMsg.toLowerCase().includes("limit") || 
            errMsg.toLowerCase().includes("exhausted")
          ) {
            firebaseLoadError = errMsg;
          }
        }
      })
    );

    // Check if we loaded any valid documents
    const hasAnyData = Object.values(firebasePayload).some(v => v !== null);
    if (hasAnyData) {
      data.firebase = {
        employees: firebasePayload.employees || [],
        payroll: firebasePayload.payroll || [],
        leaves: firebasePayload.leaves || [],
        sales: firebasePayload.sales || [],
        cheques: firebasePayload.cheques || [],
        cashflow: firebasePayload.cashflow || [],
        partnerBillings: firebasePayload.partnerBillings || [],
        auditLogs: firebasePayload.auditLogs || [],
        jobs: firebasePayload.jobs || [],
        applicants: firebasePayload.applicants || [],
        evaluations: firebasePayload.evaluations || [],
        attendance: firebasePayload.attendance || {},
        dayoffSwaps: firebasePayload.dayoffSwaps || [],
        partnerCompanies: firebasePayload.partnerCompanies || [],
        systemSettings: firebasePayload.systemSettings || {},
        counterDuties: firebasePayload.counterDuties || []
      };
      loadedFromFirebase = true;
      console.log("Successfully loaded data from Firebase Firestore!");
    }
  } catch (error: any) {
    console.error("Firebase Firestore Load Error:", error);
  }

  // Fallback to local file database if Firebase load failed or returned no data
  if (!loadedFromFirebase) {
    try {
      if (fs.existsSync(LOCAL_DB_PATH)) {
        const fileData = fs.readFileSync(LOCAL_DB_PATH, "utf8");
        const parsed = JSON.parse(fileData);
        data.firebase = {
          employees: parsed.employees || [],
          payroll: parsed.payroll || [],
          leaves: parsed.leaves || [],
          sales: parsed.sales || [],
          cheques: parsed.cheques || [],
          cashflow: parsed.cashflow || [],
          partnerBillings: parsed.partnerBillings || [],
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
        console.log("Loaded data from local backup file (Firebase fallback)");
      }
    } catch (error: any) {
      console.error("Local Backup Load Error:", error);
    }
  }

  data.firebaseError = firebaseLoadError;
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
