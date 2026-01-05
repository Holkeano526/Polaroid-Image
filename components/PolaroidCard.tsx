
import React from 'react';

interface PolaroidCardProps {
  imageUrl: string;
  caption: string;
  className?: string;
  isDeveloping?: boolean;
}

export const PolaroidCard: React.FC<PolaroidCardProps> = ({ 
  imageUrl, 
  caption, 
  className = "",
  isDeveloping = false 
}) => {
  return (
    <div className={`relative transition-all duration-700 ${className}`}>
      {/* Outer White Frame */}
      <div className="polaroid-frame bg-white p-4 pb-14 shadow-xl border border-gray-100 flex flex-col items-center">
        {/* Photo Area */}
        <div className="relative aspect-square w-full overflow-hidden bg-gray-50 border border-gray-200">
          {isDeveloping ? (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-t-white border-white/20 rounded-full animate-spin"></div>
              <p className="text-white/60 text-xs font-medium animate-pulse">Developing...</p>
            </div>
          ) : (
            <img 
              src={imageUrl} 
              alt="Polaroid Content" 
              className="w-full h-full object-cover grayscale-[10%] contrast-[110%] brightness-[105%]"
            />
          )}
          {/* Subtle Flash Glare Overlay */}
          {!isDeveloping && (
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50"></div>
          )}
        </div>
        
        {/* Caption Area */}
        <div className="w-full mt-4 flex justify-center overflow-hidden">
          <span className="font-pen text-3xl text-gray-700 whitespace-nowrap opacity-80 rotate-[-1deg]">
            {caption || "A moment in time"}
          </span>
        </div>
      </div>
      
      {/* Tape Effect */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-white/40 backdrop-blur-sm border border-white/20 rotate-1 shadow-sm opacity-60"></div>
    </div>
  );
};
