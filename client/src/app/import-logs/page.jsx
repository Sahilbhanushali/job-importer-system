"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function ImportHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get("/api/import-logs");
        console.log("fetched logs:", res.data);
        setLogs(res.data);
      } catch (err) {
        console.error("Error loading logs", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-8 bg-white dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Import History
        </h1>
        <button
          onClick={() => router.push("/jobs")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          style={{ cursor: "pointer" }}
        >
          View All Jobs
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-300">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-300">No logs found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                  Timestamp
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                  Total Fetched
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                  New
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                  Updated
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                  Failed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log) => (
                <tr
                  key={log._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400">
                    {log.totalFetched}
                  </td>
                  <td className="px-4 py-2 text-sm text-green-600 dark:text-green-400">
                    {log.newJobs}
                  </td>
                  <td className="px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400">
                    {log.updatedJobs}
                  </td>
                  <td className="px-4 py-2 text-sm text-red-600 dark:text-red-400">
                    {log.failedJobs.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
