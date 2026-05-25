export async function GET() {
  const response = await fetch(
    "https://evolution-api-latest-idzi.onrender.com/instance/create",
    {
      method: "POST",
      headers: {
        apikey: process.env.EVOLUTION_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instanceName: "ears-prod-01",
      }),
    }
  );

  const data = await response.json();

  return Response.json(data);
}
