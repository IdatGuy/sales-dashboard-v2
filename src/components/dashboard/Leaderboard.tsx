import React from "react";
import { Sale } from "../../types";
import { mockUsers, mockSales } from "../../data/mockData";

// Helper to get user name by id
const getUserName = (userId: string) => {
  const user = mockUsers.find((u) => u.id === userId);
  return user ? user.name : "Unknown";
};

// Points calculation rules
function calculatePoints(sale: Sale) {
  return (
    Math.floor(sale.salesAmount / 100) * 1 +
    sale.accessorySales * 2 +
    sale.homeConnects * 3 +
    sale.cleanings * 1 +
    sale.repairs * 0.5
  );
}

// Aggregate points by user for the current month
const getLeaderboardData = (month: string) => {
  // For demo, randomly assign sales to users for mockup
  const salesWithUser = mockSales.map((sale, idx) => ({
    ...sale,
    userId: mockUsers[idx % mockUsers.length].id,
  }));
  const filtered = salesWithUser.filter((sale) => sale.date.startsWith(month));
  const leaderboard: { [userId: string]: number } = {};
  filtered.forEach((sale) => {
    leaderboard[sale.userId] =
      (leaderboard[sale.userId] || 0) + calculatePoints(sale);
  });
  return Object.entries(leaderboard)
    .map(([userId, totalPoints]) => ({ userId, totalPoints }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
};

interface LeaderboardProps {
  month: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ month }) => {
  const data = getLeaderboardData(month);
  return (
    <div className="p-4">
      <h5 className="text-lg font-semibold mb-4">
        Leaderboard (Points System)
      </h5>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-1">Rank</th>
            <th className="text-left py-1">Name</th>
            <th className="text-right py-1">Points</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, idx) => (
            <tr key={entry.userId} className={idx === 0 ? "font-bold" : ""}>
              <td className="py-1">{idx + 1}</td>
              <td className="py-1">{getUserName(entry.userId)}</td>
              <td className="py-1 text-right">{entry.totalPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 text-xs text-gray-500">
        <div>
          Points: 1pt per $100 sales, 2pt/accessory, 3pt/home connect,
          1pt/cleaning, 0.5pt/repair
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
