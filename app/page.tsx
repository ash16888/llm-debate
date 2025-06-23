import DebateSetup from '@/components/DebateSetup';

export default function HomePage() {
  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">LLM Debate</h1>
          <p className="text-lg text-gray-600">
            Организуйте интеллектуальные дебаты между языковыми моделями
          </p>
        </div>
        
        <DebateSetup />
      </div>
    </div>
  );
}