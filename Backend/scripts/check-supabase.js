import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

if (!globalThis.WebSocket) {
  globalThis.WebSocket = class DummyWebSocket {};
}

dotenv.config({ path: "./.env" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key provided:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Disable realtime websocket in Node.js server
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    // Disable realtime if not using websockets
    transport: undefined,
  },
});

async function check() {
  try {
    console.log("Testing PostgREST query...");
    const { data, error } = await supabase.from("employees").select("*").limit(1);
    if (error) {
      console.log("Query 'employees' table response:", error.message, error.code, error.details);
    } else {
      console.log("Employees table exists! Row count sample:", data?.length);
    }

    const { data: usersData, error: usersErr } = await supabase.from("users").select("*").limit(1);
    if (usersErr) {
      console.log("Query 'users' table response:", usersErr.message);
    } else {
      console.log("Users table exists! Row count sample:", usersData?.length);
    }
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

check();
