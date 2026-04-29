import {
  getVendorWalletSummary,
  getVendorWalletStoreWise,
  getVendorWalletDeductions,
  getVendorClosureDaily,
  getVendorClosureWeekly,
  getVendorClosureMonthly,
  getVendorPayoutsSchedule,
  getVendorPayoutHistory,
  getVendorFinanceSummaryDetailed,
  getVendorPayoutHistoryDetailed,
  getVendorWalletSummaryDetailed,
  getVendorWalletStoreWiseDetailed,
  getVendorWalletDeductionsDetailed,
} from "../services/vendor.service";

export interface APITestResult {
  endpoint: string;
  success: boolean;
  data?: any;
  error?: string;
  responseTime: number;
}

export async function testAllFinanceAPIs(): Promise<APITestResult[]> {
  console.log("🧪 Testing All Finance APIs...");
  
  const tests = [
    // Basic Finance APIs
    { name: "Wallet Summary", fn: () => getVendorWalletSummary() },
    { name: "Wallet Store-wise", fn: () => getVendorWalletStoreWise() },
    { name: "Wallet Deductions", fn: () => getVendorWalletDeductions() },
    { name: "Closure Daily", fn: () => getVendorClosureDaily() },
    { name: "Closure Weekly", fn: () => getVendorClosureWeekly() },
    { name: "Closure Monthly", fn: () => getVendorClosureMonthly() },
    { name: "Payouts Schedule", fn: () => getVendorPayoutsSchedule() },
    { name: "Payouts History", fn: () => getVendorPayoutHistory() },
    
    // Enhanced Finance APIs
    { name: "Finance Summary Detailed", fn: () => getVendorFinanceSummaryDetailed() },
    { name: "Payout History Detailed", fn: () => getVendorPayoutHistoryDetailed() },
    { name: "Wallet Summary Detailed", fn: () => getVendorWalletSummaryDetailed() },
    { name: "Wallet Store-wise Detailed", fn: () => getVendorWalletStoreWiseDetailed() },
    { name: "Wallet Deductions Detailed", fn: () => getVendorWalletDeductionsDetailed() },
  ];

  const results: APITestResult[] = [];

  for (const test of tests) {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Testing ${test.name}...`);
      const response = await test.fn();
      const responseTime = Date.now() - startTime;
      
      results.push({
        endpoint: test.name,
        success: true,
        data: response.data,
        responseTime
      });
      
      console.log(`✅ ${test.name}: Success (${responseTime}ms)`);
      console.log(`📊 Data:`, response.data);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      results.push({
        endpoint: test.name,
        success: false,
        error: errorMessage,
        responseTime
      });
      
      console.log(`❌ ${test.name}: Failed (${responseTime}ms)`);
      console.log(`🚨 Error:`, errorMessage);
    }
  }

  // Summary
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`\n📈 API Test Summary: ${successCount}/${totalCount} APIs working`);
  
  if (successCount === 0) {
    console.log("🚨 All Finance APIs are failing!");
    console.log("💡 Check authentication, server status, or API implementation");
  } else if (successCount < totalCount) {
    console.log("⚠️ Some Finance APIs are failing");
    console.log("💡 Check specific endpoint implementations");
  } else {
    console.log("🎉 All Finance APIs are working perfectly!");
  }

  return results;
}

export function displayAPITestResults(results: APITestResult[]) {
  console.table(results.map(r => ({
    Endpoint: r.endpoint,
    Status: r.success ? "✅ Success" : "❌ Failed",
    "Response Time": `${r.responseTime}ms`,
    Error: r.error || "-"
  })));
}

export async function testSpecificAPI(apiName: string) {
  const apiMap: Record<string, () => Promise<any>> = {
    "wallet-summary": getVendorWalletSummary,
    "wallet-store-wise": getVendorWalletStoreWise,
    "wallet-deductions": getVendorWalletDeductions,
    "closure-daily": getVendorClosureDaily,
    "closure-weekly": getVendorClosureWeekly,
    "closure-monthly": getVendorClosureMonthly,
    "payouts-schedule": getVendorPayoutsSchedule,
    "payouts-history": getVendorPayoutHistory,
  };

  const apiFunction = apiMap[apiName];
  if (!apiFunction) {
    console.error(`❌ Unknown API: ${apiName}`);
    return null;
  }

  try {
    console.log(`🧪 Testing ${apiName}...`);
    const startTime = Date.now();
    const response = await apiFunction();
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ ${apiName}: Success (${responseTime}ms)`);
    console.log(`📊 Response:`, response);
    return response;
  } catch (error) {
    console.error(`❌ ${apiName}: Failed`);
    console.error(`🚨 Error:`, error);
    return null;
  }
}

// Quick test functions for console use
export const quickTests = {
  wallet: () => testSpecificAPI("wallet-summary"),
  stores: () => testSpecificAPI("wallet-store-wise"),
  deductions: () => testSpecificAPI("wallet-deductions"),
  daily: () => testSpecificAPI("closure-daily"),
  weekly: () => testSpecificAPI("closure-weekly"),
  monthly: () => testSpecificAPI("closure-monthly"),
  schedule: () => testSpecificAPI("payouts-schedule"),
  history: () => testSpecificAPI("payouts-history"),
  all: testAllFinanceAPIs,
};