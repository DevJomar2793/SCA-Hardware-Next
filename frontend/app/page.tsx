import React from 'react';

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-slate-500">Total Hardware</p>
          <p className="text-3xl font-bold text-slate-800">1,284</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-slate-500">Active Assignments</p>
          <p className="text-3xl font-bold text-slate-800">856</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-slate-500">Pending Requests</p>
          <p className="text-3xl font-bold text-slate-800">24</p>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Recent Activity</h2>
        <p className="text-slate-600">Welcome to the CKT Hardware Inventory Dashboard. Use the navigation on the left to manage your assets.</p>
      </div>
    </div>
  );
}
