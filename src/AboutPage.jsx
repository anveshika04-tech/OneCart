import React from "react";
import { motion } from "framer-motion";
import { SparklesIcon, MicrophoneIcon, UserGroupIcon, CreditCardIcon, BellIcon, TruckIcon } from "@heroicons/react/24/outline";
import Navbar from './Navbar';

const features = [
  {
    icon: <UserGroupIcon className="h-10 w-10 text-pink-500" />,
    title: "Group Suggestion Engine",
    desc: "Powered by E5-base-v2 for collaborative shopping.",
    emoji: "🤝"
  },
  {
    icon: <MicrophoneIcon className="h-10 w-10 text-blue-500" />,
    title: "Voice-to-Text & Translation",
    desc: "Seamless Hindi to English chat.",
    emoji: "🎙️"
  },
  {
    icon: <SparklesIcon className="h-10 w-10 text-yellow-400" />,
    title: "AI-curated Checkout Summary",
    desc: "Smart, personalized order insights.",
    emoji: "🧠"
  },
  {
    icon: <TruckIcon className="h-10 w-10 text-green-500" />,
    title: "Smart Delivery Address Capture",
    desc: "Easy, secure, and group-friendly.",
    emoji: "📦"
  },
  {
    icon: <CreditCardIcon className="h-10 w-10 text-purple-500" />,
    title: "Flexible Payment Options",
    desc: "Split, pay together, or individually.",
    emoji: "💳"
  },
  {
    icon: <BellIcon className="h-10 w-10 text-red-500" />,
    title: "AI-Personalized Notifications",
    desc: "Coming soon: GenAI-powered nudges.",
    emoji: "🔔"
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12 pt-24 relative overflow-hidden">
      <Navbar bgColor="black" />
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl md:text-5xl font-extrabold text-white mb-4 text-center"
      >
        OneCart <span style={{ color: '#E2ADF2' }}>Group Shopping</span>
      </motion.h1>
      <div className="mx-auto mb-6 rounded-full bg-black p-4 shadow-lg w-fit">
        <motion.img
          src="/assets/Untitled design (1).png"
          alt="Animated Shopping"
          initial={{ y: 0, rotate: -5, opacity: 1 }}
          animate={{ 
            y: [0, -30, 0, 30, 0], 
            rotate: [-5, 5, -5], 
            opacity: 1 
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            repeatType: "loop", 
            ease: "easeInOut" 
          }}
          className="w-72 h-72 object-contain"
          style={{ zIndex: 1 }}
        />
      </div>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-lg md:text-xl text-gray-200 mb-10 text-center max-w-2xl"
      >
        OneCart is a next-generation group shopping platform powered by Generative AI. We make online shopping more collaborative, inclusive, and personalized for users across India.
      </motion.p>
      <div className="flex flex-col items-center w-full mb-8">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-3xl md:text-4xl font-extrabold mb-2 text-center drop-shadow-lg"
          style={{ color: '#E2ADF2' }}
        >
          Smarter Shopping Starts Here
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="text-lg md:text-xl font-semibold text-white text-center max-w-2xl mb-4"
        >
          Explore the AI-powered features that make your buying experience more trusted, faster, and personal.
        </motion.p>
      </div>
      <div className="flex flex-wrap justify-center gap-8 mb-12">
        {/* Custom Group Suggestion Feature with image */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/assets/Untitled design (2).png"
            alt="Group Suggestion"
            className="w-40 h-40 object-contain mb-4 drop-shadow-lg"
          />
          <div className="text-xl font-bold text-white mb-1">Group Suggestion Engine</div>
          <div className="text-gray-300 text-center max-w-xs">Powered by E5-base-v2 for collaborative shopping.</div>
        </div>
       
        <div className="flex flex-col items-center mb-8">
          <img
            src="/assets/Untitled design (3).png"
            alt="Voice-to-Text & Translation"
            className="w-40 h-40 object-contain mb-4 drop-shadow-lg"
          />
          <div className="text-xl font-bold text-white mb-1">Voice-to-Text & Translation</div>
          <div className="text-gray-300 text-center max-w-xs">Seamless Hindi to English chat.</div>
        </div>
       
        <div className="flex flex-col items-center mb-8">
          <img
            src="/assets/Untitled design (4).png"
            alt="AI-curated Checkout Summary"
            className="w-40 h-40 object-contain mb-4 drop-shadow-lg"
          />
          <div className="text-xl font-bold text-white mb-1">AI-curated Checkout Summary</div>
          <div className="text-gray-300 text-center max-w-xs">Smart, personalized order insights.</div>
        </div>
       
        <div className="flex flex-col items-center mb-8">
          <img
            src="/assets/Untitled design (5).png"
            alt="Smart Delivery Address Capture"
            className="w-40 h-40 object-contain mb-4 drop-shadow-lg"
          />
          <div className="text-xl font-bold text-white mb-1">Smart Delivery Address Capture</div>
          <div className="text-gray-300 text-center max-w-xs">Easy, secure, and group-friendly.</div>
        </div>
      
        <div className="flex flex-col items-center mb-8">
          <img
            src="/assets/Untitled design (6).png"
            alt="Flexible Payment Options"
            className="w-40 h-40 object-contain mb-4 drop-shadow-lg"
          />
          <div className="text-xl font-bold text-white mb-1">Flexible Payment Options</div>
          <div className="text-gray-300 text-center max-w-xs">Split, pay together, or individually.</div>
        </div>
      
        <div className="flex flex-col items-center mb-8">
          <img
            src="/assets/Untitled design (7).png"
            alt="AI-Personalized Notifications"
            className="w-40 h-40 object-contain mb-4 drop-shadow-lg"
          />
          <div className="text-xl font-bold text-white mb-1">AI-Personalized Notifications</div>
          <div className="text-gray-300 text-center max-w-xs">Coming soon: GenAI-powered nudges.</div>
        </div>
        
        {features.filter(f => f.title !== "Group Suggestion Engine" && f.title !== "Voice-to-Text & Translation" && f.title !== "AI-curated Checkout Summary" && f.title !== "Smart Delivery Address Capture" && f.title !== "Flexible Payment Options" && f.title !== "AI-Personalized Notifications").map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.15, duration: 0.6, type: "spring" }}
            className="bg-white/10 border border-white/20 rounded-2xl p-6 w-72 flex flex-col items-center shadow-lg backdrop-blur"
          >
            <div className="mb-2 text-3xl">{f.emoji}</div>
            {f.icon}
            <div className="mt-2 text-xl font-bold text-white">{f.title}</div>
            <div className="text-gray-300 text-center mt-1">{f.desc}</div>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
      >
     
      </motion.div>
    </div>
  );
} 