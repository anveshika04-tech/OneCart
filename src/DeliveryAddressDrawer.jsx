import React, { useState } from "react";

function maskPhone(phone) {
  if (!phone || phone.length < 5) return phone;
  return phone.slice(0, 2) + "*****" + phone.slice(-3);
}

export default function DeliveryAddressDrawer({
  open,
  onClose,
  addresses = [],
  onConfirm,
}) {
  const [selectedId, setSelectedId] = useState(addresses[0]?.id || null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    pincode: "",
    group: false,
  });

  const handleAddNew = () => {
    setShowForm(true);
    setForm({
      name: "",
      phone: "",
      street: "",
      city: "",
      pincode: "",
      group: false,
    });
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // In real app, save to backend or parent state
    if (onConfirm) onConfirm({ ...form, id: Date.now() });
    setShowForm(false);
    onClose();
  };

  const handleConfirm = () => {
    const selected =
      showForm && form.name
        ? form
        : addresses.find((a) => a.id === selectedId);
    if (onConfirm) onConfirm(selected);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-40">
      {/* Drawer */}
      <div className="w-full max-w-lg bg-white rounded-t-2xl shadow-xl p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Delivery Address</h2>
          <button
            className="text-gray-400 hover:text-red-500 text-2xl font-bold"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {/* Address List */}
        {!showForm && (
          <div>
            <div className="mb-2 text-sm text-gray-600">Select a saved address:</div>
            <div className="space-y-3">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                    selectedId === addr.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedId === addr.id}
                    onChange={() => setSelectedId(addr.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{addr.name}</div>
                    <div className="text-xs text-gray-500">
                      {maskPhone(addr.phone)}
                    </div>
                    <div className="text-sm">
                      {addr.street}, {addr.city} - {addr.pincode}
                    </div>
                    {addr.group && (
                      <div className="text-xs text-green-600 mt-1">
                        <span role="img" aria-label="group">
                          👥
                        </span>{" "}
                        Used for group delivery
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <button
              className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded"
              onClick={handleAddNew}
            >
              + Add New Address
            </button>
          </div>
        )}
        {/* Add New Address Form */}
        {showForm && (
          <form className="space-y-3 mt-2" onSubmit={handleFormSubmit}>
            <input
              required
              name="name"
              placeholder="Full Name"
              className="input w-full border p-2 rounded"
              value={form.name}
              onChange={handleFormChange}
            />
            <input
              required
              name="phone"
              placeholder="Contact Number"
              className="input w-full border p-2 rounded"
              value={form.phone}
              onChange={handleFormChange}
            />
            <input
              required
              name="street"
              placeholder="Street / Flat / Building"
              className="input w-full border p-2 rounded"
              value={form.street}
              onChange={handleFormChange}
            />
            <input
              required
              name="city"
              placeholder="City"
              className="input w-full border p-2 rounded"
              value={form.city}
              onChange={handleFormChange}
            />
            <input
              required
              name="pincode"
              placeholder="Pincode"
              className="input w-full border p-2 rounded"
              value={form.pincode}
              onChange={handleFormChange}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="group"
                checked={form.group}
                onChange={handleFormChange}
                id="group"
              />
              <label htmlFor="group" className="text-sm">
                Use this address for the entire group
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded font-semibold"
              >
                Save Address
              </button>
              <button
                type="button"
                className="text-gray-500 underline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {/* Confirm Button */}
        <button
          className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded"
          onClick={handleConfirm}
        >
          Confirm Address & Close
        </button>
      </div>
      {/* Slide-up animation */}
      <style>{`
        .animate-slide-up {
          animation: slideUpDrawer 0.3s cubic-bezier(.4,2,.6,1) both;
        }
        @keyframes slideUpDrawer {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
} 