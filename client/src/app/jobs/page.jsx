"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get("/api/jobs");
        setJobs(res.data);
      } catch (err) {
        console.error("Error loading jobs:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const totalPages = Math.ceil(jobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const currentJobs = jobs.slice(startIndex, startIndex + jobsPerPage);

  return (
    <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white">
        Jobs
      </h1>

      <button
        onClick={() => router.push("/")}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        style={{ cursor: "pointer" }}
      >
        View All imports
      </button>
      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-300">
          Loading...
        </p>
      ) : currentJobs.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-300">
          No jobs found.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto shadow rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Published
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Link
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {currentJobs.map((job) => (
                  <tr
                    key={job._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition duration-150"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white">
                      {job.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
                      {job.company}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-700 dark:text-green-400">
                      {job.jobType}
                    </td>
                    <td className="px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
                      {job.jobLocation}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                      {new Date(job.publishedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center mt-6 space-x-2">
            <button
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ← Prev
            </button>
            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
