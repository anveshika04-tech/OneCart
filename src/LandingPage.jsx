import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthModal from './AuthModal';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'join' or null
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [hoveredBtn, setHoveredBtn] = useState("");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep user state in sync with localStorage
  useEffect(() => {
    const syncUser = () => {
      setUser(JSON.parse(localStorage.getItem("user")));
    };
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  const handleJoinGroup = () => {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (!currentUser) {
      setShowAuth(true);
      setPendingAction('join');
    } else {
      navigate("/home");
    }
  };

  const handleLogin = () => {
    setShowAuth(true);
    setPendingAction(null);
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    setUser(JSON.parse(localStorage.getItem("user")));
    if (pendingAction === 'join') {
      navigate("/home");
      setPendingAction(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F3E6FA' }}>
      <header className={`fixed top-0 left-0 w-full flex justify-between items-center px-8 py-4 z-20 transition-colors duration-300`} style={{ background: '#F3E6FA', boxShadow: 'none', borderBottom: 'none' }}>
        <div className="text-4xl font-bold" style={{ color: '#222A68' }}>OneCart</div>
        <div className="flex items-center gap-4">
          <a href="/about" className="text-gray-700 font-semibold hover:text-[#FF9500] transition-colors">About</a>
          {user ? (
            <ProfileDropdown user={user} onLogout={handleLogout} />
          ) : (
            <>
              <button
                className="text-gray-700 font-semibold"
                onClick={handleLogin}
                onMouseEnter={() => setHoveredBtn("header-login")}
                onMouseLeave={() => setHoveredBtn("")}
                style={hoveredBtn === "header-login" ? { background: 'rgba(204, 170, 0, 0.4)', color: '#222A68', borderColor: '#CCAA00' } : {}}
              >
                Login
              </button>
              <button
                className="bg-black text-white px-5 py-2 rounded-full font-semibold shadow"
                onClick={handleJoinGroup}
                onMouseEnter={() => setHoveredBtn("header-join")}
                onMouseLeave={() => setHoveredBtn("")}
                style={hoveredBtn === "header-join" ? { background: 'rgba(204, 170, 0, 0.4)', color: '#222A68', borderColor: '#CCAA00' } : {}}
              >
                Join a Group
              </button>
            </>
          )}
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-28">
        <div className="flex flex-col md:flex-row items-center w-full max-w-4xl mt-8">
          <img
            src="https://thumbs.dreamstime.com/b/girl-shopping-shopping-bags-shopping-girl-shopping-shopping-bags-two-girls-girlfriends-against-background-364101293.jpg"
            alt="Shopping"
            className="w-96 h-64 object-cover rounded-xl mb-6 md:mb-0 md:mr-8"
          />
          <div>
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#222A68' }}>OneCart – Shop Together, Smarter</h1>
            <p className="text-lg text-gray-600 mb-6">
              Create or join a room to shop with AI-powered suggestions & a shared cart.
            </p>
            <div className="flex gap-4">
              <button
                className="bg-black text-white px-6 py-3 rounded-full font-semibold shadow"
                onClick={handleJoinGroup}
                onMouseEnter={() => setHoveredBtn("main-join")}
                onMouseLeave={() => setHoveredBtn("")}
                style={hoveredBtn === "main-join" ? { background: 'rgba(204, 170, 0, 0.4)', color: '#222A68', borderColor: '#CCAA00' } : {}}
              >
                Join a Group
              </button>
              <button
                className="bg-white text-black px-6 py-3 rounded-full font-semibold shadow border border-gray-300"
                onClick={handleLogin}
                onMouseEnter={() => setHoveredBtn("main-login")}
                onMouseLeave={() => setHoveredBtn("")}
                style={hoveredBtn === "main-login" ? { background: 'rgba(204, 170, 0, 0.4)', color: '#222A68', borderColor: '#CCAA00' } : {}}
              >
                Login
              </button>
            </div>
          </div>
        </div>
        {/* Features section */}
        <div className="h-16 md:h-24" /> {/* Spacer for vertical space */}
        <div className="w-full flex justify-center mb-6">
          <h2 className="text-2xl font-bold text-center" style={{ color: '#654597' }}>What makes OneCart smart?</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl">
          <div className="flex-1 rounded-xl p-10 flex flex-col items-center feature-card feature-card-bg">
            <div className="text-pink-400 text-5xl mb-4">💡</div>
            <div className="font-bold text-2xl mb-2">AI Suggestions</div>
            <div className="text-gray-500 text-lg text-center">Get smart product recommendations extracted live from your group chat.</div>
          </div>
          <div className="flex-1 rounded-xl p-10 flex flex-col items-center feature-card feature-card-bg">
            <div className="text-yellow-400 text-5xl mb-4">🛒</div>
            <div className="font-bold text-2xl mb-2">Shared Cart</div>
            <div className="text-gray-500 text-lg text-center">Add, update, and manage products together with your group in real-time.</div>
          </div>
          <div className="flex-1 rounded-xl p-10 flex flex-col items-center feature-card feature-card-bg">
            <div className="text-orange-400 text-5xl mb-4">🎉</div>
            <div className="font-bold text-2xl mb-2">Festive Combos</div>
            <div className="text-gray-500 text-lg text-center">Personalized bundles for festivals & occasions—buy for all, in a tap!</div>
          </div>
        </div>
        {showAuth && <AuthModal onAuthSuccess={handleAuthSuccess} />}
      </main>
      <footer className="w-full py-4 flex justify-center items-center bg-transparent mt-auto">
        <span className="text-lg font-semibold text-[#E63946] flex items-center gap-2">
          Built for Bharat <span role="img" aria-label="heart">❤️</span>
        </span>
      </footer>
    </div>
  );
};

// ProfileDropdown component for user profile and logout dropdown
function ProfileDropdown({ user, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  React.useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e) {
      if (!e.target.closest('.profile-dropdown')) setDropdownOpen(false);
    }
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);
  return (
    <div className="relative profile-dropdown ml-4">
      <button
        className="flex items-center gap-2 focus:outline-none"
        onClick={() => setDropdownOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
      >
        <span className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-pink-700 text-lg font-bold">
          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
        </span>
        <span className="font-semibold text-gray-700 text-base">{user.name}</span>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded shadow-lg z-50 animate-fade-in">
          <button
            onClick={onLogout}
            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-pink-50 rounded"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default LandingPage; 