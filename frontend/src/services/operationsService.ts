import api from "../lib/api";

export interface InventoryItemData {
  itemId: number;
  itemCode: string;
  itemName: string;
  category: string;
  quantityOnHand: number;
  unitOfMeasure: string;
  reorderThreshold: number;
  unitCost: number;
  status: string;
}

export interface AttendanceRecordData {
  attendanceId: number;
  employeeId: number;
  employeeName: string;
  departmentName: string;
  attendanceDate: string;
  checkInTime: string;
  checkOutTime: string;
  workHours: number;
  overtimeHours: number;
  status: string;
}

export const operationsService = {
  getInventory: async (search?: string, category?: string): Promise<InventoryItemData[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (category) params.category = category;

    const res = await api.get("/operations/inventory/items", { params });
    return res.data?.data ?? [];
  },

  createInventoryItem: async (data: { itemName: string; category: string; quantityOnHand: number; unitCost: number }): Promise<InventoryItemData> => {
    const res = await api.post("/operations/inventory/item", data);
    return res.data?.data;
  },

  getAttendance: async (search?: string, date?: string): Promise<AttendanceRecordData[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (date) params.date = date;

    const res = await api.get("/operations/attendance", { params });
    return res.data?.data ?? [];
  },
};
