
import React from 'react';
import { Button } from './ui/button';
import { 
  CircleIcon, 
  SquareIcon, 
  TriangleIcon, 
  LineIcon, 
  HandIcon, 
  PencilIcon, 
  TrashIcon,
  SettingsIcon,
  ZoomInIcon,
  ZoomOutIcon
} from 'lucide-react';

interface MobileToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDelete: () => void;
  onPropertiesToggle: () => void;
}

export const MobileToolbar: React.FC<MobileToolbarProps> = ({
  activeTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onDelete,
  onPropertiesToggle
}) => {
  return (
    <div className="mobile-toolbar">
      <Button
        variant={activeTool === 'select' ? 'default' : 'ghost'}
        size="icon"
        className="touch-target"
        onClick={() => onToolChange('select')}
        aria-label="Select"
      >
        <HandIcon size={24} />
      </Button>
      
      <Button
        variant={activeTool === 'draw' ? 'default' : 'ghost'}
        size="icon"
        className="touch-target"
        onClick={() => onToolChange('draw')}
        aria-label="Draw"
      >
        <PencilIcon size={24} />
      </Button>
      
      <Button
        variant={activeTool === 'circle' ? 'default' : 'ghost'}
        size="icon"
        className="touch-target"
        onClick={() => onToolChange('circle')}
        aria-label="Circle"
      >
        <CircleIcon size={24} />
      </Button>
      
      <Button
        variant={activeTool === 'rectangle' ? 'default' : 'ghost'}
        size="icon"
        className="touch-target"
        onClick={() => onToolChange('rectangle')}
        aria-label="Rectangle"
      >
        <SquareIcon size={24} />
      </Button>
      
      <Button
        variant={activeTool === 'triangle' ? 'default' : 'ghost'}
        size="icon"
        className="touch-target"
        onClick={() => onToolChange('triangle')}
        aria-label="Triangle"
      >
        <TriangleIcon size={24} />
      </Button>
      
      <Button
        variant={activeTool === 'line' ? 'default' : 'ghost'}
        size="icon"
        className="touch-target"
        onClick={() => onToolChange('line')}
        aria-label="Line"
      >
        <LineIcon size={24} />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="touch-target"
        onClick={onZoomIn}
        aria-label="Zoom In"
      >
        <ZoomInIcon size={24} />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="touch-target"
        onClick={onZoomOut}
        aria-label="Zoom Out"
      >
        <ZoomOutIcon size={24} />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="touch-target"
        onClick={onDelete}
        aria-label="Delete"
      >
        <TrashIcon size={24} />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="touch-target"
        onClick={onPropertiesToggle}
        aria-label="Properties"
      >
        <SettingsIcon size={24} />
      </Button>
    </div>
  );
};
