import React from "react";
// import { Sale } from "../../types";
// Mock data imports removed for portfolio build

// Placeholder component for portfolio - full implementation would connect to real data
interface LeaderboardProps {}

const Leaderboard: React.FC<LeaderboardProps> = () => {
  // Placeholder data for demonstration
  const placeholderData = [
    { userId: "1", name: "John Employee", totalPoints: 125 },
    { userId: "2", name: "Mary Manager", totalPoints: 98 },
    { userId: "3", name: "Bob Sales", totalPoints: 87 },
  ];

  return (
    <div className="p-4">
      <h5 className="text-lg font-semibold mb-4">
        Leaderboard (Points System)
      </h5>
      <div className="space-y-2">
        {placeholderData.map((user, idx) => (
          <div
            key={user.userId}
            className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
          >
            <div className="flex items-center">
              <span className="w-6 h-6 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center mr-3">
                {idx + 1}
              </span>
              <span className="text-sm font-medium">{user.name}</span>
            </div>
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
              {user.totalPoints} pts
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Demo data - Full implementation would use real sales data
      </div>
    </div>
  );
};

export default Leaderboard;
