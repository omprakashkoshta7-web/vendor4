import {
  getVendorWalletSummary,
  getVendorWalletStoreWise,
  getVendorWalletDeductions,
  getVendorClosureDaily,
  getVendorPayoutsSchedule,
  getVendorPayoutHistory,
} from "../services/vendor.service";
import { runFullFinanceAPITest } from "./api-health-check";
import { testAllFinanceAPIs, displayAPITestResults } from "./test-finance-apis";

export async function debugFinanceAPIs() {
  console.log("🔍 Starting Comprehensive Finance APIs Debug...");
  
  // Step 1: Health check
  console.log("\n=== STEP 1: API Health Check ===");
  await runFullFinanceAPITest();
  
  // Step 2: Comprehensive API testing
  console.log("\n=== STEP 2: Comprehensive API Testing ===");
  const testResults = await testAllFinanceAPIs();
  displayAPITestResults(testResults);
  
  // Step 3: Legacy debug (for backward compatibility)
  console.log("\n=== STEP 3: Legacy Debug Results ===");
  
  const results = {
    walletSummary: null as any,
    walletStoreWise: null as any,
    walletDeductions: null as any,
    closureDaily: null as any,
    payoutsSchedule: null as any,
    payoutHistory: null as any,
    errors: [] as string[],
  };

  // Test Wallet Summary API
  try {
    console.log("📊 Testing Wallet Summary API...");
    const walletRes = await getVendorWalletSummary();
    results.walletSummary = walletRes;
    console.log("✅ Wallet Summary:", walletRes);
  } catch (error) {
    const errorMsg = `❌ Wallet Summary failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    results.errors.push(errorMsg);
  }

  // Test Wallet Store-wise API
  try {
    console.log("🏪 Testing Wallet Store-wise API...");
    const storeWiseRes = await getVendorWalletStoreWise();
    results.walletStoreWise = storeWiseRes;
    console.log("✅ Wallet Store-wise:", storeWiseRes);
  } catch (error) {
    const errorMsg = `❌ Wallet Store-wise failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    results.errors.push(errorMsg);
  }

  // Test Wallet Deductions API
  try {
    console.log("💸 Testing Wallet Deductions API...");
    const deductionsRes = await getVendorWalletDeductions();
    results.walletDeductions = deductionsRes;
    console.log("✅ Wallet Deductions:", deductionsRes);
  } catch (error) {
    const errorMsg = `❌ Wallet Deductions failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    results.errors.push(errorMsg);
  }

  // Test Closure Daily API
  try {
    console.log("📅 Testing Closure Daily API...");
    const closureRes = await getVendorClosureDaily();
    results.closureDaily = closureRes;
    console.log("✅ Closure Daily:", closureRes);
  } catch (error) {
    const errorMsg = `❌ Closure Daily failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    results.errors.push(errorMsg);
  }

  // Test Payouts Schedule API
  try {
    console.log("⏰ Testing Payouts Schedule API...");
    const scheduleRes = await getVendorPayoutsSchedule();
    results.payoutsSchedule = scheduleRes;
    console.log("✅ Payouts Schedule:", scheduleRes);
  } catch (error) {
    const errorMsg = `❌ Payouts Schedule failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    results.errors.push(errorMsg);
  }

  // Test Payouts History API
  try {
    console.log("📜 Testing Payouts History API...");
    const historyRes = await getVendorPayoutHistory();
    results.payoutHistory = historyRes;
    console.log("✅ Payouts History:", historyRes);
  } catch (error) {
    const errorMsg = `❌ Payouts History failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    results.errors.push(errorMsg);
  }

  console.log("🏁 Debug Complete. Results:", results);
  
  // Show summary
  if (results.errors.length === 0) {
    console.log("🎉 All Finance APIs are working correctly!");
  } else {
    console.log(`⚠️ Found ${results.errors.length} API errors:`);
    results.errors.forEach(error => console.log(error));
  }

  return results;
}

// Helper function to check authentication
export function checkAuthStatus() {
  const token = localStorage.getItem("auth_token");
  const session = localStorage.getItem("vendor_session");
  
  console.log("🔐 Auth Status Check:");
  console.log("Token exists:", !!token);
  console.log("Session exists:", !!session);
  
  if (token) {
    try {
      // Try to decode JWT payload (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log("Token payload:", payload);
      console.log("Token expires:", new Date(payload.exp * 1000));
      console.log("Token expired:", Date.now() > payload.exp * 1000);
    } catch (e) {
      console.log("❌ Invalid token format");
    }
  }
  
  if (session) {
    try {
      const sessionData = JSON.parse(session);
      console.log("Session data:", sessionData);
    } catch (e) {
      console.log("❌ Invalid session format");
    }
  }
}

// Test API connectivity
export async function testAPIConnectivity() {
  const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api`;
  
  console.log("🌐 Testing API Connectivity...");
  console.log("API Base URL:", API_BASE_URL);
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ API Server is reachable:", data);
      return true;
    } else {
      console.log("❌ API Server returned error:", response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log("❌ API Server is not reachable:", error);
    return false;
  }
}