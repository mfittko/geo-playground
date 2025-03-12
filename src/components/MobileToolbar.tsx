
import React from 'react';
import { OperationMode } from '@/types/shapes';
import { cn } from '@/lib/utils';
import { 
  MoveDiagonal, 
  Square, 
  RotateCcw, 
  Circle as CircleIcon, 
  Line, 
  Pointer, 
  Triangle as TriangleIcon
} from 'lucide-react';
import { Button } from './ui/button';

interface MobileToolbarProps {
  activeMode: OperationMode;
  onModeChange: (mode: OperationMode) => void;
  onShapeTypeChange: (type: 'rectangle' | 'circle' | 'triangle' | 'line') => void;
  activeShapeType: 'rectangle' | 'circle' | 'triangle' | 'line';
  className?: string;
}

const MobileToolbar: React.FC<MobileToolbarProps> = ({
  activeMode,
  onModeChange,
  onShapeTypeChange,
  activeShapeType,
  className
}) => {
  return (
    <div className={cn("flex flex-wrap justify-center gap-2 p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow", className)}>
      <div className="flex gap-1 mb-1">
        <Button 
          size="icon" 
          variant={activeMode === 'select' ? 'default' : 'outline'}
          onClick={() => onModeChange('select')}
          className="touch-manipulation"
          aria-label="Select mode"
        >
          <Pointer className="h-4 w-4" />
        </Button>
        
        <Button 
          size="icon" 
          variant={activeMode === 'create' ? 'default' : 'outline'}
          onClick={() => onModeChange('create')}
          className="touch-manipulation"
          aria-label="Create mode"
        >
          <Square className="h-4 w-4" />
        </Button>
        
        <Button 
          size="icon" 
          variant={activeMode === 'move' ? 'default' : 'outline'}
          onClick={() => onModeChange('move')}
          className="touch-manipulation"
          aria-label="Move mode"
        >
          <MoveDiagonal className="h-4 w-4" />
        </Button>
        
        <Button 
          size="icon" 
          variant={activeMode === 'rotate' ? 'default' : 'outline'}
          onClick={() => onModeChange('rotate')}
          className="touch-manipulation"
          aria-label="Rotate mode"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      
      {activeMode === 'create' && (
        <div className="flex gap-1">
          <Button 
            size="icon" 
            variant={activeShapeType === 'rectangle' ? 'default' : 'outline'}
            onClick={() => onShapeTypeChange('rectangle')}
            className="touch-manipulation"
            aria-label="Rectangle"
          >
            <Square className="h-4 w-4" />
          </Button>
          
          <Button 
            size="icon" 
            variant={activeShapeType === 'circle' ? 'default' : 'outline'}
            onClick={() => onShapeTypeChange('circle')}
            className="touch-manipulation"
            aria-label="Circle"
          >
            <CircleIcon className="h-4 w-4" />
          </Button>
          
          <Button 
            size="icon" 
            variant={activeShapeType === 'triangle' ? 'default' : 'outline'}
            onClick={() => onShapeTypeChange('triangle')}
            className="touch-manipulation"
            aria-label="Triangle"
          >
            <TriangleIcon className="h-4 w-4" />
          </Button>
          
          <Button 
            size="icon" 
            variant={activeShapeType === 'line' ? 'default' : 'outline'}
            onClick={() => onShapeTypeChange('line')}
            className="touch-manipulation"
            aria-label="Line"
          >
            <Line className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MobileToolbar;
