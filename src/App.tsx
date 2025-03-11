
import { GeometryCanvas } from './components/GeometryCanvas';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-hidden relative">
        <GeometryCanvas />
      </div>
      <Toaster />
    </div>
  );
}

export default App;
