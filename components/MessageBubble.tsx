import { ModelType, RoleType } from '@/types/debate';
import { ROLE_PROMPTS } from '@/lib/prompts';

interface MessageBubbleProps {
  model: ModelType;
  role: RoleType;
  content: string;
  round: number;
  isLeft?: boolean;
}

export default function MessageBubble({ 
  model, 
  role, 
  content, 
  round, 
  isLeft = false 
}: MessageBubbleProps) {
  const roleInfo = ROLE_PROMPTS[role];
  
  return (
    <div className={`flex ${isLeft ? 'justify-start' : 'justify-end'} mb-6`}>
      <div className={`max-w-3xl ${isLeft ? 'mr-auto' : 'ml-auto'}`}>
        <div className={`flex items-center gap-2 mb-2 ${isLeft ? '' : 'justify-end'}`}>
          <span className="text-sm font-medium text-gray-600">
            {roleInfo.name}
          </span>
          <span className="text-sm text-gray-500">
            ({model} • Раунд {round})
          </span>
        </div>
        
        <div 
          className={`
            p-4 rounded-lg shadow-sm
            ${isLeft 
              ? 'bg-gray-100 text-gray-800' 
              : 'bg-blue-500 text-white'
            }
          `}
        >
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
      </div>
    </div>
  );
}