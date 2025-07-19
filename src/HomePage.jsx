import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QrCodeIcon, LinkIcon, UserGroupIcon, GiftIcon, UsersIcon, GlobeAltIcon, SparklesIcon, PlusCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import AuthModal from './AuthModal';
import Navbar from './Navbar';

const themes = [
  {
    name: "Festive",
    icon: <GiftIcon className="h-10 w-10 text-pink-500 card-icon" />,
    color: "bg-pink-300",
    description: "Group deals, gifts & festive combos.",
  },
  {
    name: "Family",
    icon: <UserGroupIcon className="h-10 w-10 text-blue-500 card-icon" />,
    color: "bg-blue-300",
    description: "Family savings, shared cart & more.",
  
  },
  {
    name: "Friends",
    icon: <UsersIcon className="h-10 w-10 text-purple-500 card-icon" />,
    color: "bg-purple-300",
    description: "Plan group buys, split the fun.",
    
  },
  {
    name: "Travel",
    icon: <GlobeAltIcon className="h-10 w-10 text-teal-500 card-icon" />,
    color: "",
    description: "Travel essentials, group bookings.",
   
  },
];

function generateRoomId(theme) {
  // Use the theme name as the fixed room ID
  return theme.toLowerCase();
}

const HomePage = () => {
  const [qrRoom, setQrRoom] = useState(null);
  const [copied, setCopied] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', category: 'Custom', members: '', accessType: 'open' });
  const [createdGroup, setCreatedGroup] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    fetch('/api/groups')
      .then(res => res.json())
      .then(data => {
        // Show groups where user is creator or member
        const filtered = data.filter(g => g.creator === user.name || (Array.isArray(g.members) && g.members.includes(user.name)));
        setUserGroups(filtered);
      });
  }, [createdGroup, showCreateGroup]);

  const handleJoin = (roomId) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      setShowAuth(true);
      setPendingRoomId(roomId);
    } else {
      navigate(`/room/${roomId}`);
      setToastMsg(`You have joined the group: ${userGroups.find(g => g.id === roomId)?.name || roomId}`);
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  const handleCopy = (roomId) => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(roomId);
    setTimeout(() => setCopied(""), 1500);
  };

  const handleAuthSuccess = (user) => {
    setShowAuth(false);
    if (pendingRoomId) {
      navigate(`/room/${pendingRoomId}`);
      setPendingRoomId(null);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center relative overflow-x-hidden">
      {/* Background Accent */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg width="100%" height="100%" className="opacity-10" style={{position:'absolute',top:0,left:0}}>
          <circle cx="20%" cy="20%" r="120" fill="#a78bfa" />
          <circle cx="80%" cy="60%" r="180" fill="#f472b6" />
          <rect x="60%" y="10%" width="200" height="80" rx="40" fill="#fbbf24" />
        </svg>
      </div>
      <Navbar />
      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center mb-8 mt-2 pt-24">
        <img src="/assets/c118343fa67de1a1f8058e95fb06ad24.jpg" alt="Mascot" className="w-24 h-24 mb-2 animate-bounce rounded-full shadow-lg" />
        <h1 className="text-4xl font-extrabold mb-2 flex items-center gap-2 tracking-tight drop-shadow-lg" style={{ color: '#FFA200' }}>
          ✨ Shop Together, Save Together!
        </h1>
        <p className="text-lg text-gray-700 mb-4 leading-tight font-medium"style={{ color: '#654597' }}>Choose a squad or make your own—unlock group magic.</p>
      </div>
      {/* Create Group FAB/Sticky Button */}
      <button
        className="fixed md:static bottom-6 right-6 md:mb-6 flex items-center gap-2 px-5 py-3 bg-[#654597] text-white font-bold rounded-full shadow-lg hover:bg-[#4e3577] text-lg z-50 animate-pulse md:animate-none md:shadow md:hover:scale-105 transition-transform focus:outline-none focus:ring-4 focus:ring-[#7c3aed]/30"
        style={{minWidth:'56px',minHeight:'56px'}}
        onClick={() => setShowCreateGroup(true)}
        aria-label="Create Group"
      >
        <PlusCircleIcon className="h-7 w-7" />
        <span className="hidden md:inline">Create Group</span>
      </button>
      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold"
              onClick={() => { setShowCreateGroup(false); setCreatedGroup(null); }}
            >×</button>
            <h2 className="text-2xl font-bold mb-4 text-purple-700">Create a New Group</h2>
            {!createdGroup ? (
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  const user = JSON.parse(localStorage.getItem('user'));
                  if (!user) {
                    alert('Please log in to create a group.');
                    return;
                  }
                  const payload = {
                    name: groupForm.name,
                    category: 'Custom',
                    creator: user.name,
                    members: groupForm.members,
                    accessType: groupForm.accessType
                  };
                  try {
                    const res = await fetch('/api/groups', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    });
                    if (!res.ok) throw new Error('Failed to create group');
                    const data = await res.json();
                    setCreatedGroup(data);
                  } catch (err) {
                    alert('Error creating group: ' + err.message);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block font-semibold mb-1">Group Name</label>
                  <input
                    required
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g. Family Fest, Hostel Room 6"
                    value={groupForm.name}
                    onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                {/* Category is now fixed to Custom */}
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <input
                    className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                    value="Custom"
                    disabled
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Members (optional, comma separated)</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g. alice, bob, charlie"
                    value={groupForm.members}
                    onChange={e => setGroupForm(f => ({ ...f, members: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Access Type</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={groupForm.accessType}
                    onChange={e => setGroupForm(f => ({ ...f, accessType: e.target.value }))}
                  >
                    <option value="open">Open (anyone can join)</option>
                    <option value="approval">Approval Needed</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#654597] text-white font-bold py-2 rounded-full shadow hover:bg-[#4e3577] mt-2"
                >
                  Create Group
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-green-700 font-bold text-lg mb-2">Group Created!</div>
                <div className="mb-2 text-center">
                  <div className="font-semibold">Invite Link:</div>
                  <div className="bg-gray-100 rounded px-2 py-1 text-sm break-all mb-2">{createdGroup.inviteLink}</div>
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded mb-2"
                    onClick={() => { navigator.clipboard.writeText(createdGroup.inviteLink); }}
                  >Copy Link</button>
                </div>
                <div className="mb-2 flex flex-col items-center">
                  <div className="font-semibold mb-1">QR Code:</div>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(createdGroup.inviteLink)}`}
                    alt="QR Code"
                    className="mb-2"
                  />
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(createdGroup.inviteLink)}`}
                    download={`group-qr-${createdGroup.id}.png`}
                    className="bg-green-500 text-white px-3 py-1 rounded mb-2 text-center"
                  >Download QR</a>
                </div>
                <div className="flex gap-2 mb-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent('Join my group on OneCart! ' + createdGroup.inviteLink)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >Share on WhatsApp</a>
                  <a
                    href={`mailto:?subject=Join my group on OneCart&body=${encodeURIComponent('Join my group on OneCart! ' + createdGroup.inviteLink)}`}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >Invite via Email</a>
                </div>
                <button
                  className="mt-2 px-4 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => { setShowCreateGroup(false); setCreatedGroup(null); }}
                >Close</button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Suggested For You heading above static group cards */}
      <div className="w-full max-w-6xl mt-8 mb-2 relative z-10">
        <h2 className="text-2xl font-bold mb-4 text-[#FFA200] flex items-center gap-2">
          <UserGroupIcon className="h-7 w-7" /> Suggested For You
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        {themes.map((theme) => {
          const roomId = generateRoomId(theme.name);
          return (
            <div
              key={theme.name}
              className={`rounded-xl shadow-xl ${theme.name === 'Travel' ? '' : theme.color} p-6 flex flex-col items-center relative card-hover group transition-transform duration-200 ease-in-out`}
              style={theme.name === 'Travel' ? { background: '#c1b2e6' } : {}}
              tabIndex={0}
            >
              <div className="mb-2 flex flex-col items-center">
                <span className="icon-bounce inline-block">{theme.icon}</span>
                <div className="flex gap-1 mt-1 text-lg">
                  {theme.avatars && theme.avatars.map((a, i) => (
                    <span key={i} className="avatar-preview">{a}</span>
                  ))}
                </div>
              </div>
              <h2 className="text-2xl font-extrabold mb-1 tracking-tight" style={{ color: '#222A68' }}>{theme.name}</h2>
              <p className="text-white mb-4 text-center leading-snug text-base font-medium">{theme.description}</p>
              <div className="flex gap-3 mt-auto">
                <button
                  onClick={() => handleJoin(roomId)}
                  className="text-black font-semibold flex items-center gap-2 bg-transparent shadow-none px-0 py-0 hover:underline focus:outline-none"
                  style={{ boxShadow: 'none', background: 'none' }}
                >
                  <UserGroupIcon className="h-5 w-5" />
                  Let’s Go!
                </button>
                <button
                  onClick={() => setQrRoom(roomId)}
                  className="bg-transparent shadow-none px-0 py-0 flex items-center group/qr qr-animate"
                  style={{ boxShadow: 'none', background: 'none' }}
                  title="Scan with mobile to join group instantly"
                >
                  <QrCodeIcon className="h-8 w-8 text-white" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {/* User's Groups List */}
      {userGroups.filter(g => g.category === 'Custom').length > 0 && (
        <div className="w-full max-w-3xl mt-10 relative z-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: '#FFA200' }}><UserGroupIcon className="h-7 w-7" /> Your Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userGroups.filter(group => group.category === 'Custom').map(group => (
              <div key={group.id} className="bg-white/90 rounded-xl shadow p-5 flex flex-col gap-2 border border-[#e9d5ff] backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg" style={{ color: '#222A68' }}>{group.name}</span>
                  <span className="ml-2 px-2 py-0.5 rounded bg-[#ede9fe] text-[#7c3aed] text-xs font-semibold">{group.category}</span>
                  {/* Bin button for custom group creator */}
                  {group.category === 'Custom' && group.creator === JSON.parse(localStorage.getItem('user'))?.name && (
                    <button
                      className="ml-2 p-1 rounded-full hover:bg-red-100"
                      title="Delete Group"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this group? This cannot be undone.')) {
                          try {
                            const res = await fetch(`/api/groups/${group.id}`, { method: 'DELETE' });
                            if (!res.ok) throw new Error('Failed to delete group');
                            setUserGroups(prev => prev.filter(g => g.id !== group.id));
                          } catch (err) {
                            alert('Failed to delete group.');
                          }
                        }
                      }}
                      aria-label="Delete Group"
                    >
                      <TrashIcon className="h-5 w-5 text-red-500" />
                    </button>
                  )}
                </div>
                <div className="text-gray-500 text-sm mb-2">Created by: {group.creator}</div>
                <div className="flex gap-2 mt-auto">
                  <button
                    className="bg-[#574AE2] text-white px-4 py-1 rounded-full font-bold shadow hover:bg-[#3d349e] focus:outline-none focus:ring-2 focus:ring-[#574AE2]/30"
                    onClick={() => handleJoin(group.id)}
                  >Join/View Group</button>
                  <button
                    className="bg-[#ede9fe] text-[#7c3aed] px-3 py-1 rounded-full font-semibold hover:bg-[#e0e7ff] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30"
                    onClick={() => { navigator.clipboard.writeText(group.inviteLink); }}
                  >Copy Invite Link</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-lg text-gray-600 mb-8 leading-tight">Shop together, chat, and get GenAI-powered suggestions!</p>
      {qrRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex flex-col items-center">
            <div className="mb-2 font-bold text-lg">Scan to Join</div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                `${window.location.origin}/room/${qrRoom}`
              )}`}
              alt="QR Code"
              className="mb-2"
            />
            <button
              onClick={() => setQrRoom(null)}
              className="mt-2 px-4 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showAuth && <AuthModal onAuthSuccess={handleAuthSuccess} />}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#7c3aed] text-white px-6 py-3 rounded-full shadow-lg z-50 text-lg animate-fade-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
};

export default HomePage; 