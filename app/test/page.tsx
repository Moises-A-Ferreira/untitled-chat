import { useEffect, useState } from "react";

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/check?cpf=11999999999");
      const data = await response.json();
      setResult(data);
      console.log("API Response:", data);
    } catch (error: any) {
      console.error("API Error:", error);
      setResult({ error: error.message || "Unknown error" });
    }
    setLoading(false);
  };

  useEffect(() => {
    testApi();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>API Test Page</h1>
      <button 
        onClick={testApi} 
        disabled={loading}
        style={{ padding: "10px 20px", margin: "10px" }}
      >
        {loading ? "Testing..." : "Test API"}
      </button>
      
      {result && (
        <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f0f0f0" }}>
          <h2>Result:</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}