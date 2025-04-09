import PolishingSimulator from "@/components/polishing-simulator"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Object Polishing Simulator</h1>
      <p className="mb-6 text-gray-600 max-w-md text-center">
        Click and drag on the object to polish it. The more you polish an area, the shinier it becomes.
      </p>
      <div className="w-full h-[600px]">
        <PolishingSimulator />
      </div>
    </main>
  )
}
