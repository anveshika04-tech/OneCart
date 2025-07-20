import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import DeliveryAddressDrawer from './DeliveryAddressDrawer';
import axios from "axios";

export default function CheckoutSuccess() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get data passed from checkout page
  const { cart, contributors, subtotal, tax, delivery, total, perPerson, address: initialAddress, giftNote } = location.state || {};

  // Delivery address drawer integration
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addresses, setAddresses] = useState(initialAddress ? [initialAddress] : []); // Could fetch from backend
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Payment mode and success state
  const [paymentMode, setPaymentMode] = useState("split"); // "split", "individual", "one"
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    // Replace roomId with the actual room ID for the group
    if (roomId) {
      axios.get(`${API_URL}/api/address/${roomId}`)
        .then(res => {
          if (res.data) setSelectedAddress(res.data);
        });
    }
  }, [roomId]);

  const handleConfirmAddress = (address) => {
    setSelectedAddress(address);
    // Optionally, save to backend here
    if (!addresses.find(a => a.id === address.id)) {
      setAddresses(prev => [...prev, address]);
    }
  };

  if (!cart || !contributors) {
    // If no data, redirect to home or show error
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-2xl font-bold mb-4">No order history found</h2>
          <button
            className="bg-pink-500 text-white px-4 py-2 rounded"
            onClick={() => navigate("/home")}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4" style={{ background: '#F3E6FA' }}>
      <div className="w-full flex justify-center mb-6">
        <span className="text-4xl font-bold" style={{ color: '#222A68' }}>
          OneCart
        </span>
      </div>
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full flex flex-col items-center">
        <CheckCircleIcon className="h-16 w-16 text-blue-500 mb-4" />
        <h1 className="text-3xl font-bold text-blue-700 mb-2">Order History</h1>
        <p className="text-lg text-gray-700 mb-6">Here is your group's past order summary.</p>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Summary */}
          <div className="bg-purple-50 rounded-lg p-4 shadow">
            <h2 className="font-bold text-lg mb-2 text-purple-700">Order Summary</h2>
            <ul className="mb-2">
              {cart.map((item, idx) => (
                <li key={idx} className="flex justify-between items-center mb-1">
                  <span>
                    <span className="font-semibold">{item.name}</span> x{item.quantity}
                    <span className="text-xs text-gray-500 ml-2">Added by: {item.addedBy}</span>
                  </span>
                  <span className="font-semibold text-gray-700">₹{(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t pt-2 text-sm">
              <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax (10%):</span><span>₹{tax.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Delivery Fee:</span><span>₹{delivery.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-purple-700"><span>Total:</span><span>₹{total.toFixed(2)}</span></div>
            </div>
            <div className="mt-2 bg-blue-50 rounded p-2 text-blue-700 text-center font-semibold">
              Your share: <span className="text-lg">₹{perPerson.toFixed(2)}</span>
            </div>
          </div>
          {/* Contributors & Delivery */}
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 rounded-lg p-4 shadow">
              <h2 className="font-bold text-lg mb-2 text-blue-700">Contributors</h2>
              <div className="flex flex-wrap gap-2">
                {contributors.map((c, i) => (
                  <span key={i} className="bg-white px-3 py-1 rounded-full shadow text-sm font-semibold text-blue-700">{c}</span>
                ))}
              </div>
            </div>
            {/* Delivery Address Drawer Button */}
            <div className="bg-white rounded-lg p-4 shadow flex flex-col gap-2">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded font-semibold mb-2"
                onClick={() => setDrawerOpen(true)}
              >
                {selectedAddress ? 'Change Delivery Address' : 'Select Delivery Address'}
              </button>
              <DeliveryAddressDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                addresses={addresses}
                onConfirm={handleConfirmAddress}
              />
              {selectedAddress && (
                <div className="mt-2 text-sm bg-blue-50 rounded p-2">
                  <div className="font-bold">Selected Address:</div>
                  <div>{selectedAddress.name}, {selectedAddress.street}, {selectedAddress.city} - {selectedAddress.pincode}</div>
                  <div className="text-xs text-gray-500">{selectedAddress.phone && (selectedAddress.phone.slice(0,2) + '*****' + selectedAddress.phone.slice(-3))}</div>
                  {selectedAddress.group && (
                    <div className="text-xs text-green-600 mt-1">
                      <span role="img" aria-label="group">👥</span> Used for group delivery
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Privacy-Conscious Delivery Address Section (legacy, can remove if not needed) */}
            <div className="bg-green-50 rounded-lg p-4 shadow">
              <h2 className="font-bold text-lg mb-2 text-green-700 flex items-center gap-2">Delivery Address <span role="img" aria-label="privacy">🔒</span></h2>
              <div className="text-xs text-green-700 mb-2">Your address is only visible to group members with access.</div>
              {selectedAddress ? (
                <div className="space-y-1">
                  <div><span className="font-semibold">Full Name:</span> {selectedAddress.fullName}</div>
                  <div><span className="font-semibold">Pincode:</span> {selectedAddress.pincode}</div>
                  {selectedAddress.addressLine1 && <div><span className="font-semibold">Address Line 1:</span> {selectedAddress.addressLine1}</div>}
                  <div><span className="font-semibold">City:</span> {selectedAddress.city}</div>
                  {selectedAddress.state && <div><span className="font-semibold">State:</span> {selectedAddress.state}</div>}
                  {selectedAddress.phone && (
                    <div><span className="font-semibold">Contact Number:</span> {selectedAddress.phone.slice(0,2) + '*****' + selectedAddress.phone.slice(-3)}</div>
                  )}
                  {selectedAddress.nickname && <div><span className="font-semibold">Address Nickname:</span> {selectedAddress.nickname}</div>}
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={!!selectedAddress.shareWithGroup} readOnly />
                    <span className="text-sm">Share this address with group for group delivery</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">We respect your privacy. This info won’t be shared without consent.</div>
                </div>
              ) : (
                <div className="text-gray-500 italic">No address provided. <span className="text-xs">(Mock Address for Testing)</span></div>
              )}
            </div>
            {giftNote && (
              <div className="bg-pink-50 rounded-lg p-4 shadow">
                <h2 className="font-bold text-lg mb-2 text-pink-700">Gift Note</h2>
                <div className="text-gray-700">{giftNote}</div>
              </div>
            )}
          </div>
        </div>
        {/* Payment Mode Selector */}
        <div className="bg-white rounded-lg p-4 shadow mt-6 w-full max-w-lg">
          <h2 className="font-bold text-lg mb-2">Choose Payment Mode</h2>
          <div className="flex gap-4 mb-4">
            <label>
              <input
                type="radio"
                name="paymentMode"
                value="individual"
                checked={paymentMode === "individual"}
                onChange={() => setPaymentMode("individual")}
              />
              <span className="ml-2">💳 Pay Individually</span>
            </label>
            <label>
              <input
                type="radio"
                name="paymentMode"
                value="split"
                checked={paymentMode === "split"}
                onChange={() => setPaymentMode("split")}
              />
              <span className="ml-2">👥 Split Equally</span>
            </label>
            <label>
              <input
                type="radio"
                name="paymentMode"
                value="one"
                checked={paymentMode === "one"}
                onChange={() => setPaymentMode("one")}
              />
              <span className="ml-2">💰 One Pays for All</span>
            </label>
          </div>

          {/* Payment UI */}
          {paymentMode === "split" && (
            <div className="mt-2">
              <div>Total: <span className="font-bold">₹{total.toFixed(2)}</span></div>
              <div>Members: <span className="font-bold">{contributors.length}</span></div>
              <div>Amount per member: <span className="font-bold">₹{perPerson.toFixed(2)}</span></div>
              <button
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => setPaymentSuccess(true)}
              >
                Send Payment Request
              </button>
            </div>
          )}
          {paymentMode === "individual" && (
            <div className="mt-2 text-gray-700">
              Each member pays for their own items. No group payment needed.
            </div>
          )}
          {paymentMode === "one" && !paymentSuccess && (
            <div className="mt-2">
              <div className="mb-2">Pay for the group:</div>
              <div className="flex flex-col gap-2">
                <input
                  className="input border p-2 rounded"
                  placeholder="Enter UPI ID (mock)"
                  defaultValue="user@upi"
                  disabled
                />
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded"
                  onClick={() => setPaymentSuccess(true)}
                >
                  Pay Now
                </button>
              </div>
            </div>
          )}
          {paymentSuccess && (
            <div className="mt-4 bg-green-100 text-green-800 p-4 rounded text-center font-bold">
              ✅ Payment of ₹{total.toFixed(2)} successful by {user?.name || "User"}
            </div>
          )}
        </div>
        <button
          className="mt-8 bg-pink-500 text-white px-6 py-3 rounded-full font-bold shadow hover:bg-pink-600"
          onClick={() => navigate("/home")}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
} 