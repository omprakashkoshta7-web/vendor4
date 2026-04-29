import { API_BASE_URL } from "../config/api";
import { getAuthToken } from "../services/api";

export interface APIStatus {
  endpoint: string;
  status: "success" | "error" | "unauthorized" | "not_found";
  statusCode?: number;
  message?: string;
  responseTime?: number;
}

export async function checkAllFinanceAPIs(): Promise<APIStatus[]> {
  const financeEndpoints = [
    "/vendor/finance/wallet/summary",
    "/vendor/finance/wallet/store-wise", 
    "/vendor/finance/wallet/deductions",
    "/vendor/finance/closure/daily",
    "/vendor/finance/closure/weekly",
    "/vendor/finance/closure/monthly",
    "/vendor/finance/payouts/schedule",
    "/vendor/finance/payouts/history"
  ];

  const results: APIStatus[] = [];
  const token = getAuthToken();

  for (const endpoint of financeEndpoints) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        }
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        results.push({
          endpoint,
          status: "success",
          statusCode: response.status,
          responseTime,
          message: "OK"
        });
      } else if (response.status === 401) {
        results.push({
          endpoint,
          status: "unauthorized", 
          statusCode: response.status,
          responseTime,
          message: "Authentication required"
        });
      } else if (response.status === 404) {
        results.push({
          endpoint,
          status: "not_found",
          statusCode: response.status, 
          responseTime,
          message: "Endpoint not found"
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        results.push({
          endpoint,
          status: "error",
          statusCode: response.status,
          responseTime,
          message: errorData.message || `HTTP ${response.status}`
        });
      }
    } catch (error) {
      results.push({
        endpoint,
        status: "error",
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : "Network error"
      });
    }
  }

  return results;
}

export function displayAPIStatus(results: APIStatus[]) {
  console.log("🔍 Finance API Status Check Results:");
  console.log("=====================================");
  
  results.forEach(result => {
    const icon = result.status === "success" ? "✅" : 
                 result.status === "unauthorized" ? "🔒" :
                 result.status === "not_found" ? "❓" : "❌";
    
    console.log(`${icon} ${result.endpoint}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    if (result.statusCode) console.log(`   Code: ${result.statusCode}`);
    if (result.responseTime) console.log(`   Time: ${result.responseTime}ms`);
    if (result.message) console.log(`   Message: ${result.message}`);
    console.log("");
  });

  // Summary
  const successCount = results.filter(r => r.status === "success").length;
  const totalCount = results.length;
  
  console.log(`📊 Summary: ${successCount}/${totalCount} APIs working`);
  
  if (successCount === 0) {
    console.log("🚨 All APIs are failing - check authentication or server status");
  } else if (successCount < totalCount) {
    console.log("⚠️ Some APIs are failing - partial functionality available");
  } else {
    console.log("🎉 All APIs are working correctly!");
  }
}

// Helper to run full API check
export async function runFullAPICheck() {
  console.log("🔄 Starting comprehensive API status check...");
  
  // Check basic connectivity first
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    console.log(`🌐 Server connectivity: ${healthResponse.ok ? "✅ OK" : "❌ Failed"}`);
  } catch (error) {
    console.log("🌐 Server connectivity: ❌ Failed -", error);
  }

  // Check authentication
  const token = getAuthToken();
  console.log(`🔐 Auth token: ${token ? "✅ Present" : "❌ Missing"}`);
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = Date.now() > payload.exp * 1000;
      console.log(`🔐 Token status: ${isExpired ? "❌ Expired" : "✅ Valid"}`);
      console.log(`🔐 Token expires: ${new Date(payload.exp * 1000).toLocaleString()}`);
    } catch (e) {
      console.log("🔐 Token format: ❌ Invalid");
    }
  }

  // Check all finance APIs
  const results = await checkAllFinanceAPIs();
  displayAPIStatus(results);
  
  return results;
}