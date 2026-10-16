import React from "react";
import {
  LayoutDashboard, Users, Calendar, Stethoscope, BedDouble,
  AlertTriangle, FileText, FlaskConical, Scan, Pill,
  Scissors, Heart, Receipt, CreditCard, Shield,
  Package, Users2, Clock, BarChart3, Settings,
  Bell, Activity
} from "lucide-react";
import { ModuleId } from "../types/edition";

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  moduleId: ModuleId;
  permission?: string;
  roles?: string[];
  badge?: number;
  section?: string;
}

export const navItems: NavItem[] = [
  // Core Overview
  { label: "Dashboard", path: "/dashboard", icon: React.createElement(LayoutDashboard, { size: 18 }), moduleId: "dashboard", section: "core" },

  // Clinical Workspace (Doctors, Nurses, Receptionists)
  { label: "Patients", path: "/patients", icon: React.createElement(Users, { size: 18 }), moduleId: "patients", permission: "patients.read", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse", "Receptionist"], section: "clinical" },
  { label: "Doctors Directory", path: "/doctors", icon: React.createElement(Stethoscope, { size: 18 }), moduleId: "doctors", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Receptionist", "HR Manager"], section: "clinical" },
  { label: "Nurses Desk", path: "/nurses", icon: React.createElement(Activity, { size: 18 }), moduleId: "nurses", roles: ["Super Administrator", "Hospital Administrator", "Nurse", "Head Nurse", "HR Manager"], section: "clinical" },
  { label: "Appointments", path: "/appointments", icon: React.createElement(Calendar, { size: 18 }), moduleId: "appointments", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Receptionist", "Nurse"], section: "clinical" },
  { label: "OPD Queue", path: "/opd", icon: React.createElement(Stethoscope, { size: 18 }), moduleId: "opd", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse", "Receptionist"], section: "clinical" },
  { label: "IPD Wards", path: "/ipd", icon: React.createElement(BedDouble, { size: 18 }), moduleId: "ipd", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse", "Receptionist"], section: "clinical" },
  { label: "Emergency Triage", path: "/emergency", icon: React.createElement(AlertTriangle, { size: 18 }), moduleId: "emergency", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse", "Emergency Specialist"], section: "clinical" },
  { label: "EMR Desk", path: "/emr", icon: React.createElement(FileText, { size: 18 }), moduleId: "emr", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse"], section: "clinical" },

  // Clinical Services (Diagnostics, Surgery, ICU, Pharmacy)
  { label: "Laboratory", path: "/laboratory", icon: React.createElement(FlaskConical, { size: 18 }), moduleId: "laboratory", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Laboratory Technician", "Pathologist"], section: "services" },
  { label: "Radiology / PACS", path: "/radiology", icon: React.createElement(Scan, { size: 18 }), moduleId: "radiology", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Radiologist", "X-Ray Tech"], section: "services" },
  { label: "Pharmacy", path: "/pharmacy", icon: React.createElement(Pill, { size: 18 }), moduleId: "pharmacy", roles: ["Super Administrator", "Hospital Administrator", "Pharmacist", "Dispensary Staff"], section: "services" },
  { label: "Surgery OT", path: "/surgery", icon: React.createElement(Scissors, { size: 18 }), moduleId: "surgery", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Surgeon", "Nurse"], section: "services" },
  { label: "ICU Telemetry", path: "/icu", icon: React.createElement(Heart, { size: 18 }), moduleId: "icu", roles: ["Super Administrator", "Hospital Administrator", "Doctor", "Nurse", "ICU Specialist"], section: "services" },

  // Finance Workspace
  { label: "Billing & Invoices", path: "/billing", icon: React.createElement(Receipt, { size: 18 }), moduleId: "billing", permission: "billing.read", roles: ["Super Administrator", "Hospital Administrator", "Accountant", "Cashier", "Billing Officer"], section: "finance" },
  { label: "Payments Cashier", path: "/payments", icon: React.createElement(CreditCard, { size: 18 }), moduleId: "payments", roles: ["Super Administrator", "Hospital Administrator", "Accountant", "Cashier"], section: "finance" },
  { label: "Insurance Claims", path: "/insurance", icon: React.createElement(Shield, { size: 18 }), moduleId: "insurance", roles: ["Super Administrator", "Hospital Administrator", "Accountant", "Insurance Officer"], section: "finance" },

  // Operations Workspace
  { label: "Store Inventory", path: "/inventory", icon: React.createElement(Package, { size: 18 }), moduleId: "inventory", roles: ["Super Administrator", "Hospital Administrator", "Store Manager", "Pharmacist"], section: "operations" },
  { label: "HR Staff", path: "/hr", icon: React.createElement(Users2, { size: 18 }), moduleId: "hr", roles: ["Super Administrator", "Hospital Administrator", "HR Manager", "HR Officer"], section: "operations" },
  { label: "Attendance Roster", path: "/attendance", icon: React.createElement(Clock, { size: 18 }), moduleId: "attendance", roles: ["Super Administrator", "Hospital Administrator", "HR Manager", "Department Head"], section: "operations" },

  // System Administration
  { label: "BI Reports", path: "/reports", icon: React.createElement(BarChart3, { size: 18 }), moduleId: "reports", roles: ["Super Administrator", "Hospital Administrator", "Manager", "Accountant"], section: "admin" },
  { label: "Notifications", path: "/notifications", icon: React.createElement(Bell, { size: 18 }), moduleId: "notifications", section: "admin" },
  { label: "Audit Logs", path: "/audit", icon: React.createElement(Shield, { size: 18 }), moduleId: "audit", roles: ["Super Administrator", "Hospital Administrator", "IT Support"], section: "admin" },
  { label: "System Config", path: "/administration", icon: React.createElement(Settings, { size: 18 }), moduleId: "administration", roles: ["Super Administrator", "Hospital Administrator", "IT Support"], section: "admin" },
];

export const sectionLabels: Record<string, string> = {
  core: "OVERVIEW",
  clinical: "CLINICAL WORKSPACE",
  services: "DIAGNOSTICS & SERVICES",
  finance: "FINANCE & CASHIER",
  operations: "OPERATIONS & STORE",
  admin: "ADMINISTRATION",
};
