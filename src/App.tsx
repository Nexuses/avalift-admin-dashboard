import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import { Toaster } from "./components/ui/sonner";
import {
  requestFirebaseNotificationPermission,
  onMessageListener,
} from "../firebase-config";
import LoginPage from "./app/login/page";
import Layout from "./Layout";
import Page from "./app/dashboard/page";
import CustomersPage from "./app/user&customer/customers";
import DriversPage from "./app/user&customer/drivers";
import AccountantsPage from "./app/user&customer/accountants";
import OperatorsPage from "./app/user&customer/operators";
import PDPage from "./app/user&customer/pd";
import PricingPage from "./app/ManagePricing/page";
import OrganizationPage from "./app/organization/Page";
import VehiclesPage from "./app/vehicles/AllVehiclePage";
import BrandPage from "./app/vehicles/BrandPage";
import ColorsPage from "./app/vehicles/ColorsPage";
import PdRideHistory from "./app/PdRideHistory/pdData/Page";
import PdStatus from "./app/PdRideHistory/PdStatus/Page";
import AllRidesPage from "./app/Rides/Page";
import AddRidesPage from "./app/Rides/AddRide/Page";
import AvailableDriversPage from "./app/availableDrivers/page";
import WalletPage from "./app/wallet/Page";
import CouponsPage from "./app/Coupons/Coupon/Page";
import CashHandlingPage from "./app/RevenueReport/Page";
import ChauffeurPdRide from "./app/PdRideHistory/ChaffeurPdRide/Page";
import UserGroupPage from "./app/Coupons/UserGroups/Page";
import NotificationsPage from "./app/NotificationsPage/NotificationsPage";
import SendNotificationPage from "./app/NotificationsPage/SendNotificationPage";
import CooperateCustomerPage from "./app/user&customer/corporateCustomer";
import PDWalletPage from "./app/wallet/PdWalletPage";
import ChauffeurWalletPage from "./app/wallet/ChauffeurWalletPage";
import TipWalletPage from "./app/wallet/TipWalletPage";
import TipWalletDetailsPage from "./app/wallet/TipWalletDetailsPage";
import OtherOrganizationPricing from "./app/ManagePricing/OtherOrganizationPricing";
import ChauffeurCashHandlingPage from "./app/CashHandling/ChauffeurCash";
import PDCashHandlingPage from "./app/CashHandling/PdCashPage";
import InvoicePage from "./app/Invoice/Page";
import InvoiceReport from "./app/Invoice/Invoice Report/Invoice Report";
import AdminWalletPage from "./app/wallet/AdminWalletPage";
import DriverLogSummaryPage from "./app/availableDrivers/DriverLogSummaryPage";
import UsersPage from "./app/user&customer/admin";
import ChauffeurWalletHistoryPage from "./components/ChauffeurWallet";
import { ChauffeurWalletDetailsPage } from "./components/ChauffeurCash";
import PDWalletHistoryPage from "./components/PdWallet";
import PDWalletDetailsPage from "./components/PdCash";
import ChangePasswordPage from "./components/ChangePasswordPage";
import AccountPage from "./app/Account/Page";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect } from "react";
import BanksPage from "./app/Bank/Page";
import CouponpageDetails from "./app/Coupons/CouponDetails/Page";

const AppContent: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) =>
          console.log("Service Worker registered:", registration)
        )
        .catch((err) =>
          console.error("Service Worker registration failed:", err)
        );
    }

    // Request notification permission
    requestFirebaseNotificationPermission()
      .then((token) => {
        if (token) {
          console.log("FCM Token retrieved:", token);
        }
      })
      .catch((err) => console.error("Notification permission error:", err));

    // Listen for foreground messages
    onMessageListener().then((payload) => {
      console.log("Foreground notification received:", payload);
    });

    // Listen for storage events to sync session across tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) return;

      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      const authToken = localStorage.getItem("authToken");

      if (event.key === "authToken" || event.key === "isLoggedIn") {
        if (isLoggedIn && authToken) {
          // New login detected, navigate to dashboard
          navigate("/admin/dashboard");
        } else {
          // No valid session, navigate to login
          navigate("/");
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate]);

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Login Page */}
        <Route path="/" element={<LoginPage />} />

        {/* Dashboard Layout with Sidebar */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Page />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="banks" element={<BanksPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="accountants" element={<AccountantsPage />} />
          <Route path="operators" element={<OperatorsPage />} />
          <Route path="pd" element={<PDPage />} />
          <Route path="OrganizationCustomer" element={<CooperateCustomerPage />} />
          <Route path="InvoicePage" element={<InvoicePage />} />
          <Route path="InvoiceReport" element={<InvoiceReport />} />
          <Route path="ManagePricing" element={<PricingPage />} />
          <Route path="organization" element={<OrganizationPage />} />
          <Route path="AllVehicle" element={<VehiclesPage />} />
          <Route path="AllBrands" element={<BrandPage />} />
          <Route path="AllColors" element={<ColorsPage />} />
          <Route path="PdPickupDrop" element={<PdRideHistory />} />
          <Route path="PdStatus" element={<PdStatus />} />
          <Route path="Chaffeur-PD-Ride" element={<ChauffeurPdRide />} />
          <Route path="Rides" />
          <Route path="AllRides" element={<AllRidesPage />} />
          <Route path="AddRidesPage" element={<AddRidesPage />} />
          <Route path="AvailableDriversPage" element={<AvailableDriversPage />} />
          <Route path="AvailableDriversPage/DriverLogSummaryPage" element={<DriverLogSummaryPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="coupons/usergroup" element={<UserGroupPage />} />
          <Route path="coupons/details" element={<CouponpageDetails/>} />
          <Route path="RevenueReport" element={<CashHandlingPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="Notifications" element={<NotificationsPage />} />
          <Route path="Notifications/send" element={<SendNotificationPage />} />
          <Route path="PDWallet" element={<PDWalletPage />} />
          <Route path="ChauffeurWallet" element={<ChauffeurWalletPage />} />
          <Route path="TipWallet" element={<TipWalletPage />} />
          <Route path="TipWalletDetails" element={<TipWalletDetailsPage />} />
          <Route path="OtherOrganzationPricing" element={<OtherOrganizationPricing />} />
          <Route path="ChauffeurCash" element={<ChauffeurCashHandlingPage />} />
          <Route path="PdCash" element={<PDCashHandlingPage />} />
          <Route path="AdminWallet" element={<AdminWalletPage />} />
          <Route path="Users" element={<UsersPage />} />
          <Route path="/admin/dashboard/ChauffeurWalletHistory" element={<ChauffeurWalletHistoryPage />} />
          <Route path="/admin/dashboard/CashHandlingDetails" element={<ChauffeurWalletDetailsPage />} />
          <Route path="/admin/dashboard/PDWalletHistory" element={<PDWalletHistoryPage />} />
          <Route path="/admin/dashboard/PDWalletDetails" element={<PDWalletDetailsPage />} />
          <Route path="/admin/dashboard/change-password" element={<ChangePasswordPage />} />
          <Route path="/admin/dashboard/Account" element={<AccountPage />} />
          <Route path="newcoupons" />
          <Route path="allcoupons" />
          <Route path="security" />
          <Route path="capabilities" />
          <Route path="roles" />
          <Route path="allpage" />
          <Route path="settings" />
        </Route>
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
