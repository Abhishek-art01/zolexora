// Append to existing web-seller api.ts
import { api } from "./api";

export const shippingApi = {
  // Pickup locations
  getPickupLocations: () => api.get("/shipping/pickup-locations").then(r => r.data),
  createPickupLocation: (d: any) => api.post("/shipping/pickup-locations", d).then(r => r.data),
  updatePickupLocation: (id: string, d: any) => api.put(`/shipping/pickup-locations/${id}`, d).then(r => r.data),
  deletePickupLocation: (id: string) => api.delete(`/shipping/pickup-locations/${id}`).then(r => r.data),

  // Shipment workflows
  readyToShip: (orderId: string, d: any) => api.post(`/shipping/orders/${orderId}/ready-to-ship`, d).then(r => r.data),
  discoverOptions: (orderId: string, d: any) => api.post(`/shipping/orders/${orderId}/discover-options`, d).then(r => r.data),
  getOptions: (orderId: string) => api.get(`/shipping/orders/${orderId}/options`).then(r => r.data),
  manualBook: (orderId: string, d: any) => api.post(`/shipping/orders/${orderId}/manual-book`, d).then(r => r.data),

  // Shipment operations
  getShipment: (id: string) => api.get(`/shipping/shipments/${id}`).then(r => r.data),
  requestPickup: (id: string) => api.post(`/shipping/shipments/${id}/request-pickup`).then(r => r.data),
  cancelShipment: (id: string) => api.post(`/shipping/shipments/${id}/cancel`).then(r => r.data),
  retryBooking: (id: string) => api.post(`/shipping/shipments/${id}/retry-booking`).then(r => r.data),
  syncTracking: (id: string) => api.post(`/shipping/sync/${id}`).then(r => r.data),
  trackByAwb: (awb: string) => api.get(`/shipping/track/${awb}`).then(r => r.data),

  // Admin
  adminShipments: () => api.get("/shipping/admin/shipments").then(r => r.data),
  adminAttentionRequired: () => api.get("/shipping/admin/shipments/attention-required").then(r => r.data),
  adminShippingStats: () => api.get("/shipping/admin/shipments/stats").then(r => r.data),
};
