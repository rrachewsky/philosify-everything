// ============================================================
// ADS PLATFORM - BARREL EXPORT
// ============================================================

// Auth
export {
  handleAdsSignup,
  handleAdsLogin,
  handleAdsLogout,
  handleAdsMe,
  handleAdsRefresh,
} from './auth.js';

// Campaigns
export {
  handleListCampaigns,
  handleGetCampaign,
  handleCreateCampaign,
  handleUpdateCampaign,
  handleDeleteCampaign,
} from './campaigns.js';

// Billing
export {
  handleGetBalance,
  handleGetTransactions,
  handleCreateCheckout,
  handleBillingWebhook,
} from './billing.js';

// Account
export {
  handleUpdateProfile,
  handleChangePassword,
  handleDeleteAccount,
  handleStatsOverview,
} from './account.js';

// Creatives
export {
  handleUploadCreative,
  handleDeleteCreative,
} from './creatives.js';

// Ad Serving (for Philosify frontend)
export {
  handleServeAd,
  handleServeAdBatch,
  handleRecordImpression,
  handleRecordClick,
} from './serve.js';

// Inventory Management
export {
  handleGetInventory,
  handleCheckAvailability,
  handleGetPricing,
  handleGetQuote,
  handleCalculateCart,
} from './inventory.js';

// Orders
export {
  handleListOrders,
  handleGetOrder,
  handleCreateOrder,
  handleUpdateOrder,
  handleOrderCheckout,
  handlePauseOrder,
  handleResumeOrder,
  handleCancelOrder,
  handleOrderPaymentWebhook,
} from './orders.js';

// Budget Planner
export {
  handleGeneratePlan,
  handleCreateFromPlan,
  handleListPlans,
  handleGetPlan,
  handlePlanCheckout,
  handlePlanPaymentWebhook,
  handleApprovePlanCreative,
  handleRequestPlanRevision,
} from './planner.js';

// Audience Targeting
export {
  handleGetTargetingOptions,
  handleEstimateReach,
  handleGetSuggestions,
  handleValidateTargeting,
  updateUserGeolocation,
} from './targeting.js';

// Admin (owner only)
export {
  handleListPending,
  handleApproveAdvertiser,
  handleRejectAdvertiser,
  handleSuspendAdvertiser,
  handleAdminStats,
  handleAdminOverview,
  handleAdminListPlans,
  handleAdminListCreativeRequests,
  handleAdminSubmitCreativeDraft,
  handleAdminApprovePlan,
} from './admin.js';

// Analytics & Reporting
export {
  handleAnalyticsOverview,
  handleAnalyticsExport,
} from './analytics.js';

// Agency
export {
  handleAgencySignup,
  handleAgencyLogin,
  handleAgencyLogout,
  handleAgencyMe,
  handleListClients,
  handleCreateClient,
  handleUpdateClientCommission,
  handleAgencyEarnings,
  handleAgencyPayout,
  handleAgencyListClientCampaigns,
  handleAgencyCreateClientCampaign,
  handleAgencyUpdateClientCampaign,
  handleAgencyDeleteClientCampaign,
} from './agency.js';
