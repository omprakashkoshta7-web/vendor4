import { API_BASE_URL } from "../config/api";
import { getAuthToken } from "../services/api";

export async function checkAPIHealth() {
  console.log("🏥 Starting API Health Check...");
  
  // 1. Check server connectivity
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (healthResponse.ok) {
      console.log("✅ Server is reachable");
    } else {
      console.log(`❌ Server health check failed: ${healthResponse.status}`);
    }
  } catch (error) {
    console.log("❌ Server is not reachable:", error);
  }

  // 2. Check authentication
  const token = getAuthToken();
  if (!token) {
    console.log("❌ No auth token found - please login");
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = Date.now() > payload.exp * 1000;
    
    if (isExpired) {
      console.log("❌ Auth token is expired - please login again");
      return false;
    } else {
      console.log("✅ Auth token is valid");
    }
  } catch (e) {
    console.log("❌ Invalid auth token format");
    return false;
  }

  // 3. Test a simple authenticated endpoint
  try {
    const testResponse = await fetch(`${API_BASE_URL}/vendor/stores`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (testResponse.ok) {
      console.log("✅ Authentication is working");
      return true;
    } else {
      console.log(`❌ Authentication test failed: ${testResponse.status}`);
      return false;
    }
  } catch (error) {
    console.log("❌ Authentication test error:", error);
    return false;
  }
}

export async function testSpecificFinanceAPI(endpoint: string) {
  const token = getAuthToken();
  
  if (!token) {
    console.log(`❌ ${endpoint}: No auth token`);
    return false;
  }

  try {
    console.log(`🧪 Testing ${endpoint}...`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json().catch(() => null);

    if (response.ok) {
      console.log(`✅ ${endpoint}: Success`);
      console.log(`📊 Response:`, data);
      return true;
    } else {
      console.log(`❌ ${endpoint}: Failed (${response.status})`);
      console.log(`📊 Error:`, data);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${endpoint}: Network error -`, error);
    return false;
  }
}

export async function runFullFinanceAPITest() {
  console.log("🔬 Running Full Finance API Test...");
  
  // First check basic health
  const isHealthy = await checkAPIHealth();
  if (!isHealthy) {
    console.log("🚨 Basic health check failed - stopping test");
    return;
  }

  // Test all finance endpoints
  const financeEndpoints = [
    "/vendor/finance/wallet/summary",
    "/vendor/finance/wallet/store-wise",
    "/vendor/finance/wallet/deductions", 
    "/vendor/finance/closure/daily",
    "/vendor/finance/payouts/schedule",
    "/vendor/finance/payouts/history"
  ];

  let successCount = 0;
  
  for (const endpoint of financeEndpoints) {
    const success = await testSpecificFinanceAPI(endpoint);
    if (success) successCount++;
  }

  console.log(`📈 Finance API Test Results: ${successCount}/${financeEndpoints.length} working`);
  
  if (successCount === 0) {
    console.log("🚨 All finance APIs are failing!");
    console.log("💡 Possible causes:");
    console.log("   - Finance module not implemented in backend");
    console.log("   - Wrong API endpoints");
    console.log("   - Database not seeded with vendor data");
    console.log("   - Permission issues");
  } else if (successCount < financeEndpoints.length) {
    console.log("⚠️ Some finance APIs are failing");
  } else {
    console.log("🎉 All finance APIs are working!");
  }
}