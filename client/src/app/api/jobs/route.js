import axios from "axios";

export async function GET() {
  try {
    const response = await axios.get(`${process.env.EndPointURL}/api/jobs`);
    console.log("Fetched jobs:", response.data);

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching jobs:", err.message);
    return new Response(JSON.stringify({ error: "Failed to fetch  jobs" }), {
      status: 500,
    });
  }
}
