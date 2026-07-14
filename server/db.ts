import fs from "fs";
import path from "path";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, writeBatch, deleteDoc } from "firebase/firestore";

// Config paths
const LOCAL_DB_PATH = path.join(process.cwd(), "server", "local_db.json");
const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");

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
  return {
    host: "",
    port: 3306,
    user: "",
    password: "",
    database: "",
    autoCreateDb: false
  };
}

export function saveMySQLConfig(config: MySQLConfig) {
  return true;
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

  // 1. Always save a local copy as a backup
  try {
    const parentDir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(payload, null, 2), "utf8");
  } catch (error: any) {
    console.error("Local backup save error:", error);
  }

  // 2. Sync to Firebase Firestore
  try {
    const db = getFirestoreInstance();
    const batch = writeBatch(db);

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

      const docRef = doc(db, item.path);
      batch.set(docRef, { data: val });
    }

    await batch.commit();
    results.firebase.success = true;
    console.log("Successfully synced all collections to Firebase Firestore!");
  } catch (error: any) {
    console.error("Firebase Firestore Sync Error:", error);
    results.firebase.success = false;
    results.firebase.error = error.message || "Failed to save to Firestore";
  }

  return results;
}

// Load from Firebase Firestore, fallback to Local Database
export async function loadFromDualDatabases(mysqlConfig?: MySQLConfig) {
  const data: any = {
    mysql: null,
    firebase: null
  };

  let loadedFromFirebase = false;

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
        } catch (err) {
          console.error(`Error loading key ${item.key} from Firebase:`, err);
          firebasePayload[item.key] = null;
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
