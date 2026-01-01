import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function OrganizationPage() {
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState(null);

  const cards = [
    {
      id: 1,
      icon: "📝",
      title: "New Registration",
      description: "Register your organization (Hospital, Blood Bank, or NGO) for the first time",
      action: "Register Now",
      path: "/organization-registration",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
    },
    {
      id: 2,
      icon: "📊",
      title: "Check Status",
      description: "Check the registration status of your organization using the organization code",
      action: "Check Status",
      path: "/registration-status",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-700",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
    },
    {
      id: 3,
      icon: "🔐",
      title: "Organization Login",
      description: "Login to your organization dashboard with your credentials",
      action: "Login",
      path: "/login",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      buttonColor: "bg-green-600 hover:bg-green-700",
    },
    {
      id: 4,
      icon: "👑",
      title: "Superadmin Login",
      description: "Access the superadmin dashboard to manage organizations",
      action: "Admin Login",
      path: "/superadmin-login",
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-700",
      buttonColor: "bg-amber-600 hover:bg-amber-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center pt-12 px-4 sm:pt-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent mb-4">
            Organization Portal
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-2">
            Manage your organization registration and access
          </p>
          <p className="text-sm text-gray-400">
            Choose an option below to get started
          </p>
        </div>

        {/* Cards Grid */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="group cursor-pointer"
                  onClick={() => setSelectedCard(card.id)}
                  onMouseLeave={() => setSelectedCard(null)}
                >
                  <div
                    className={`relative h-full bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border ${card.borderColor} ${
                      selectedCard === card.id ? "ring-2 ring-offset-2" : ""
                    }`}
                    style={{
                      ringColor: selectedCard === card.id ? `rgba(var(--color-ring), 0.5)` : "transparent",
                    }}
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                    {/* Content */}
                    <div className={`relative p-8 sm:p-10 h-full flex flex-col ${card.bgColor}`}>
                      {/* Icon */}
                      <div className="text-5xl sm:text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                        {card.icon}
                      </div>

                      {/* Title */}
                      <h2 className={`text-2xl sm:text-3xl font-bold ${card.textColor} mb-3 group-hover:text-opacity-80 transition-colors`}>
                        {card.title}
                      </h2>

                      {/* Description */}
                      <p className="text-gray-600 text-sm sm:text-base mb-6 flex-1 leading-relaxed">
                        {card.description}
                      </p>

                      {/* Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(card.path);
                        }}
                        className={`${card.buttonColor} text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform group-hover:scale-105 inline-block w-full sm:w-auto`}
                      >
                        {card.action} →
                      </button>
                    </div>

                    {/* Hover Border Animation */}
                    <div className={`absolute inset-0 border-2 rounded-2xl bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Info Section */}
        <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 border-t border-gray-700">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Column 1 */}
              <div>
                <h3 className="text-white font-semibold text-lg mb-3 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3 text-sm">
                    1
                  </span>
                  New Organization?
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Start by registering your organization with basic details, license information, and admin credentials. You'll receive an organization code immediately.
                </p>
              </div>

              {/* Column 2 */}
              <div>
                <h3 className="text-white font-semibold text-lg mb-3 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mr-3 text-sm">
                    2
                  </span>
                  Check Status
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Use your organization code to check if your registration has been approved by the superadmin. This typically takes 24-48 hours.
                </p>
              </div>

              {/* Column 3 */}
              <div>
                <h3 className="text-white font-semibold text-lg mb-3 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mr-3 text-sm">
                    3
                  </span>
                  Login & Access
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Once approved, login with your organization code and admin credentials to access your organization dashboard.
                </p>
              </div>
            </div>

            {/* Additional Info Box */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-2">💡 Quick Tips</h4>
                <ul className="text-gray-400 text-sm space-y-2">
                  <li>• Save your organization code in a safe place - you'll need it to check status and login</li>
                  <li>• Ensure all information provided during registration is accurate</li>
                  <li>• For support, contact the superadmin team</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
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
