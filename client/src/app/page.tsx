"use client";
import Image from "next/image";
import ImportHistory from "../components/ImportHistory";

export default function Home() {
  return (
    <div>
      <p className="mt-4">This is a import History.</p>
      <ImportHistory />
    </div>
  );
}
