import React from "react";
import type { Board } from "../livestore/schema.js";

interface BoardCardProps {
  board: Board;
  onClick?: () => void;
}

export const BoardCard: React.FC<BoardCardProps> = ({ board, onClick }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{board.name}</h3>
      <div className="text-sm text-gray-500">
        <p>Created: {formatDate(board.createdAt)}</p>
        <p>Updated: {formatDate(board.updatedAt)}</p>
      </div>
    </div>
  );
};