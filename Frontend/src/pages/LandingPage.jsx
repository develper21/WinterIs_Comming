import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    {
      icon: "🏥",
      title: "Hospitals",
      description: "Request blood units and manage patient requirements",
    },
    {
      icon: "🅱️",
      title: "Blood Banks",
      description: "Track inventory and manage blood stock distribution",
    },
    {
      icon: "❤️",
      title: "NGOs",
      description: "Organize donation camps and manage donor registries",
    },
    {
      icon: "🩸",
      title: "Donors",
      description: "Track donations and manage health records securely",
    },
  ];

  const stats = [
    { number: "1000+", label: "Organizations" },
    { number: "50K+", label: "Active Donors" },
    { number: "10M+", label: "Units Distributed" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation Header */}
        <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🩸</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
              BloodLink
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/login")}
              className="text-gray-300 hover:text-white transition-colors px-4 py-2"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/organization")}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-red-500/50"
            >
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-red-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                Connect Lives Through
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Blood Donation
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">
              A comprehensive platform connecting hospitals, blood banks, NGOs, and donors
              to create a seamless blood donation and distribution network. Save lives with
              every donation.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => navigate("/organization")}
                className="inline-block bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/50 transform hover:scale-105"
              >
                🚀 Start Your Journey
              </button>
              <button
                onClick={() => navigate("/donor-registration")}
                className="inline-block bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105"
              >
                🩸 Register as Donor
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 py-8 border-y border-gray-700">
              {stats.map((stat, index) => (
                <div key={index} className="py-4">
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-sm sm:text-base text-gray-400 mt-2">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                Empower Your Organization
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-gray-700 hover:border-red-500 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20 cursor-pointer"
                >
                  {/* Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative z-10">
                    <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      {feature.description}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-red-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Learn More
                      <span className="transform group-hover:translate-x-2 transition-transform duration-300">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>

            <div className="space-y-8">
              {[
                {
                  step: "01",
                  title: "Register Your Organization",
                  description: "Sign up your hospital, blood bank, or NGO on our platform",
                },
                {
                  step: "02",
                  title: "Get Verified",
                  description: "Our team verifies your organization details and credentials",
                },
                {
                  step: "03",
                  title: "Access Dashboard",
                  description: "Login to your dashboard and manage your operations",
                },
                {
                  step: "04",
                  title: "Connect & Collaborate",
                  description: "Connect with other organizations and manage blood supply",
                },
              ].map((item, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 text-white font-bold text-lg">
                      {item.step}
                    </div>
                  </div>
                  <div className="pt-1">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-red-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                Ready to Make a Difference?
              </span>
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              Join thousands of organizations working together to save lives. Start your registration today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/organization")}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/50 transform hover:scale-105"
              >
                Register Now
              </button>
              <button
                onClick={() => navigate("/donor-registration")}
                className="border-2 border-orange-500 text-orange-400 hover:bg-orange-500/10 px-8 py-3 rounded-lg font-bold transition-all duration-300"
              >
                Donate Blood
              </button>
              <button
                onClick={() => navigate("/login")}
                className="border-2 border-red-500 text-red-400 hover:bg-red-500/10 px-8 py-3 rounded-lg font-bold transition-all duration-300"
              >
                Login
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-700 px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h4 className="font-bold text-white mb-4">Platform</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <a href="#" className="hover:text-red-400 transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-red-400 transition-colors">
                      Pricing
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Organization</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <a href="#" className="hover:text-red-400 transition-colors">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-red-400 transition-colors">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <a href="#" className="hover:text-red-400 transition-colors">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-red-400 transition-colors">
                      Terms
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Support</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <a href="#" className="hover:text-red-400 transition-colors">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-red-400 transition-colors">
                      Documentation
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
              <p>© 2024 BloodLink. All rights reserved. Saving lives, one donation at a time.</p>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
