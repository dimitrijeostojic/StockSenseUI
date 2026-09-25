import { Joyride } from 'react-joyride';
import type { EventData, Step } from 'react-joyride';

interface PageTourProps {
  run: boolean;
  steps: Step[];
  onEvent: (data: EventData) => void;
}

export function PageTour({ run, steps, onEvent }: PageTourProps) {
  return (
    <Joyride
      run={run}
      steps={steps}
      onEvent={onEvent}
      continuous
      scrollToFirstStep
      options={{
        buttons: ['back', 'close', 'primary', 'skip'],
        skipBeacon: true,
        overlayClickAction: false,
        primaryColor: '#6d28d9',
        overlayColor: 'rgba(0,0,0,0.5)',
        zIndex: 10000,
        scrollOffset: 80,
      }}
      floatingOptions={{
        shiftOptions: { padding: 20 },
        flipOptions: { padding: 20 },
      }}
    />
  );
}
